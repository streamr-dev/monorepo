import { Logger, NetworkNode } from 'streamr-network'
import { StreamMessage, keyToArrayIndex, SPID, SPIDKey } from 'streamr-client-protocol'
import StreamrClient from 'streamr-client'
import { EthereumStorageEvent } from 'streamr-client/dist/types/src/NodeRegistry'

const logger = new Logger(module)

let skipPollResultSoonAfterEvent = false
export interface StorageConfigListener {
    onSPIDAdded: (spid: SPID) => void
    onSPIDRemoved: (spid: SPID) => void
}

const getSPIDKeys = (streamId: string, partitions: number): SPIDKey[] => {
    const keys: SPIDKey[] = []
    for (let i = 0; i < partitions; i++) {
        keys.push(SPID.toKey(streamId, i))
    }
    return keys
}

export type AssignmentMessage = {
    stream: {
        id: string,
        partitions: number,
    },
    event: 'STREAM_ADDED' | 'STREAM_REMOVED',
}

export class StorageConfig {

    static ASSIGNMENT_EVENT_STREAM_ID_SUFFIX = '/storage-node-assignments'

    private spidKeys: Set<SPIDKey>
    listeners: StorageConfigListener[]
    clusterId: string
    clusterSize: number
    myIndexInCluster: number
    private poller!: ReturnType<typeof setTimeout>
    private stopPoller: boolean
    streamrClient: StreamrClient
    networkNode: NetworkNode

    // use createInstance method instead: it fetches the up-to-date config from API
    constructor(
        clusterId: string,
        clusterSize: number,
        myIndexInCluster: number,
        streamrClient: StreamrClient,
        networkNode: NetworkNode
    ) {
        this.spidKeys = new Set<SPIDKey>()
        this.listeners = []
        this.clusterId = clusterId
        this.clusterSize = clusterSize
        this.myIndexInCluster = myIndexInCluster
        this.stopPoller = false
        this.streamrClient = streamrClient
        this.networkNode = networkNode
    }

    static async createInstance(
        clusterId: string,
        clusterSize: number,
        myIndexInCluster: number,
        pollInterval: number,
        streamrClient: StreamrClient
    ): Promise<StorageConfig> {
        const networkNode = await streamrClient.getNode()
        const instance = new StorageConfig(clusterId, clusterSize, myIndexInCluster, streamrClient, networkNode)
        // eslint-disable-next-line no-underscore-dangle
        if (pollInterval !== 0) {
            await instance.poll(pollInterval)
        } else {
            await instance.refresh()
        }

        return instance
    }

    /*
     * Connects to Core API and queries the configuration there.
     * Refreshes the config at regular intervals.
     */
    private async poll(pollInterval: number): Promise<void> {
        if (this.stopPoller) { return }

        try {
            await this.refresh()
        } catch (err) {
            logger.warn(`Unable to refresh storage config: ${err}`)
        }

        if (this.stopPoller) { return }

        clearTimeout(this.poller)
        // eslint-disable-next-line require-atomic-updates
        this.poller = setTimeout(() => this.poll(pollInterval), pollInterval)
    }

    hasSPID(spid: SPID): boolean {
        const key = SPID.toKey(spid.streamId, spid.streamPartition)
        return this.spidKeys.has(key)
    }

    getSPIDs(): SPID[] {
        return Array.from(this.spidKeys, (key) => SPID.from(key))
    }

    addChangeListener(listener: StorageConfigListener): void {
        this.listeners.push(listener)
    }

    async refresh(): Promise<void> {
        const streamsToStore = await this.streamrClient.getStoredStreamsOf(this.clusterId)
        if (!skipPollResultSoonAfterEvent) {

            const spidKeys = new Set<SPIDKey>(streamsToStore.flatMap((stream: { id: string, partitions: number }) => ([
                ...getSPIDKeys(stream.id, stream.partitions)
            ])).filter ((key: SPIDKey) => this.belongsToMeInCluster(key)))
            this.setSPIDKeys(spidKeys)
        }
    }

    private setSPIDKeys(newKeys: Set<SPIDKey>): void {
        const oldKeys = this.spidKeys
        const added = new Set([...newKeys].filter((x) => !oldKeys.has(x)))
        const removed = new Set([...oldKeys].filter((x) => !newKeys.has(x)))

        if (added.size > 0) {
            this.addSPIDKeys(added)
        }

        if (removed.size > 0) {
            this.prepareToRemoveStreams(removed)
        }
    }

    private removeConfirmations = new Map<SPIDKey, number>()

    private prepareToRemoveStreams(keysToRemove: Set<SPIDKey>): void {
        // only remove streams after removed for REMOVE_CONFIRMATIONS polls
        // works around timing issue between storage assignment events and storage endpoint
        // i.e. poll result may be outdated, so storage can be added, removed in
        // outdated poll, then added again in next poll
        const REMOVE_CONFIRMATIONS = 2
        for (const key of keysToRemove) {
            // count confirmations
            const confirmations = (Number(this.removeConfirmations.get(key)) + 1) || 1
            this.removeConfirmations.set(key, confirmations)
        }

        const confirmedForRemoval = new Set<SPIDKey>()
        for (const [key, confirmations] of this.removeConfirmations) {
            if (confirmations >= REMOVE_CONFIRMATIONS) {
                // got enough confirmations, remove
                confirmedForRemoval.add(key)
                this.removeConfirmations.delete(key)
            }

            if (!keysToRemove.has(key)) {
                if (confirmations === 1) {
                    this.removeConfirmations.delete(key)
                } else {
                    this.removeConfirmations.set(key, confirmations - 1)
                }
            }
        }

        return this.removeSPIDKeys(confirmedForRemoval)
    }

