import { Remote } from '../Remote'
import { DhtRpcOptions, keyFromPeerDescriptor, PeerDescriptor, UUID } from '@streamr/dht'
import { InterleaveNotice, StreamHandshakeRequest } from '../../proto/packages/trackerless-network/protos/NetworkRpc'
import { Logger } from '@streamr/utils'
import { IHandshakeRpcClient } from '../../proto/packages/trackerless-network/protos/NetworkRpc.client'

const logger = new Logger(module)

interface HandshakeResponse {
    accepted: boolean
    interleaveTargetPeerDescriptor?: PeerDescriptor
}

export class RemoteHandshaker extends Remote<IHandshakeRpcClient> {

    async handshake(
        ownPeerDescriptor: PeerDescriptor,
        neighbors: string[],
        concurrentHandshakeTargetId?: string,
        interleaveSourcePeerId?: string
    ): Promise<HandshakeResponse> {
        const request: StreamHandshakeRequest = {
            randomGraphId: this.graphId,
            requestId: new UUID().toString(),
            senderId: keyFromPeerDescriptor(ownPeerDescriptor),
            neighbors,
            concurrentHandshakeTargetId,
            interleaveSourcePeerId,
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
                interleaveTargetPeerDescriptor: response.interleaveTargetPeerDescriptor
            }
        } catch (err: any) {
            logger.debug(`handshake to ${keyFromPeerDescriptor(this.getPeerDescriptor())} failed: ${err}`)
            return {
                accepted: false
            }
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
            interleaveTargetPeerDescriptor: originatorDescriptor,
            senderId: keyFromPeerDescriptor(ownPeerDescriptor)
        }
        this.client.interleaveNotice(notification, options).catch(() => {
            logger.debug('Failed to send interleaveNotice')
        })
    }
}
