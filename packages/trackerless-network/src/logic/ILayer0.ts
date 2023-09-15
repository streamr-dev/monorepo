import { DataEntry, ITransport, PeerDescriptor, PeerID, RecursiveFindResult } from '@streamr/dht'
import { Any } from '../proto/google/protobuf/any'

export interface ILayer0 extends ITransport {
    getPeerDescriptor(): PeerDescriptor
    getNodeId(): PeerID
    getDataFromDht(key: Uint8Array): Promise<RecursiveFindResult>
    findDataViaPeer(key: Uint8Array, node: PeerDescriptor): Promise<DataEntry[]>
    storeDataToDht(key: Uint8Array, data: Any): Promise<PeerDescriptor[]>
    deleteDataFromDht(key: Uint8Array): Promise<void>
    getKnownEntryPoints(): PeerDescriptor[]
    isJoinOngoing(): boolean
    stop(): Promise<void>
}
