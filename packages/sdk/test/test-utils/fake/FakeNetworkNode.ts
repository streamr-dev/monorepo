import { DhtAddress, PeerDescriptor, getDhtAddressFromRaw } from '@streamr/dht'
import { ExternalRpcClient, ExternalRpcClientClass, NetworkOptions, StreamMessage as NewStreamMessage, ProxyDirection } from '@streamr/trackerless-network'
import { EthereumAddress, MetricsContext, StreamPartID } from '@streamr/utils'
import crypto from 'crypto'
import pull from 'lodash/pull'
import { Lifecycle, scoped } from 'tsyringe'
import { NetworkNodeFactory, NetworkNodeStub } from '../../../src/NetworkNodeFacade'
import { StreamMessageTranslator } from '../../../src/protocol/StreamMessageTranslator'
import { FakeNetwork } from './FakeNetwork'
import { ProtoRpcClient, toProtoRpcClient } from '@streamr/proto-rpc'
import { IMessageType } from '@protobuf-ts/runtime'
import { ServerCallContext } from '@protobuf-ts/runtime-rpc'

type MessageListener = (msg: NewStreamMessage) => void

export class FakeNetworkNode implements NetworkNodeStub {

    private readonly id: DhtAddress
    private readonly options: NetworkOptions
    readonly subscriptions: Set<StreamPartID> = new Set()
    readonly proxiedStreamParts: Set<StreamPartID> = new Set()
    readonly messageListeners: MessageListener[] = []
    private readonly network: FakeNetwork

    constructor(network: FakeNetwork, options: NetworkOptions = {}) {
        this.id = getDhtAddressFromRaw(crypto.randomBytes(10))
        this.options = options
        this.network = network
    }

    getNodeId(): DhtAddress {
        return this.id
    }

    addMessageListener(listener: (msg: NewStreamMessage) => void): void {
        this.messageListeners.push(listener)
    }

    removeMessageListener(listener: (msg: NewStreamMessage) => void): void {
        pull(this.messageListeners, listener)
    }

    async join(streamPartId: StreamPartID, neighborRequirement?: { minCount: number, timeout?: number }): Promise<void> {
        if (neighborRequirement !== undefined) {
            throw new Error('not implemented')
        }
        this.subscriptions.add(streamPartId)
    }

    async leave(streamPartId: StreamPartID): Promise<void> {
        this.subscriptions.delete(streamPartId)
    }

    async broadcast(newStreamMessage: NewStreamMessage): Promise<void> {
        const msg = StreamMessageTranslator.toClientProtocol(newStreamMessage)
        // by adding a subscription we emulate the functionality of real network node, which subscribes to 
        // the stream topology when it publishes a message to a stream
        this.subscriptions.add(msg.getStreamPartID())
        this.network.send(msg, this.id, (node: FakeNetworkNode) => node.subscriptions.has(msg.getStreamPartID()))
    }

    getStreamParts(): StreamPartID[] {
        return [...this.subscriptions]
    }

    getNeighbors(streamPartId: StreamPartID): ReadonlyArray<DhtAddress> {
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
    getMetricsContext(): MetricsContext {
        throw new Error('not implemented')
    }

    // eslint-disable-next-line class-methods-use-this
    getPeerDescriptor(): PeerDescriptor {
        throw new Error('not implemented')
    }

    // eslint-disable-next-line class-methods-use-this
    getOptions(): NetworkOptions {
        return this.options
    }

    hasStreamPart(streamPartId: StreamPartID): boolean {
        return this.subscriptions.has(streamPartId)
    }

    async start(): Promise<void> {
        this.network.addNode(this)
    }

    async stop(): Promise<void> {
        this.network.removeNode(this.id)
    }

    // eslint-disable-next-line class-methods-use-this
    async inspect(): Promise<boolean> {
        return true
    }

    async setProxies(
        streamPartId: StreamPartID,
        nodes: PeerDescriptor[],
        _direction: ProxyDirection,
        _userId: EthereumAddress,
        connectionCount?: number
    ): Promise<void> {
        const enable = (nodes.length > 0) && ((connectionCount === undefined) || (connectionCount > 0))
        if (enable) {
            this.proxiedStreamParts.add(streamPartId)
        } else {
            this.proxiedStreamParts.delete(streamPartId)
        }
    }

    isProxiedStreamPart(streamPartId: StreamPartID): boolean {
        return this.proxiedStreamParts.has(streamPartId)
    }

    // eslint-disable-next-line class-methods-use-this
    getDiagnosticInfo(): Record<string, unknown> {
        return {}
    }

    createExternalRpcClient<T extends ExternalRpcClient>(clientClass: ExternalRpcClientClass<T>): ProtoRpcClient<T> {
        return {} as any
    }

    registerExternalNetworkRpcMethod(): void {}

}

@scoped(Lifecycle.ContainerScoped)
export class FakeNetworkNodeFactory implements NetworkNodeFactory {

    private readonly network: FakeNetwork

    constructor(network: FakeNetwork) {
        this.network = network
    }

    createNetworkNode(opts: NetworkOptions): FakeNetworkNode {
        return new FakeNetworkNode(this.network, opts)
    }
}
