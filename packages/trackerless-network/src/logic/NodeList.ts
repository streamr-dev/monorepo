import { PeerDescriptor } from '@streamr/dht'
import { sample } from 'lodash'
import { RemoteRandomGraphNode } from './RemoteRandomGraphNode'
import { EventEmitter } from 'eventemitter3'
import { getNodeIdFromPeerDescriptor, NodeID } from '../identifiers'

export interface Events {
    nodeAdded: (id: NodeID, remote: RemoteRandomGraphNode) => any
}

const getValuesOfIncludedKeys = (nodes: Map<NodeID, RemoteRandomGraphNode>, exclude: NodeID[]): RemoteRandomGraphNode[] => {
    return Array.from(nodes.entries())
        .filter(([id, _node]) => !exclude.includes(id))
        .map(([_id, node]) => node)
}

export class NodeList extends EventEmitter<Events> {
    private readonly nodes: Map<NodeID, RemoteRandomGraphNode>
    private readonly limit: number
    private ownId: NodeID

    constructor(ownId: NodeID, limit: number) {
        super()
        this.nodes = new Map()
        this.limit = limit
        this.ownId = ownId
    }

    add(remote: RemoteRandomGraphNode): void {
        const nodeId = getNodeIdFromPeerDescriptor(remote.getPeerDescriptor())
        if ((this.ownId !== nodeId) && (this.nodes.size < this.limit)) {
            const isExistingNode = this.nodes.has(nodeId)
            this.nodes.set(nodeId, remote)
            
            if (!isExistingNode) {
                this.emit('nodeAdded', nodeId, remote)
            }
        }
    }

    remove(peerDescriptor: PeerDescriptor): void {
        this.nodes.delete(getNodeIdFromPeerDescriptor(peerDescriptor))
    }

    removeById(nodeId: NodeID): void {
        this.nodes.delete(nodeId)
    }

    hasNode(peerDescriptor: PeerDescriptor): boolean {
        return this.nodes.has(getNodeIdFromPeerDescriptor(peerDescriptor))
    }

    hasNodeById(nodeId: NodeID): boolean {
        return this.nodes.has(nodeId)
    }

    replaceAll(neighbors: RemoteRandomGraphNode[]): void {
        this.nodes.clear()
        const limited = neighbors.splice(0, this.limit)
        limited.forEach((remote) => {
            this.add(remote)
        })
    }

    getIds(): NodeID[] {
        return Array.from(this.nodes.keys())
    }

    get(id: NodeID): RemoteRandomGraphNode | undefined {
        return this.nodes.get(id)
    }

    size(exclude: NodeID[] = []): number {
        return Array.from(this.nodes.keys()).filter((node) => !exclude.includes(node)).length
    }

    getRandom(exclude: NodeID[]): RemoteRandomGraphNode | undefined {
        return sample(getValuesOfIncludedKeys(this.nodes, exclude))
    }

    getClosest(exclude: NodeID[]): RemoteRandomGraphNode | undefined {
        const included = getValuesOfIncludedKeys(this.nodes, exclude)
        return included[0]
    }

    getClosestAndFurthest(exclude: NodeID[]): RemoteRandomGraphNode[] {
        const included = getValuesOfIncludedKeys(this.nodes, exclude)
        if (included.length === 0) {
            return []
        }
        return included.length > 1 ? [this.getClosest(exclude)!, this.getFurthest(exclude)!] : [this.getClosest(exclude)!]
    }

    getFurthest(exclude: NodeID[]): RemoteRandomGraphNode | undefined {
        const included = getValuesOfIncludedKeys(this.nodes, exclude)
        return included[included.length - 1]
    }

    getNodes(): RemoteRandomGraphNode[] {
        return Array.from(this.nodes.values())
    }

    stop(): void {
        this.nodes.clear()
        this.removeAllListeners()
    }
}
