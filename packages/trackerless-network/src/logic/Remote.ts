import { DhtRpcOptions, PeerDescriptor } from '@streamr/dht'
import { ProtoRpcClient } from '@streamr/proto-rpc'

export abstract class Remote<T> {
    protected remotePeerDescriptor: PeerDescriptor
    protected client: ProtoRpcClient<T>
    protected graphId: string

    constructor(peerDescriptor: PeerDescriptor, graphId: string, client: ProtoRpcClient<T>) {
        this.remotePeerDescriptor = peerDescriptor
        this.client = client
        this.graphId = graphId
    }

    getPeerDescriptor(): PeerDescriptor {
        return this.remotePeerDescriptor
    }

    formDhtRpcOptions(
        ownPeerDescriptor: PeerDescriptor,
        opts?: Omit<Partial<DhtRpcOptions>, 'sourceDescriptor' | 'targetDescriptor'>
    ): DhtRpcOptions {
        return {
            sourceDescriptor: ownPeerDescriptor,
            targetDescriptor: this.remotePeerDescriptor,
            ...opts
        }
    }
}
