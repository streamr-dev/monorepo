import {
    DataEntry,
    PeerDescriptor,
    RecursiveFindReport
} from '../proto/packages/dht/protos/DhtRpc'
import { IRecursiveFindSessionServiceClient, RecursiveFindSessionServiceClient } from '../proto/packages/dht/protos/DhtRpc.client'
import { DhtRpcOptions } from '../rpc-protocol/DhtRpcOptions'
import { Logger } from '@streamr/utils'
import { ProtoRpcClient, RpcCommunicator, toProtoRpcClient } from '@streamr/proto-rpc'
import { ITransport } from '../transport/ITransport'
import { ListeningRpcCommunicator } from '../exports'
import { PeerIDKey } from '../helpers/PeerID'
import { DataStoreEntry } from './DhtNode'

const logger = new Logger(module)

export class RemoteRecursiveFindSession {

    private rpcCommunicator: RpcCommunicator
    private client: ProtoRpcClient<IRecursiveFindSessionServiceClient>
    private readonly ownPeerDescriptor: PeerDescriptor
    private readonly targetPeerDescriptor: PeerDescriptor

    constructor(
        ownPeerDescriptor: PeerDescriptor,
        targetPeerDescriptor: PeerDescriptor,
        serviceId: string,
        rpcTransport: ITransport
    ) {

        this.ownPeerDescriptor = ownPeerDescriptor
        this.targetPeerDescriptor = targetPeerDescriptor
        this.rpcCommunicator = new ListeningRpcCommunicator(serviceId, rpcTransport, { rpcRequestTimeout: 15000 })
        this.client = toProtoRpcClient(new RecursiveFindSessionServiceClient(this.rpcCommunicator.getRpcClientTransport()))
    }

    reportRecursiveFindResult(closestNodes: PeerDescriptor[], data: Map<PeerIDKey, DataStoreEntry> | undefined, noCloserNodesFound: boolean): void {
        const dataEntries: Array<DataEntry> = []

        if (data) {
            data.forEach((entry) => {
                dataEntries.push({ storer: entry[0], data: entry[1] })
            })
        }

        const report: RecursiveFindReport = {
            nodes: closestNodes,
            dataEntries: dataEntries,
            noCloserNodesFound: noCloserNodesFound
        }
        const options: DhtRpcOptions = {
            sourceDescriptor: this.ownPeerDescriptor,
            targetDescriptor: this.targetPeerDescriptor
        }

        this.client.reportRecursiveFindResult(report, options).catch((_e) => {
            logger.trace('Failed to send RecursiveFindResult rtcOffer')
        })
    }
}
