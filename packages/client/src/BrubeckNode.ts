/**
 * Wrap a network node.
 */
import { inject, Lifecycle, scoped } from 'tsyringe'
import { NetworkNodeOptions, createNetworkNode, NetworkNode, MetricsContext } from 'streamr-network'
import { pOnce, uuid, instanceId } from './utils'
import { Context } from './utils/Context'
import { NetworkConfig, ConfigInjectionToken, TrackerRegistrySmartContract } from './Config'
import { StreamMessage, StreamPartID } from 'streamr-client-protocol'
import { DestroySignal } from './DestroySignal'
import Ethereum from './Ethereum'
import { getTrackerRegistryFromContract } from './getTrackerRegistryFromContract'

// TODO should we make getNode() an internal method, and provide these all these services as client methods?
export interface NetworkNodeStub {
    getNodeId: () => string,
    addMessageListener: (listener: (msg: StreamMessage) => void) => void,
    removeMessageListener: (listener: (msg: StreamMessage) => void) => void
    subscribe: (streamPartId: StreamPartID) => void
    subscribeAndWaitForJoin: (streamPart: StreamPartID, timeout?: number) => Promise<number>
    waitForJoinAndPublish: (msg: StreamMessage, timeout?: number) => Promise<number>
    unsubscribe: (streamPartId: StreamPartID) => void
    publish: (streamMessage: StreamMessage) => void,
    getStreamParts: () => Iterable<StreamPartID>
    getNeighbors: () => ReadonlyArray<string>
    getNeighborsForStreamPart: (streamPartId: StreamPartID) => ReadonlyArray<string>
    getRtt: (nodeId: string) => number|undefined
    setExtraMetadata: (metadata: Record<string, unknown>) => void
    getMetricsContext: () => MetricsContext
    hasStreamPart: (streamPartId: StreamPartID) => boolean
    hasProxyPublishConnection: (streamPartId: StreamPartID, contactNodeId: string) => boolean
    hasProxySubscribeConnection: (streamPartId: StreamPartID, contactNodeId: string) => boolean
}

/**
 * Wrap a network node.
 * Lazily creates & starts node on first call to getNode().
 */
@scoped(Lifecycle.ContainerScoped)
export default class BrubeckNode implements Context {
    private cachedNode?: NetworkNode
    private options
    /** @internal */
    readonly id
    /** @internal */
    readonly debug
    private startNodeCalled = false
    private startNodeComplete = false

    constructor(
        context: Context,
        private destroySignal: DestroySignal,
        private ethereum: Ethereum,
        @inject(ConfigInjectionToken.Network) options: NetworkConfig
    ) {
        this.options = options
        this.id = instanceId(this)
        this.debug = context.debug.extend(this.id)
        destroySignal.onDestroy(this.destroy)
    }

    private assertNotDestroyed() {
        this.destroySignal.assertNotDestroyed(this)
    }

    private async getNormalizedNetworkOptions(): Promise<NetworkNodeOptions> {
        if ((this.options.trackers as TrackerRegistrySmartContract).contractAddress) {
            const trackerRegistry = await getTrackerRegistryFromContract({
                contractAddress: (this.options.trackers as TrackerRegistrySmartContract).contractAddress,
                jsonRpcProvider: this.ethereum.getMainnetProvider()
            })
            return {
                ...this.options,
                trackers: trackerRegistry.getAllTrackers()
            }
        }
        return this.options as NetworkNodeOptions
    }

    private async initNode() {
        this.assertNotDestroyed()
        if (this.cachedNode) { return this.cachedNode }

        const { options } = this
        let { id } = options

        // generate id if none supplied
        if (id == null || id === '') {
            id = await this.generateId()
        } else if (!this.ethereum.isAuthenticated()) {
            throw new Error(`cannot set explicit nodeId ${id} without authentication`)
        } else {
            const ethereumAddress = await this.ethereum.getAddress()
            if (!id.toLowerCase().startsWith(ethereumAddress.toLowerCase())) {
                throw new Error(`given node id ${id} not compatible with authenticated wallet ${ethereumAddress}`)
            }
        }

        this.debug('initNode', id)
        const networkOptions = await this.getNormalizedNetworkOptions()
        const node = createNetworkNode({
            disconnectionWaitTime: 200,
            name: id,
            ...networkOptions,
            id,
            metricsContext: new MetricsContext(options.name ?? id)
        })

        if (!this.destroySignal.isDestroyed()) {
            this.cachedNode = node
        }

        return node
    }

