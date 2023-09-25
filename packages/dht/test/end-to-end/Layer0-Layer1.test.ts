import { NodeType, PeerDescriptor } from '../../src/proto/packages/dht/protos/DhtRpc'
import { DhtNode } from '../../src/dht/DhtNode'
import { peerIdFromPeerDescriptor } from '../../src/helpers/peerIdFromPeerDescriptor'

describe('Layer0-Layer1', () => {
    const epPeerDescriptor: PeerDescriptor = {
        kademliaId: Uint8Array.from([1, 2, 3]),
        type: NodeType.NODEJS,
        websocket: { host: '127.0.0.1', port: 10016, tls: false }
    }

    const STREAM_ID1 = 'stream1'
    const STREAM_ID2 = 'stream2'

    let epDhtNode: DhtNode
    let node1: DhtNode
    let node2: DhtNode

    let stream1Node1: DhtNode
    let stream1Node2: DhtNode
    let stream2Node1: DhtNode
    let stream2Node2: DhtNode

    const websocketPortRange = { min: 10017, max: 10018 }

    beforeEach(async () => {

        epDhtNode = new DhtNode({ peerDescriptor: epPeerDescriptor })
        await epDhtNode.start()
        await epDhtNode.joinDht([epPeerDescriptor])

        node1 = new DhtNode({ peerId: '1', websocketPortRange, entryPoints: [epPeerDescriptor] })
        node2 = new DhtNode({ peerId: '2', websocketPortRange, entryPoints: [epPeerDescriptor] })

        await node1.start()
        await node2.start()

        stream1Node1 = new DhtNode({ transportLayer: epDhtNode, serviceId: STREAM_ID1 })
        stream1Node2 = new DhtNode({ transportLayer: node1, serviceId: STREAM_ID1 })

        stream2Node1 = new DhtNode({ transportLayer: epDhtNode, serviceId: STREAM_ID2 })
        stream2Node2 = new DhtNode({ transportLayer: node2, serviceId: STREAM_ID2 })

        await Promise.all([
            stream1Node1.start(),
            stream1Node2.start(),
            stream2Node1.start(),
            stream2Node2.start()
        ])

    })

    afterEach(async () => {
        await Promise.all([
            node1.stop(),
            node2.stop(),
            epDhtNode.stop(),
            stream1Node1.stop(),
            stream1Node2.stop(),
            stream2Node1.stop(),
            stream2Node2.stop()
        ])
    })

    it('Happy path', async () => {
        await Promise.all([
            node1.joinDht([epPeerDescriptor]),
            node2.joinDht([epPeerDescriptor])
        ])
        await Promise.all([
            stream1Node1.joinDht([epPeerDescriptor]),
            stream1Node2.joinDht([epPeerDescriptor])
        ])
        
        await Promise.all([
            stream2Node1.joinDht([epPeerDescriptor]),
            stream2Node2.joinDht([epPeerDescriptor])
        ])
        expect(stream1Node1.getNeighborList().getSize()).toEqual(1)
        expect(stream1Node2.getNeighborList().getSize()).toEqual(1)
        expect(stream2Node1.getNeighborList().getSize()).toEqual(1)
        expect(stream2Node2.getNeighborList().getSize()).toEqual(1)

        expect(stream1Node1.getNeighborList().getContactIds()[0].equals(peerIdFromPeerDescriptor(node1.getPeerDescriptor()))).toEqual(true)
        expect(stream1Node2.getNeighborList().getContactIds()[0].equals(peerIdFromPeerDescriptor(epPeerDescriptor))).toEqual(true)
        expect(stream2Node1.getNeighborList().getContactIds()[0].equals(peerIdFromPeerDescriptor(node2.getPeerDescriptor()))).toEqual(true)
        expect(stream2Node2.getNeighborList().getContactIds()[0].equals(peerIdFromPeerDescriptor(epPeerDescriptor))).toEqual(true)
    })
})
