import { PeerDescriptor, PeerID } from '@streamr/dht'
import { shuffle } from 'lodash'
import { RemoteRandomGraphNode } from './RemoteRandomGraphNode'
import { EventEmitter } from 'eventemitter3'

export interface Events {
    peerAdded: (id: string, remote: RemoteRandomGraphNode) => any
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
        if (!this.ownPeerID.equals(PeerID.fromValue(remote.getPeerDescriptor().kademliaId)) && this.peers.size < this.limit) {
            const stringId = this.toStringId(remote.getPeerDescriptor())
            this.peers.set(stringId, remote)
            this.emit('peerAdded', stringId, remote)
        }
    }

    remove(peerDescriptor: PeerDescriptor): void {
        const stringId = this.toStringId(peerDescriptor)
        this.peers.delete(stringId)
    }

    removeById(stringId: string): void {
        this.peers.delete(stringId)
    }

    hasPeer(peerDescriptor: PeerDescriptor): boolean {
        const stringId = this.toStringId(peerDescriptor)
        return this.peers.has(stringId)
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

    getNeighborWithId(id: string): RemoteRandomGraphNode | undefined {
        return this.peers.get(id)
    }

    // eslint-disable-next-line class-methods-use-this
    private toStringId(peerDescriptor: PeerDescriptor): string {
        const peerId = PeerID.fromValue(peerDescriptor.kademliaId)
        const key = peerId.toKey()
        return key
    }

    size(exclude: string[] = []): number {
        return Array.from(this.peers.keys()).filter((peer) => !exclude.includes(peer)).length
    }

    getRandom(exclude: string[]): RemoteRandomGraphNode | undefined {
        const keys = Array.from(this.peers.keys()).filter((key) => !exclude.includes(key))
        const shuffled = shuffle(keys)
        if (shuffled.length) {
            return this.peers.get(shuffled[0])
        }
        return undefined
    }

    getClosest(exclude: string[]): RemoteRandomGraphNode | undefined {
        const excluded = new Map<string, RemoteRandomGraphNode>()
        this.peers.forEach((val, key) => {
            if (!exclude.includes(key)) {
                excluded.set(key, val)
            }
        })
        if (excluded.size === 0) {
            return undefined
        }
        return excluded.get(Array.from(excluded.keys())[0])
    }

    getClosestAndFurthest(exclude: string[]): RemoteRandomGraphNode[] {
        const excluded: RemoteRandomGraphNode[] = []
        this.peers.forEach((val, key) => {
            if (!exclude.includes(key)) {
                excluded.push(val)
            }
        })
        if (excluded.length === 0) {
            return []
        } else if (excluded.length > 1) {
            const toReturn = [excluded[0], excluded[excluded.length - 1]]
            return toReturn.filter((contact) => contact)
        } else {
            return [excluded[0]]
        }
    }

    getFurthest(exclude: string[]): RemoteRandomGraphNode | undefined {
        const excluded = new Map<string, RemoteRandomGraphNode>()
        this.peers.forEach((val, key) => {
            if (!exclude.includes(key)) {
                excluded.set(key, val)
            }
        })
        if (excluded.size === 0) {
            return undefined
        }
        return excluded.get(Array.from(excluded.keys())[excluded.size - 1])
    }

    clear(): void {
        this.peers.clear()
    }

    values(): RemoteRandomGraphNode[] {
        return Array.from(this.peers.values())
    }

    getNeighborByStringId(id: string): RemoteRandomGraphNode | undefined {
        return this.peers.get(id)
    }
}
