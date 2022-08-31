import { INetworkRpcClient } from '../proto/packages/trackerless-network/protos/NetworkRpc.client'
import { PeerDescriptor, UUID, PeerID } from '@streamr/dht'
import {
    DataMessage,
    HandshakeRequest,
    InterleaveNotice,
    LeaveNotice, NeighborUpdate
} from '../proto/packages/trackerless-network/protos/NetworkRpc'
import { DhtRpcOptions } from '@streamr/dht/dist/src/rpc-protocol/DhtRpcOptions'
import { Logger } from '@streamr/utils'
import { ProtoRpcClient } from '@streamr/proto-rpc'

interface HandshakeResponse {
    accepted: boolean
    interleaveTarget?: PeerDescriptor
}

const logger = new Logger(module)

export class RemoteRandomGraphNode {
    private remotePeerDescriptor: PeerDescriptor
    private client: ProtoRpcClient<INetworkRpcClient>
    private graphId: string
    private neighbors: PeerDescriptor[]
    constructor(peerDescriptor: PeerDescriptor, graphId: string, client: ProtoRpcClient<INetworkRpcClient>) {
        this.remotePeerDescriptor = peerDescriptor
        this.client = client
        this.graphId = graphId
        this.neighbors = []
    }

    async handshake(
        ownPeerDescriptor: PeerDescriptor,
        neighbors: string[],
        peerView: string[],
        concurrentHandshakeTargetId?: string,
        interleaving = false
    ): Promise<HandshakeResponse> {

        const request: HandshakeRequest = {
            randomGraphId: this.graphId,
            requestId: new UUID().toString(),
            senderId: PeerID.fromValue(ownPeerDescriptor.peerId).toMapKey(),
            neighbors,
            peerView,
            concurrentHandshakeTargetId,
            interleaving,
            senderDescriptor: ownPeerDescriptor
        }
        const options: DhtRpcOptions = {
            sourceDescriptor: ownPeerDescriptor as PeerDescriptor,
            targetDescriptor: this.remotePeerDescriptor as PeerDescriptor
        }
        try {
            const response = await this.client.handshake(request, options)
            return {
                accepted: response.accepted,
                interleaveTarget: response.interleaveTarget
            }
        } catch (err) {
            logger.debug(err)
            return {
                accepted: false
            }
        }
    }

    async sendData(ownPeerDescriptor: PeerDescriptor, dataMessage: DataMessage): Promise<void> {
        const options: DhtRpcOptions = {
            sourceDescriptor: ownPeerDescriptor as PeerDescriptor,
            targetDescriptor: this.remotePeerDescriptor as PeerDescriptor,
            notification: true
        }
        try {
            this.client.sendData(dataMessage, options)
        } catch (err) {
            logger.debug(err)
        }
    }

    interleaveNotice(ownPeerDescriptor: PeerDescriptor, originatorDescriptor: PeerDescriptor): void {
        const options: DhtRpcOptions = {
            sourceDescriptor: ownPeerDescriptor as PeerDescriptor,
            targetDescriptor: this.remotePeerDescriptor as PeerDescriptor,
            notification: true
        }
        const notification: InterleaveNotice = {
            randomGraphId: this.graphId,
            interleaveTarget: originatorDescriptor,
            senderId: PeerID.fromValue(ownPeerDescriptor.peerId).toMapKey()
        }
        this.client.interleaveNotice(notification, options)
    }

    leaveNotice(ownPeerDescriptor: PeerDescriptor): void {
        const options: DhtRpcOptions = {
            sourceDescriptor: ownPeerDescriptor as PeerDescriptor,
            targetDescriptor: this.remotePeerDescriptor as PeerDescriptor,
            notification: true
        }
        const notification: LeaveNotice = {
            senderId: PeerID.fromValue(ownPeerDescriptor.peerId).toMapKey(),
            randomGraphId: this.graphId
        }
        this.client.leaveNotice(notification, options)
    }

    getPeerDescriptor(): PeerDescriptor {
        return this.remotePeerDescriptor
    }

    async updateNeighbors(ownPeerDescriptor: PeerDescriptor, neighbors: PeerDescriptor[]): Promise<PeerDescriptor[]> {
        const options: DhtRpcOptions = {
            sourceDescriptor: ownPeerDescriptor as PeerDescriptor,
            targetDescriptor: this.remotePeerDescriptor as PeerDescriptor,
        }
        const request: NeighborUpdate = {
            senderId: PeerID.fromValue(ownPeerDescriptor.peerId).toMapKey(),
            randomGraphId: this.graphId,
            neighborDescriptors: neighbors
        }
        try {
            const response = await this.client.neighborUpdate(request, options)
            return response.neighborDescriptors!
        } catch (err) {
            logger.debug(err)
            return []
        }
    }

    setLocalNeighbors(neighbors: PeerDescriptor[]): void {
        this.neighbors = neighbors
    }

    getLocalNeighbors(): PeerDescriptor[] {
        return this.neighbors
    }
}
