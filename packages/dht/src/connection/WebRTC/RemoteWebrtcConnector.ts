import {
    IceCandidate,
    PeerDescriptor,
    RtcAnswer,
    RtcOffer,
    WebRtcConnectionRequest
} from '../../proto/packages/dht/protos/DhtRpc'
import { IWebRtcConnectorServiceClient } from '../../proto/packages/dht/protos/DhtRpc.client'
import { DhtRpcOptions } from '../../rpc-protocol/DhtRpcOptions'
import { ProtoRpcClient } from '@streamr/proto-rpc'
import { Logger } from '@streamr/utils'

const logger = new Logger(module)

export class RemoteWebrtcConnector {

    private peerDescriptor: PeerDescriptor
    private client: ProtoRpcClient<IWebRtcConnectorServiceClient>

    constructor(peerDescriptor: PeerDescriptor, client: ProtoRpcClient<IWebRtcConnectorServiceClient>) {
        this.peerDescriptor = peerDescriptor
        this.client = client
    }

    requestConnection(sourceDescriptor: PeerDescriptor, connectionId: string): void {
        const request: WebRtcConnectionRequest = {
            connectionId
        }
        const options: DhtRpcOptions = {
            sourceDescriptor: sourceDescriptor,
            targetDescriptor: this.peerDescriptor,
            notification: true
        }

        this.client.requestConnection(request, options).catch((_e) => {
            logger.trace('Failed to send requestConnection')
        })
    }

    sendRtcOffer(sourceDescriptor: PeerDescriptor, description: string, connectionId: string): void {
        const request: RtcOffer = {
            target: this.peerDescriptor,
            requester: sourceDescriptor,
            connectionId,
            description
        }
        const options: DhtRpcOptions = {
            sourceDescriptor: sourceDescriptor,
            targetDescriptor: this.peerDescriptor,
        }

        this.client.rtcOffer(request, options).catch((_e) => {
            logger.trace('Failed to send rtcOffer')
        })
    }

    sendRtcAnswer(sourceDescriptor: PeerDescriptor, description: string, connectionId: string): void {
        const request: RtcAnswer = {
            target: this.peerDescriptor,
            requester: sourceDescriptor,
            connectionId,
            description
        }
        const options: DhtRpcOptions = {
            sourceDescriptor: sourceDescriptor,
            targetDescriptor: this.peerDescriptor,
        }

        this.client.rtcAnswer(request, options).catch((_e) => {
            logger.trace('Failed to send rtcAnswer')
        })
    }

    sendIceCandidate(sourceDescriptor: PeerDescriptor, candidate: string, mid: string, connectionId: string): void {
        const request: IceCandidate = {
            target: this.peerDescriptor,
            requester: sourceDescriptor,
            connectionId,
            mid,
            candidate
        }
        const options: DhtRpcOptions = {
            sourceDescriptor: sourceDescriptor,
            targetDescriptor: this.peerDescriptor,
        }
        this.client.iceCandidate(request, options).catch((_e) => {
            logger.trace('Failed to send iceCandidate')
        })
    }
}

