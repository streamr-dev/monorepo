import { ConnectionManager, DhtNode, PeerDescriptor } from '@streamr/dht/dist/src'
import { NodeType } from '@streamr/dht/dist/src/proto/DhtRpc'
import { RandomGraphNode } from '../../src/logic/RandomGraphNode'
import { waitForCondition } from 'streamr-test-utils'

describe('random graph with real connections', () => {

    const epPeerDescriptor: PeerDescriptor = {
        peerId: Uint8Array.from([1, 2, 3]),
        type: NodeType.NODEJS,
        websocket: { ip: 'localhost', port: 12221 }
    }

    const randomGraphId = 'random-graph'

    let epDhtNode: DhtNode
    let dhtNode1: DhtNode
    let dhtNode2: DhtNode
    let dhtNode3: DhtNode
    let dhtNode4: DhtNode

    let randomGraphNode1: RandomGraphNode
    let randomGraphNode2: RandomGraphNode
    let randomGraphNode3: RandomGraphNode
    let randomGraphNode4: RandomGraphNode
    let randomGraphNode5: RandomGraphNode

    beforeEach(async () => {

        epDhtNode = new DhtNode({ peerDescriptor: epPeerDescriptor })
        await epDhtNode.start()

        dhtNode1 = new DhtNode({ peerIdString: '1', webSocketPort: 12222, entryPoints: [epPeerDescriptor] })
        dhtNode2 = new DhtNode({ peerIdString: '2', webSocketPort: 12223, entryPoints: [epPeerDescriptor] })
        dhtNode3 = new DhtNode({ peerIdString: '3', webSocketPort: 12224, entryPoints: [epPeerDescriptor] })
        dhtNode4 = new DhtNode({ peerIdString: '4', webSocketPort: 12225, entryPoints: [epPeerDescriptor] })

        await dhtNode1.start()
        await dhtNode2.start()
        await dhtNode3.start()
        await dhtNode4.start()

        randomGraphNode1 = new RandomGraphNode(
            {
                randomGraphId,
                layer1: epDhtNode,
                P2PTransport: epDhtNode.getTransport(),
                connectionLocker: epDhtNode.getTransport() as ConnectionManager
            }
        )
        randomGraphNode2 = new RandomGraphNode(
            { randomGraphId, layer1: dhtNode1, P2PTransport: dhtNode1.getTransport(), connectionLocker: dhtNode1.getTransport() as ConnectionManager }
        )
        randomGraphNode3 = new RandomGraphNode(
            { randomGraphId, layer1: dhtNode2, P2PTransport: dhtNode2.getTransport(), connectionLocker: dhtNode2.getTransport() as ConnectionManager }
        )
        randomGraphNode4 = new RandomGraphNode(
            { randomGraphId, layer1: dhtNode3, P2PTransport: dhtNode3.getTransport(), connectionLocker: dhtNode3.getTransport() as ConnectionManager }
        )
        randomGraphNode5 = new RandomGraphNode(
            { randomGraphId, layer1: dhtNode4, P2PTransport: dhtNode4.getTransport(), connectionLocker: dhtNode4.getTransport() as ConnectionManager }
        )

        await epDhtNode.joinDht(epPeerDescriptor)
        await Promise.all([
            dhtNode1.joinDht(epPeerDescriptor),
            dhtNode2.joinDht(epPeerDescriptor),
            dhtNode3.joinDht(epPeerDescriptor),
            dhtNode4.joinDht(epPeerDescriptor)
        ])

        await Promise.all([
            randomGraphNode1.start(),
            randomGraphNode2.start(),
            randomGraphNode3.start(),
            randomGraphNode4.start(),
            randomGraphNode5.start()
        ])
    })

    afterEach(async () => {
        await Promise.all([
            epDhtNode.stop(),
            dhtNode1.stop(),
            dhtNode2.stop(),
            dhtNode3.stop(),
            dhtNode4.stop(),
            randomGraphNode1.stop(),
            randomGraphNode2.stop(),
            randomGraphNode3.stop(),
            randomGraphNode4.stop(),
            randomGraphNode5.stop(),
        ])
    })

    it('happy paths', async () => {

        await waitForCondition(() => {
            return randomGraphNode1.getSelectedNeighborIds().length >= 4
                && randomGraphNode2.getSelectedNeighborIds().length >= 4
                && randomGraphNode3.getSelectedNeighborIds().length >= 4
                && randomGraphNode4.getSelectedNeighborIds().length >= 4
                && randomGraphNode5.getSelectedNeighborIds().length >= 4
        })

        expect(randomGraphNode1.getSelectedNeighborIds().length).toEqual(4)
        expect(randomGraphNode2.getSelectedNeighborIds().length).toEqual(4)
        expect(randomGraphNode3.getSelectedNeighborIds().length).toEqual(4)
        expect(randomGraphNode4.getSelectedNeighborIds().length).toEqual(4)
        expect(randomGraphNode5.getSelectedNeighborIds().length).toEqual(4)

    })
})
