import { ClosestPeersRequest, ClosestPeersResponse, Neighbor, NodeType, ConnectivityMethod } from '../proto/DhtRpc'
import { IDhtRpc } from '../proto/DhtRpc.server'
import { ServerCallContext } from '@protobuf-ts/runtime-rpc'
import { DummyServerCallContext } from '../transport/DhtTransportServer'
import { generateId } from '../dht/helpers'

export const createRpcMethods = (fn: any): any => {
    const DhtRpc: IDhtRpc = {
        async getClosestPeers(request: ClosestPeersRequest, _context: ServerCallContext): Promise<ClosestPeersResponse> {
            const { peerId } = request
            const closestPeers = fn(peerId)
            const response = {
                neighbors: closestPeers,
                nonce: 'aaaaaa'
            }
            return response
        }
    }

    const RegisterDhtRpc = {
        async getClosestPeers(bytes: Uint8Array): Promise<Uint8Array> {
            const request = ClosestPeersRequest.fromBinary(bytes)
            const response = await DhtRpc.getClosestPeers(request, new DummyServerCallContext())
            return ClosestPeersResponse.toBinary(response)
        }
    }

    return RegisterDhtRpc
}

const MockDhtRpc: IDhtRpc = {
    async getClosestPeers(request: ClosestPeersRequest, _context: ServerCallContext): Promise<ClosestPeersResponse> {
        console.info('RPC server processing getClosestPeers request for', request.peerId)
        const neighbors = getMockNeighbors()
        const response: ClosestPeersResponse = {
            neighbors: neighbors,
            nonce: 'why am i still here'
        }
        return response
    }
}

export const MockRegisterDhtRpc = {
    async getClosestPeers(bytes: Uint8Array): Promise<Uint8Array> {
        const request = ClosestPeersRequest.fromBinary(bytes)
        const response = await MockDhtRpc.getClosestPeers(request, new DummyServerCallContext())
        return ClosestPeersResponse.toBinary(response)
    }
}

export const getMockNeighbors = (): Neighbor[] => {
    const n1: Neighbor = {
        peerId: generateId('Neighbor1'),
        type: NodeType.NODEJS,
    }
    const n2: Neighbor = {
        peerId: generateId('Neighbor2'),
        type: NodeType.NODEJS,
    }
    const n3: Neighbor = {
        peerId: generateId('Neighbor3'),
        type: NodeType.NODEJS,
    }
    const n4: Neighbor = {
        peerId: generateId('Neighbor1'),
        type: NodeType.BROWSER,
    }
    return [
        n1, n2, n3, n4
    ]
}