    private addSPIDKeys(keysToAdd: Set<SPIDKey>): void {
        logger.info('Add %d partitions to storage config: %s', keysToAdd.size, Array.from(keysToAdd).join(','))
        this.spidKeys = new Set([...this.spidKeys, ...keysToAdd])
        this.listeners.forEach((listener) => {
            keysToAdd.forEach((key: SPIDKey) => listener.onSPIDAdded(SPID.from(key)))
        })
    }

    private removeSPIDKeys(keysToRemove: Set<SPIDKey>): void {
        logger.info('Remove %d partitions from storage config: %s', keysToRemove.size, Array.from(keysToRemove).join(','))
        this.spidKeys = new Set([...this.spidKeys].filter((x) => !keysToRemove.has(x)))
        this.listeners.forEach((listener) => {
            keysToRemove.forEach((key: SPIDKey) => listener.onSPIDRemoved(SPID.from(key)))
        })
    }

    private belongsToMeInCluster(key: SPIDKey): boolean {
        const hashedIndex = keyToArrayIndex(this.clusterSize, key.toString())
        return hashedIndex === this.myIndexInCluster
    }

    startAssignmentEventListener(
        streamrAddress: string): (msg: StreamMessage<AssignmentMessage>
    ) => void {
        const assignmentStreamId = this.getAssignmentStreamId(streamrAddress)
        const messageListener = (msg: StreamMessage<AssignmentMessage>) => {
            if (msg.messageId.streamId === assignmentStreamId) {
                const content = msg.getParsedContent() as any
                const keys = new Set(getSPIDKeys(content.stream.id, content.stream.partitions))
                if (content.event === 'STREAM_ADDED') {
                    this.addSPIDKeys(keys)
                } else if (content.event === 'STREAM_REMOVED') {
                    this.removeSPIDKeys(keys)
                }
            }
        }
        // TODO: NET-637 use client instead of networkNode?
        this.networkNode.addMessageListener(messageListener)
        this.networkNode.subscribe(new SPID(assignmentStreamId, 0))
        return messageListener
    }

    onAssignmentEvent(content: { storageNode: string, stream: { id: string, partitions: number }, event: string }): void {
        if (content.storageNode && typeof content.storageNode === 'string' && content.storageNode.toLowerCase() === this.clusterId.toLowerCase()) {
            logger.trace('Received storage assignment message: %o', content)
            const keys = new Set(
                getSPIDKeys(content.stream.id, content.stream.partitions)
                    .filter ((key: SPIDKey) => this.belongsToMeInCluster(key))
            )

            logger.trace('Adding %d of %d partitions in stream %s to this instance', keys.size, content.stream.partitions, content.stream.id)

            if (content.event === 'STREAM_ADDED') {
                this.addSPIDKeys(keys)
            } else if (content.event === 'STREAM_REMOVED') {
                this.removeSPIDKeys(keys)
            }
        } else if (!content.storageNode) {
            logger.error('Received storage assignment message with no storageNode field present: %o', content)
        } else {
            logger.trace('Received storage assignment message for another storage node: %o', content)
        }
    }

    stopAssignmentEventListener(
        messageListener: (msg: StreamMessage<AssignmentMessage>) => void,
        streamrAddress: string
    ): void {
        // TODO: NET-637 use client instead of networkNode?
        this.networkNode.removeMessageListener(messageListener)
        const assignmentStreamId = this.getAssignmentStreamId(streamrAddress)
        this.networkNode.unsubscribe(new SPID(assignmentStreamId, 0))
    }

    async startChainEventsListener(): Promise<void> {
        const clientAddress = (await this.streamrClient.getAddress()).toLowerCase()
        this.streamrClient.registerStorageEventListener(
            async (event: EthereumStorageEvent) => {
                skipPollResultSoonAfterEvent = true
                if (event.nodeAddress.toLowerCase() !== clientAddress) { return }
                const stream = await this.streamrClient.getStream(event.streamId)
                const streamKeys = new Set(
                    getSPIDKeys(stream.id, stream.partitions)
                        .filter ((key: SPIDKey) => this.belongsToMeInCluster(key))
                )
                if (event.type === 'added') {
                    this.addSPIDKeys(streamKeys)
                }
                if (event.type === 'removed') {
                    this.removeSPIDKeys(streamKeys)
                }
                setTimeout(() => {
                    skipPollResultSoonAfterEvent = false
                }, 10000)
            }
        )
    }

    stopChainEventsListener(): Promise<void> {
        return this.streamrClient.unRegisterStorageEventListeners()
    }

    private getAssignmentStreamId(streamrAddress: string) {
        return streamrAddress + StorageConfig.ASSIGNMENT_EVENT_STREAM_ID_SUFFIX
    }

    cleanup(): void {
        this.stopPoller = true
        clearTimeout(this.poller)
    }
}
