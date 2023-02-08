import { DhtNode, PeerDescriptor, PeerID, Simulator, SimulatorTransport, NodeType } from '@streamr/dht'
import { StreamrNode, Events } from '../../src/logic/StreamrNode'
import { ContentMessage } from '../../src/proto/packages/trackerless-network/protos/NetworkRpc'
import { waitForEvent3, waitForCondition } from '@streamr/utils'
import { createStreamMessage } from '../utils'

describe('StreamrNode', () => {

    let layer01: DhtNode
    let layer02: DhtNode
    let transport1: SimulatorTransport
    let transport2: SimulatorTransport
    let node1: StreamrNode
    let node2: StreamrNode

    const peer1: PeerDescriptor = {
        kademliaId: new Uint8Array([1, 2, 3]),
        type: NodeType.NODEJS
    }
    const peer2: PeerDescriptor = {
        kademliaId: new Uint8Array([1, 1, 1]),
        type: NodeType.NODEJS
    }
    const STREAM_ID = 'test'

    const content: ContentMessage = {
        body: JSON.stringify({ hello: "WORLD" })
    }
    const msg = createStreamMessage(
        content,
        STREAM_ID,
        PeerID.fromValue(peer2.kademliaId).toKey()
    )

    afterEach(async () => {
        await Promise.all([
            node1.destroy(),
            node2.destroy()
        ])
    })

    beforeEach(async () => {
        const simulator = new Simulator()
        transport1 = new SimulatorTransport(peer1, simulator)
        transport2 = new SimulatorTransport(peer2, simulator)
        layer01 = new DhtNode({
            transportLayer: transport1,
            peerDescriptor: peer1,
            entryPoints: [peer1]
        })
        layer02 = new DhtNode({
            transportLayer: transport2,
            peerDescriptor: peer2,
            entryPoints: [peer1]
        })
        await Promise.all([
            layer01.start(),
            layer02.start()
        ])
        await Promise.all([
            layer01.joinDht(peer1),
            layer02.joinDht(peer1)
        ])

        node1 = new StreamrNode({})
        node2 = new StreamrNode({})
        await node1.start(layer01, transport1, transport1)
        await node2.start(layer02, transport2, transport2)
    })

    it('starts', async () => {
        expect(node1.getPeerDescriptor()).toEqual(peer1)
        expect(node2.getPeerDescriptor()).toEqual(peer2)
    })

    it('Joining stream', async () => {
        await node1.joinStream(STREAM_ID, peer1)
        await node2.joinStream(STREAM_ID, peer1)
        await waitForCondition(() => node1.getStream(STREAM_ID)!.layer2.getTargetNeighborStringIds().length === 1)
        await waitForCondition(() => node2.getStream(STREAM_ID)!.layer2.getTargetNeighborStringIds().length === 1)
        expect(node1.getStream(STREAM_ID)!.layer2.getTargetNeighborStringIds().length).toEqual(1)
        expect(node2.getStream(STREAM_ID)!.layer2.getTargetNeighborStringIds().length).toEqual(1)
    })

    it('Publishing after joining and waiting for neighbors', async () => {
        node1.subscribeToStream(STREAM_ID, peer1)
        await node2.joinStream(STREAM_ID, peer1)
        await waitForCondition(() => node1.getStream(STREAM_ID)!.layer2.getTargetNeighborStringIds().length === 1)
        await waitForCondition(() => node2.getStream(STREAM_ID)!.layer2.getTargetNeighborStringIds().length === 1)
        await Promise.all([
            waitForEvent3<Events>(node1, 'newMessage'),
            node2.publishToStream(STREAM_ID, peer1, msg)
        ])
    })

    it('multi-stream pub/sub', async () => {
        const stream2 = 'test2'
        await node1.joinStream(STREAM_ID, peer1)
        await node1.joinStream(stream2, peer1)
        await node2.joinStream(STREAM_ID, peer1)
        await node2.joinStream(stream2, peer1)
        node1.subscribeToStream(STREAM_ID, peer1)
        node2.subscribeToStream(stream2, peer1)
        await Promise.all([
            waitForCondition(() => node1.getStream(STREAM_ID)!.layer2.getTargetNeighborStringIds().length === 1),
            waitForCondition(() => node2.getStream(STREAM_ID)!.layer2.getTargetNeighborStringIds().length === 1),
            waitForCondition(() => node1.getStream(stream2)!.layer2.getTargetNeighborStringIds().length === 1),
            waitForCondition(() => node2.getStream(stream2)!.layer2.getTargetNeighborStringIds().length === 1)
        ])
        const msg2 = createStreamMessage(
            content,
            stream2,
            PeerID.fromValue(peer1.kademliaId).toKey()
        )
        await Promise.all([
            waitForEvent3<Events>(node1, 'newMessage'),
            waitForEvent3<Events>(node2, 'newMessage'),
            node1.publishToStream(stream2, peer1, msg2),
            node2.publishToStream(STREAM_ID, peer1, msg)
        ])
    })

    it('leaving streams', async () => {
        await node1.joinStream(STREAM_ID, peer1)
        await node2.joinStream(STREAM_ID, peer1)
        await Promise.all([
            waitForCondition(() => node1.getStream(STREAM_ID)!.layer2.getTargetNeighborStringIds().length === 1),
            waitForCondition(() => node2.getStream(STREAM_ID)!.layer2.getTargetNeighborStringIds().length === 1)
        ])
        node2.leaveStream(STREAM_ID)
        await waitForCondition(() => node1.getStream(STREAM_ID)!.layer2.getTargetNeighborStringIds().length === 0)
    })

    // TODO: make this work
    // it('Publishing and subscribing to streams without join awaits', async () => {
    //     node1.subscribeToStream(STREAM_ID, peer1)
    //     await Promise.all([
    //         waitForEvent3<Events>(node1, 'newMessage'),
    //         node2.publishToStream(STREAM_ID, peer1, msg)
    //     ])
    // })

})
