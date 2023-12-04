import { areEqualBinaries, binaryToHex } from '@streamr/utils'
import { PeerDescriptor } from '../proto/packages/dht/protos/DhtRpc'
import { PeerID, PeerIDKey, createPeerIDKey } from './PeerID'

export const peerIdFromPeerDescriptor = (peerDescriptor: PeerDescriptor): PeerID => {
    return PeerID.fromValue(peerDescriptor.nodeId)
}

// TODO could move getNodeIdFromPeerDescriptor (and NodeID) from trackerless-network
export const getNodeIdFromPeerDescriptor = (peerDescriptor: PeerDescriptor): string => {
    return binaryToHex(peerDescriptor.nodeId)
}

export const keyFromPeerDescriptor = (peerDescriptor: PeerDescriptor): PeerIDKey => {
    return createPeerIDKey(peerDescriptor.nodeId)
}

export const areEqualPeerDescriptors = (peerDescriptor1: PeerDescriptor, peerDescriptor2: PeerDescriptor): boolean => {
    return areEqualBinaries(peerDescriptor1.nodeId, peerDescriptor2.nodeId)
}