    private async generateId() {
        if (this.ethereum.isAuthenticated()) {
            const address = await this.ethereum.getAddress()
            return `${address}#${uuid()}`
            // eslint-disable-next-line no-else-return
        } else {
            return Ethereum.generateEthereumAccount().address
        }
    }

    /**
     * Stop network node, or wait for it to stop if already stopping.
     * Subsequent calls to getNode/start will fail.
     */
    private destroy = pOnce(async () => {
        this.debug('destroy >>')

        const node = this.cachedNode
        this.cachedNode = undefined
        // stop node only if started or in progress
        if (node && this.startNodeCalled) {
            this.debug('stopping node >>')
            if (!this.startNodeComplete) {
                // wait for start to finish before stopping node
                const startNodeTask = this.startNodeTask()
                this.startNodeTask.reset() // allow subsequent calls to fail
                await startNodeTask
            }

            await node.stop()
            this.debug('stopping node <<')
        }
        this.startNodeTask.reset() // allow subsequent calls to fail

        this.debug('destroy <<')
    })

    /**
     * Start network node, or wait for it to start if already started.
     */
    private startNodeTask = pOnce(async () => {
        this.startNodeCalled = true
        this.debug('start >>')
        try {
            const node = await this.initNode()
            if (!this.destroySignal.isDestroyed()) {
                await node.start()
            }

            if (this.destroySignal.isDestroyed()) {
                this.debug('stopping node before init >>')
                await node.stop()
                this.debug('stopping node before init <<')
            }
            this.assertNotDestroyed()
            return node
        } finally {
            this.startNodeComplete = true
            this.debug('start <<')
        }
    })

    /** @internal */
    startNode: () => Promise<unknown> = this.startNodeTask

    /**
     * Get started network node.
     */
    getNode: () => Promise<NetworkNodeStub> = this.startNodeTask

    /** @internal */
    async getNodeId() {
        const node = await this.getNode()
        return node.getNodeId()
    }

    /**
     * Calls publish on node after starting it.
     * Basically a wrapper around: (await getNode()).publish(…)
     * but will be sync in case that node is already started.
     * Zalgo intentional. See below.
     * @internal
     */
    publishToNode(streamMessage: StreamMessage): void | Promise<void> {
        // NOTE: function is intentionally not async for performance reasons.
        // Will call cachedNode.publish immediately if cachedNode is set.
        // Otherwise will wait for node to start.
        this.debug('publishToNode >> %o', streamMessage.getMessageID())
        try {
            this.destroySignal.assertNotDestroyed(this)

            if (this.isStarting()) {
                // use .then instead of async/await so
                // this.cachedNode.publish call can be sync
                return this.startNodeTask().then((node) => {
                    return node.publish(streamMessage)
                })
            }

            return this.cachedNode!.publish(streamMessage)
        } finally {
            this.debug('publishToNode << %o', streamMessage.getMessageID())
        }
    }

    async openPublishProxyConnectionOnStreamPart(streamPartId: StreamPartID, nodeId: string): Promise<void> {
        try {
            if (this.isStarting()) {
                await this.startNodeTask()
            }
            await this.cachedNode!.joinStreamPartAsProxyPublisher(streamPartId, nodeId)
        } finally {
            this.debug('openProxyConnectionOnStream << %o', streamPartId, nodeId)
        }
    }

    async closePublishProxyConnectionOnStreamPart(streamPartId: StreamPartID, nodeId: string): Promise<void> {
        try {
            if (this.isStarting()) {
                return
            }
            await this.cachedNode!.leaveProxyPublishingStreamPart(streamPartId, nodeId)
        } finally {
            this.debug('closeProxyConnectionOnStream << %o', streamPartId, nodeId)
        }
    }

    async openSubscribeProxyConnectionOnStreamPart(streamPartId: StreamPartID, nodeId: string): Promise<void> {
        try {
            if (this.isStarting()) {
                await this.startNodeTask()
            }
            await this.cachedNode!.joinStreamPartAsProxySubscriber(streamPartId, nodeId)
        } finally {
            this.debug('openProxyConnectionOnStream << %o', streamPartId, nodeId)
        }
    }

    async closeSubscribeProxyConnectionOnStreamPart(streamPartId: StreamPartID, nodeId: string): Promise<void> {
        try {
            if (this.isStarting()) {
                return
            }
            await this.cachedNode!.leaveProxySubscribingStreamPart(streamPartId, nodeId)
        } finally {
            this.debug('closeProxyConnectionOnStream << %o', streamPartId, nodeId)
        }
    }

    private isStarting(): boolean {
        return !this.cachedNode || !this.startNodeComplete
    }
}

