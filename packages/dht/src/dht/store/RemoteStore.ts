import { Remote } from '../contact/Remote'
import { IStoreServiceClient } from '../../proto/packages/dht/protos/DhtRpc.client'
import { 
    DeleteDataRequest,
    DeleteDataResponse,
    MigrateDataRequest,
    MigrateDataResponse,
    StoreDataRequest,
    StoreDataResponse
} from '../../proto/packages/dht/protos/DhtRpc'
import { keyFromPeerDescriptor } from '../../helpers/peerIdFromPeerDescriptor'

export class RemoteStore extends Remote<IStoreServiceClient> {

    async storeData(request: StoreDataRequest): Promise<StoreDataResponse> {
        const options = this.formDhtRpcOptions({
            timeout: 10000
        })
        try {
            return await this.client.storeData(request, options)
        } catch (err) {
            throw Error(
                `Could not store data to ${keyFromPeerDescriptor(this.getPeerDescriptor())} from ${keyFromPeerDescriptor(this.ownPeerDescriptor)} ${err}`
            )
        }
    }

    async deleteData(request: DeleteDataRequest): Promise<DeleteDataResponse> {
        const options = this.formDhtRpcOptions({
            timeout: 10000
        })
        try {
            return await this.client.deleteData(request, options)
        } catch (err) {
            throw Error(
                `Could not call delete data to ${keyFromPeerDescriptor(this.getPeerDescriptor())} ${err}`
            )
        }
    }

    async migrateData(request: MigrateDataRequest, doNotConnect: boolean = false): Promise<MigrateDataResponse> {
        const options = this.formDhtRpcOptions({
            timeout: 10000,
            doNotConnect
        })
        return this.client.migrateData(request, options)
    }

}
