import { StreamID } from '@streamr/protocol'
import { StreamMetadata } from '../../../src/Stream'
import { StreamPermission } from '../../../src/permission'
import { EthereumAddress, Multimap } from '@streamr/utils'
import { StorageNodeMetadata } from '../../../src/contracts/StorageNodeRegistry'

export type PublicPermissionTarget = 'public'
export const PUBLIC_PERMISSION_TARGET: PublicPermissionTarget = 'public'

export interface StreamRegistryItem {
    metadata: StreamMetadata
    permissions: Multimap<EthereumAddress | PublicPermissionTarget, StreamPermission>
}

export class FakeChain {
    readonly streams: Map<StreamID, StreamRegistryItem> = new Map()
    readonly storageAssignments: Multimap<StreamID, EthereumAddress> = new Multimap()
    readonly storageNodeMetadatas: Map<EthereumAddress, StorageNodeMetadata> = new Map()
    readonly erc1271AllowedAddresses: Multimap<EthereumAddress, EthereumAddress> = new Multimap()
}
