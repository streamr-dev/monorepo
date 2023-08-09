import { ProxyDirection, StreamMessage, StreamPartID } from '@streamr/protocol'
import { MetricsContext } from '@streamr/utils'
import pull from 'lodash/pull'
import { Lifecycle, scoped } from 'tsyringe'
import { NetworkNodeFactory, NetworkNodeStub } from '../../../src/NetworkNodeFacade'
import { FakeNetwork } from './FakeNetwork'
import { PeerDescriptor } from '@streamr/dht'
import { NetworkOptions, NodeId } from '@streamr/trackerless-network'

type MessageListener = (msg: StreamMessage) => void

export class FakeNetworkNode implements NetworkNodeStub {

    public readonly id: NodeId
    readonly subscriptions: Set<StreamPartID> = new Set()
    readonly messageListeners: MessageListener[] = []
    private readonly network: FakeNetwork

    constructor(opts: NetworkOptions, network: FakeNetwork) {
        this.id = opts.networkNode!.id!
        this.network = network
    }

    getNodeId(): NodeId {
        return this.id
    }

    addMessageListener(listener: (msg: StreamMessage) => void): void {
        this.messageListeners.push(listener)
    }

    removeMessageListener(listener: (msg: StreamMessage) => void): void {
        pull(this.messageListeners, listener)
    }

    async subscribe(streamPartId: StreamPartID): Promise<void> {
        this.subscriptions.add(streamPartId)
    }

    unsubscribe(streamPartId: StreamPartID): void {
        this.subscriptions.delete(streamPartId)
    }

    async subscribeAndWaitForJoin(streamPartId: StreamPartID, _timeout?: number): Promise<number> {
        this.subscriptions.add(streamPartId)
        return this.getNeighborsForStreamPart(streamPartId).length
    }

    async waitForJoinAndPublish(msg: StreamMessage, _timeout?: number): Promise<number> {
        const streamPartID = msg.getStreamPartID()
        this.subscriptions.add(streamPartID)
        await this.publish(msg)
        return this.getNeighborsForStreamPart(streamPartID).length
    }

    async publish(msg: StreamMessage): Promise<void> {
        // by adding a subscription we emulate the functionality of real network node, which subscribes to 
        // the stream topology when it publishes a message to a stream
        this.subscriptions.add(msg.getStreamPartID())
        this.network.send(msg, this.id, (node: FakeNetworkNode) => node.subscriptions.has(msg.getStreamPartID()))
    }

    // eslint-disable-next-line class-methods-use-this
    getStreamParts(): StreamPartID[] {
        throw new Error('not implemented')
    }

    // eslint-disable-next-line class-methods-use-this
    getNeighbors(): string[] {
        throw new Error('not implemented')
    }

    getNeighborsForStreamPart(streamPartId: StreamPartID): ReadonlyArray<string> {
        const allNodes = this.network.getNodes()
        return allNodes
            .filter((node) => (node.id !== this.id))
            .filter((node) => node.subscriptions.has(streamPartId))
            .map((node) => node.id)
    }

    // eslint-disable-next-line class-methods-use-this
    setStreamPartEntryPoints(_streamPartId: StreamPartID, _peerDescriptors: PeerDescriptor[]): void {
    }

    // eslint-disable-next-line class-methods-use-this
    getRtt(_nodeId: string): number | undefined {
        throw new Error('not implemented')
    }

    // eslint-disable-next-line class-methods-use-this
    setExtraMetadata(_metadata: Record<string, unknown>): void {
        throw new Error('not implemented')
    }

    // eslint-disable-next-line class-methods-use-this
    getMetricsContext(): MetricsContext {
        throw new Error('not implemented')
    }

    // eslint-disable-next-line class-methods-use-this
    getPeerDescriptor(): PeerDescriptor {
        throw new Error('not implemented')
    }

    hasStreamPart(streamPartId: StreamPartID): boolean {
        return this.subscriptions.has(streamPartId)
    }

    // eslint-disable-next-line class-methods-use-this
    hasProxyConnection(_streamPartId: StreamPartID, _contactNodeId: string, _direction: ProxyDirection): boolean {
        throw new Error('not implemented')
    }

    async start(): Promise<void> {
        this.network.addNode(this)
    }

    async stop(): Promise<void> {
        this.network.removeNode(this.id)
    }

    // eslint-disable-next-line class-methods-use-this
    async setProxies(
        _streamPartId: StreamPartID,
        _peerDescriptors: PeerDescriptor[],
        _direction: ProxyDirection,
        _getUserId: () => Promise<string>,
        _targetCount?: number
    ): Promise<void> {
        throw new Error('not implemented')
    }

    // eslint-disable-next-line class-methods-use-this
    getDiagnosticInfo(): Record<string, unknown> {
        return {}
    }
}

@scoped(Lifecycle.ContainerScoped)
export class FakeNetworkNodeFactory implements NetworkNodeFactory {

    private readonly network: FakeNetwork

    constructor(network: FakeNetwork) {
        this.network = network
    }

    createNetworkNode(opts: NetworkOptions): FakeNetworkNode {
        return new FakeNetworkNode(opts, this.network)
    }
}
