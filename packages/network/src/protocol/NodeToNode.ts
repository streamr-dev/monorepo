import { EventEmitter } from 'events'
import { ControlLayer, MessageLayer } from 'streamr-client-protocol'
import { Logger } from '../helpers/Logger'
import { decode } from './utils'
import { IWebRtcEndpoint, Event as WebRtcEndpointEvent } from '../connection/IWebRtcEndpoint'
import { PeerInfo } from '../connection/PeerInfo'
import { Rtts } from "../identifiers"
import { NodeId } from '../logic/node/Node'

export enum Event {
    NODE_CONNECTED = 'streamr:node-node:node-connected',
    NODE_DISCONNECTED = 'streamr:node-node:node-disconnected',
    DATA_RECEIVED = 'streamr:node-node:stream-data',
    UNICAST_RECEIVED = 'streamr:node-node:unicast-received',
    LOW_BACK_PRESSURE = 'streamr:node-node:low-back-pressure',
    HIGH_BACK_PRESSURE = 'streamr:node-node:high-back-pressure',
}

const eventPerType: { [key: number]: string } = {}
eventPerType[ControlLayer.ControlMessage.TYPES.BroadcastMessage] = Event.DATA_RECEIVED
eventPerType[ControlLayer.ControlMessage.TYPES.UnicastMessage] = Event.UNICAST_RECEIVED

export interface NodeToNode {
    on(event: Event.NODE_CONNECTED, listener: (nodeId: NodeId) => void): this
    on(event: Event.NODE_DISCONNECTED, listener: (nodeId: NodeId) => void): this
    on(event: Event.DATA_RECEIVED, listener: (message: ControlLayer.BroadcastMessage, nodeId: NodeId) => void): this
    on(event: Event.UNICAST_RECEIVED, listener: (message: ControlLayer.UnicastMessage, nodeId: NodeId) => void): this
    on(event: Event.LOW_BACK_PRESSURE, listener: (nodeId: NodeId) => void): this
    on(event: Event.HIGH_BACK_PRESSURE, listener: (nodeId: NodeId) => void): this
}

export class NodeToNode extends EventEmitter {
    private readonly endpoint: IWebRtcEndpoint
    private readonly logger: Logger

    constructor(endpoint: IWebRtcEndpoint) {
        super()
        this.endpoint = endpoint
        endpoint.on(WebRtcEndpointEvent.PEER_CONNECTED, (peerInfo) => this.onPeerConnected(peerInfo))
        endpoint.on(WebRtcEndpointEvent.PEER_DISCONNECTED, (peerInfo) => this.onPeerDisconnected(peerInfo))
        endpoint.on(WebRtcEndpointEvent.MESSAGE_RECEIVED, (peerInfo, message) => this.onMessageReceived(peerInfo, message))
        endpoint.on(WebRtcEndpointEvent.LOW_BACK_PRESSURE, (peerInfo) => this.onLowBackPressure(peerInfo))
        endpoint.on(WebRtcEndpointEvent.HIGH_BACK_PRESSURE, (peerInfo) => this.onHighBackPressure(peerInfo))
        this.logger = new Logger(module)
    }

    connectToNode(
        receiverNodeId: NodeId,
        trackerAddress: string,
        trackerInstructed = true
    ): Promise<NodeId> {
        return this.endpoint.connect(receiverNodeId, trackerAddress, trackerInstructed)
    }

    sendData(receiverNodeId: NodeId, streamMessage: MessageLayer.StreamMessage): Promise<ControlLayer.BroadcastMessage> {
        return this.send(receiverNodeId, new ControlLayer.BroadcastMessage({
            requestId: '', // TODO: how to echo here the requestId of the original SubscribeRequest?
            streamMessage,
        }))
    }

    send<T>(receiverNodeId: NodeId, message: T & ControlLayer.ControlMessage): Promise<T> {
        const [controlLayerVersion, messageLayerVersion] = this.getNegotiatedProtocolVersionsOnNode(receiverNodeId)
        return this.endpoint.send(receiverNodeId, message.serialize(controlLayerVersion, messageLayerVersion)).then(() => message)
    }

    disconnectFromNode(receiverNodeId: NodeId, reason: string): void {
        this.endpoint.close(receiverNodeId, reason)
    }

    /**
     * @deprecated
     */
    getAddress(): string {
        return this.endpoint.getAddress()
    }

    stop(): void {
        this.endpoint.stop()
    }

    onPeerConnected(peerInfo: PeerInfo): void {
        if (peerInfo.isNode()) {
            this.emit(Event.NODE_CONNECTED, peerInfo.peerId)
        }
    }

    onPeerDisconnected(peerInfo: PeerInfo): void {
        if (peerInfo.isNode()) {
            this.emit(Event.NODE_DISCONNECTED, peerInfo.peerId)
        }
    }

    onMessageReceived(peerInfo: PeerInfo, rawMessage: string): void {
        if (peerInfo.isNode()) {
            const message = decode(rawMessage, ControlLayer.ControlMessage.deserialize)
            if (message != null) {
                this.emit(eventPerType[message.type], message, peerInfo.peerId)
            } else {
                this.logger.warn('invalid message from %s: %s', peerInfo, rawMessage)
            }
        }
    }

    onLowBackPressure(peerInfo: PeerInfo): void {
        if (peerInfo.isNode()) {
            this.emit(Event.LOW_BACK_PRESSURE, peerInfo.peerId)
        }
    }

    onHighBackPressure(peerInfo: PeerInfo): void {
        if (peerInfo.isNode()) {
            this.emit(Event.HIGH_BACK_PRESSURE, peerInfo.peerId)
        }
    }

    getRtts(): Readonly<Rtts> {
        return this.endpoint.getRtts()
    }

    getNegotiatedProtocolVersionsOnNode(nodeId: NodeId): [number, number] {
        const messageLayerVersion = this.endpoint.getNegotiatedMessageLayerProtocolVersionOnNode(nodeId)
            || this.endpoint.getDefaultMessageLayerProtocolVersion()
        const controlLayerVersion = this.endpoint.getNegotiatedControlLayerProtocolVersionOnNode(nodeId)
            || this.endpoint.getDefaultControlLayerProtocolVersion()
        return [controlLayerVersion, messageLayerVersion]
    }

    getAllConnectionNodeIds(): NodeId[] {
        return this.endpoint.getAllConnectionNodeIds()
    }
}
