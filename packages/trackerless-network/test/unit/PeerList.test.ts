import { NodeList } from '../../src/logic/NodeList'
import { RemoteRandomGraphNode } from '../../src/logic/RemoteRandomGraphNode'
import {
    PeerDescriptor,
    ListeningRpcCommunicator,
    Simulator,
    PeerID,
    SimulatorTransport,
} from '@streamr/dht'
import { NetworkRpcClient } from '../../src/proto/packages/trackerless-network/protos/NetworkRpc.client'
import { toProtoRpcClient } from '@streamr/proto-rpc'
import { expect } from 'expect'
import { NodeID, getNodeIdFromPeerDescriptor } from '../../src/identifiers'

describe('PeerList', () => {

    const ids = [
        new Uint8Array([1, 1, 1]),
        new Uint8Array([1, 1, 2]),
        new Uint8Array([1, 1, 3]),
        new Uint8Array([1, 1, 4]),
        new Uint8Array([1, 1, 5])
    ]
    const ownId = PeerID.fromString('test')
    const graphId = 'test'
    let peerList: NodeList
    let simulator: Simulator
    let mockTransports: SimulatorTransport[]

    const createRemoteGraphNode = (peerDescriptor: PeerDescriptor) => {
        const mockTransport = new SimulatorTransport(peerDescriptor, simulator)
        const mockCommunicator = new ListeningRpcCommunicator(`layer2-${ graphId }`, mockTransport)
        const mockClient = mockCommunicator.getRpcClientTransport()
        
        mockTransports.push(mockTransport)
        return new RemoteRandomGraphNode(peerDescriptor, graphId, toProtoRpcClient(new NetworkRpcClient(mockClient)))
    }

    beforeEach(() => {
        simulator = new Simulator()
        mockTransports = []
        peerList = new NodeList(ownId, 6)
        ids.forEach((peerId) => {
            const peerDescriptor: PeerDescriptor = {
                kademliaId: peerId,
                type: 0
            }
            peerList.add(createRemoteGraphNode(peerDescriptor))
        })
    })

    afterEach(async ()=> {
        // eslint-disable-next-line @typescript-eslint/prefer-for-of
        for (let i = 0; i < mockTransports.length; i++) {
            await mockTransports[i].stop()
        }
        simulator.stop()
    })

    it('add', () => {
        const newDescriptor = {
            kademliaId: new Uint8Array([1, 2, 3]),
            type: 0
        }
        const newNode = createRemoteGraphNode(newDescriptor)
        peerList.add(newNode)
        expect(peerList.hasNode(newDescriptor)).toEqual(true)

        const newDescriptor2 = {
            kademliaId: new Uint8Array([1, 2, 4]),
            type: 0
        }
        const newNode2 = createRemoteGraphNode(newDescriptor2)
        peerList.add(newNode2)
        expect(peerList.hasNode(newDescriptor2)).toEqual(false)
    })

    it('remove', () => {
        const toRemove = peerList.getClosest([])
        peerList.remove(toRemove!.getPeerDescriptor())
        expect(peerList.hasNode(toRemove!.getPeerDescriptor())).toEqual(false)
    })

    it('removeById', () => {
        const toRemove = peerList.getClosest([])
        const stringId = getNodeIdFromPeerDescriptor(toRemove!.getPeerDescriptor())
        peerList.removeById(stringId)
        expect(peerList.hasNode(toRemove!.getPeerDescriptor())).toEqual(false)
    })

    it('getClosest', () => {
        const closest = peerList.getClosest([])
        expect(getNodeIdFromPeerDescriptor(closest!.getPeerDescriptor()))
            .toEqual(PeerID.fromValue(new Uint8Array([1, 1, 1])).toKey())
    })

    it('getClosest with exclude', () => {
        const closest = peerList.getClosest([PeerID.fromValue(new Uint8Array([1, 1, 1])).toKey() as unknown as NodeID])
        expect(getNodeIdFromPeerDescriptor(closest!.getPeerDescriptor()))
            .toEqual(PeerID.fromValue(new Uint8Array([1, 1, 2])).toKey())
    })

    it('getFurthest', () => {
        const closest = peerList.getFurthest([])
        expect(getNodeIdFromPeerDescriptor(closest!.getPeerDescriptor()))
            .toEqual(PeerID.fromValue(new Uint8Array([1, 1, 5])).toKey())
    })

    it('getFurthest with exclude', () => {
        const closest = peerList.getFurthest([PeerID.fromValue(new Uint8Array([1, 1, 5])).toKey() as unknown as NodeID])
        expect(getNodeIdFromPeerDescriptor(closest!.getPeerDescriptor()))
            .toEqual(PeerID.fromValue(new Uint8Array([1, 1, 4])).toKey())
    })

    it('getClosestAndFurthest', () => {
        const results = peerList.getClosestAndFurthest([])
        expect(results).toEqual([peerList.getClosest([]), peerList.getFurthest([])])
    })

    it('getClosest empty', () => {
        const emptyPeerList = new NodeList(ownId, 2)
        expect(emptyPeerList.getClosest([])).toBeUndefined()
    })

    it('getFurthest empty', () => {
        const emptyPeerList = new NodeList(ownId, 2)
        expect(emptyPeerList.getFurthest([])).toBeUndefined()
    })

    it('getRandom empty', () => {
        const emptyPeerList = new NodeList(ownId, 2)
        expect(emptyPeerList.getRandom([])).toBeUndefined()
    })

    it('getClosestAndFurthest empty', () => {
        const emptyPeerList = new NodeList(ownId, 2)
        expect(emptyPeerList.getClosestAndFurthest([])).toEqual([])
    })

    it('getClosestAndFurthest with exclude', () => {
        const results = peerList.getClosestAndFurthest([
            PeerID.fromValue(new Uint8Array([1, 1, 1])).toKey() as unknown as NodeID,
            PeerID.fromValue(new Uint8Array([1, 1, 5])).toKey() as unknown as NodeID
        ])
        expect(results).toEqual([
            peerList.getClosest([PeerID.fromValue(new Uint8Array([1, 1, 1])).toKey() as unknown as NodeID]),
            peerList.getFurthest([PeerID.fromValue(new Uint8Array([1, 1, 5])).toKey() as unknown as NodeID])
        ])
    })
})
