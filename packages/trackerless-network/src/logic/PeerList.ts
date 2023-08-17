import { keyFromPeerDescriptor, PeerDescriptor, PeerID, peerIdFromPeerDescriptor } from '@streamr/dht'
import { sample } from 'lodash'
import { RemoteRandomGraphNode } from './RemoteRandomGraphNode'
import { EventEmitter } from 'eventemitter3'

export interface Events {
    peerAdded: (id: string, remote: RemoteRandomGraphNode) => any
}

const getValuesOfIncludedKeys = (peers: Map<string, RemoteRandomGraphNode>, exclude: string[]): RemoteRandomGraphNode[] => {
    return Array.from(peers.entries())
        .filter(([id, _peer]) => !exclude.includes(id))
        .map(([_id, peer]) => peer)
}

export class PeerList extends EventEmitter<Events> {
    private readonly peers: Map<string, RemoteRandomGraphNode>
    private readonly limit: number
    private ownPeerID: PeerID

    constructor(ownPeerId: PeerID, limit: number) {
        super()
        this.peers = new Map()
        this.limit = limit
        this.ownPeerID = ownPeerId
    }

    add(remote: RemoteRandomGraphNode): void {
        if (!this.ownPeerID.equals(peerIdFromPeerDescriptor(remote.getPeerDescriptor())) && this.peers.size < this.limit) {
            const stringId = keyFromPeerDescriptor(remote.getPeerDescriptor())
            const isExistingPeer = this.peers.has(stringId)
            this.peers.set(stringId, remote)
            
            if (!isExistingPeer) {
                this.emit('peerAdded', stringId, remote)
            }
        }
    }

    remove(peerDescriptor: PeerDescriptor): void {
        this.peers.delete(keyFromPeerDescriptor(peerDescriptor))
    }

    removeById(stringId: string): void {
        this.peers.delete(stringId)
    }

    hasPeer(peerDescriptor: PeerDescriptor): boolean {
        return this.peers.has(keyFromPeerDescriptor(peerDescriptor))
    }

    hasPeerWithStringId(stringId: string): boolean {
        return this.peers.has(stringId)
    }

    replaceAll(neighbors: RemoteRandomGraphNode[]): void {
        this.peers.clear()
        const limited = neighbors.splice(0, this.limit)
        limited.forEach((remote) => {
            this.add(remote)
        })
    }

    getStringIds(): string[] {
        return Array.from(this.peers.keys())
    }

    getNeighborById(id: string): RemoteRandomGraphNode | undefined {
        return this.peers.get(id)
    }

    size(exclude: string[] = []): number {
        return Array.from(this.peers.keys()).filter((peer) => !exclude.includes(peer)).length
    }

    getRandom(exclude: string[]): RemoteRandomGraphNode | undefined {
        return sample(getValuesOfIncludedKeys(this.peers, exclude))
    }

    getClosest(exclude: string[]): RemoteRandomGraphNode | undefined {
        const included = getValuesOfIncludedKeys(this.peers, exclude)
        return included[0]
    }

    getClosestAndFurthest(exclude: string[]): RemoteRandomGraphNode[] {
        const included = getValuesOfIncludedKeys(this.peers, exclude)
        if (included.length === 0) {
            return []
        }
        return included.length > 1 ? [this.getClosest(exclude)!, this.getFurthest(exclude)!] : [this.getClosest(exclude)!]
    }

    getFurthest(exclude: string[]): RemoteRandomGraphNode | undefined {
        const included = getValuesOfIncludedKeys(this.peers, exclude)
        return included[included.length - 1]
    }

    getPeers(): RemoteRandomGraphNode[] {
        return Array.from(this.peers.values())
    }

    stop(): void {
        this.peers.clear()
        this.removeAllListeners()
    }
}
