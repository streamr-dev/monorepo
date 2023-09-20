import {
    DhtNode,
    PeerDescriptor,
    Simulator,
    SimulatorTransport,
    NodeType
} from '@streamr/dht'
import { StreamrNode, Events } from '../../src/logic/StreamrNode'
import { waitForEvent3, waitForCondition } from '@streamr/utils'
import { createStreamMessage } from '../utils/utils'
import { StreamPartIDUtils } from '@streamr/protocol'
import { randomEthereumAddress } from '@streamr/test-utils'

describe('StreamrNode', () => {

    let layer01: DhtNode
    let layer02: DhtNode
    let transport1: SimulatorTransport
    let transport2: SimulatorTransport
    let node1: StreamrNode
    let node2: StreamrNode

    const peerDescriptor1: PeerDescriptor = {
        kademliaId: new Uint8Array([1, 2, 3]),
        type: NodeType.NODEJS
    }
    const peerDescriptor2: PeerDescriptor = {
        kademliaId: new Uint8Array([1, 1, 1]),
        type: NodeType.NODEJS
    }
    const STREAM_PART_ID = StreamPartIDUtils.parse('test#0')

    const msg = createStreamMessage(
        JSON.stringify({ hello: 'WORLD' }),
        STREAM_PART_ID,
        randomEthereumAddress()
    )

    afterEach(async () => {
        await Promise.all([
            node1.destroy(),
            node2.destroy()
        ])
    })

    beforeEach(async () => {
        const simulator = new Simulator()
        transport1 = new SimulatorTransport(peerDescriptor1, simulator)
        transport2 = new SimulatorTransport(peerDescriptor2, simulator)
        layer01 = new DhtNode({
            transportLayer: transport1,
            peerDescriptor: peerDescriptor1,
            entryPoints: [peerDescriptor1]
        })
        layer02 = new DhtNode({
            transportLayer: transport2,
            peerDescriptor: peerDescriptor2,
            entryPoints: [peerDescriptor1]
        })
        await Promise.all([
            layer01.start(),
            layer02.start()
        ])
        await Promise.all([
            layer01.joinDht([peerDescriptor1]),
            layer02.joinDht([peerDescriptor1])
        ])

        node1 = new StreamrNode({})
        node2 = new StreamrNode({})
        await node1.start(layer01, transport1, transport1)
        node1.setStreamPartEntryPoints(STREAM_PART_ID, [peerDescriptor1])
        await node2.start(layer02, transport2, transport2)
        node2.setStreamPartEntryPoints(STREAM_PART_ID, [peerDescriptor1])
    })

    it('starts', async () => {
        expect(node1.getPeerDescriptor()).toEqual(peerDescriptor1)
        expect(node2.getPeerDescriptor()).toEqual(peerDescriptor2)
    })

    it('Joining stream', async () => {
        await node1.joinStream(STREAM_PART_ID)
        await node2.joinStream(STREAM_PART_ID)
        await waitForCondition(() => node1.getStream(STREAM_PART_ID)!.layer2.getTargetNeighborIds().length === 1)
        await waitForCondition(() => node2.getStream(STREAM_PART_ID)!.layer2.getTargetNeighborIds().length === 1)
        expect(node1.getStream(STREAM_PART_ID)!.layer2.getTargetNeighborIds().length).toEqual(1)
        expect(node2.getStream(STREAM_PART_ID)!.layer2.getTargetNeighborIds().length).toEqual(1)
    })

    it('Publishing after joining and waiting for neighbors', async () => {
        node1.safeJoinStream(STREAM_PART_ID)
        await node2.joinStream(STREAM_PART_ID)
        await waitForCondition(() => node1.getStream(STREAM_PART_ID)!.layer2.getTargetNeighborIds().length === 1)
        await waitForCondition(() => node2.getStream(STREAM_PART_ID)!.layer2.getTargetNeighborIds().length === 1)
        await Promise.all([
            waitForEvent3<Events>(node1, 'newMessage'),
            node2.publishToStream(STREAM_PART_ID, msg)
        ])
    })

    it('multi-stream pub/sub', async () => {
        const streamPartId2 = StreamPartIDUtils.parse('test2#0')
        node1.setStreamPartEntryPoints(streamPartId2, [peerDescriptor1])
        node2.setStreamPartEntryPoints(streamPartId2, [peerDescriptor1])
        await node1.joinStream(STREAM_PART_ID)
        await node1.joinStream(streamPartId2)
        await node2.joinStream(STREAM_PART_ID)
        await node2.joinStream(streamPartId2)
        node1.safeJoinStream(STREAM_PART_ID)
        node2.safeJoinStream(streamPartId2)
        await Promise.all([
            waitForCondition(() => node1.getStream(STREAM_PART_ID)!.layer2.getTargetNeighborIds().length === 1),
            waitForCondition(() => node2.getStream(STREAM_PART_ID)!.layer2.getTargetNeighborIds().length === 1),
            waitForCondition(() => node1.getStream(streamPartId2)!.layer2.getTargetNeighborIds().length === 1),
            waitForCondition(() => node2.getStream(streamPartId2)!.layer2.getTargetNeighborIds().length === 1)
        ])
        const msg2 = createStreamMessage(
            JSON.stringify({ hello: 'WORLD' }),
            streamPartId2,
            randomEthereumAddress()
        )
        await Promise.all([
            waitForEvent3<Events>(node1, 'newMessage'),
            waitForEvent3<Events>(node2, 'newMessage'),
            node1.publishToStream(streamPartId2, msg2),
            node2.publishToStream(STREAM_PART_ID, msg)
        ])
    })

    it('leaving streams', async () => {
        await node1.joinStream(STREAM_PART_ID)
        await node2.joinStream(STREAM_PART_ID)
        await Promise.all([
            waitForCondition(() => node1.getStream(STREAM_PART_ID)!.layer2.getTargetNeighborIds().length === 1),
            waitForCondition(() => node2.getStream(STREAM_PART_ID)!.layer2.getTargetNeighborIds().length === 1)
        ])
        node2.leaveStream(STREAM_PART_ID)
        await waitForCondition(() => node1.getStream(STREAM_PART_ID)!.layer2.getTargetNeighborIds().length === 0)
    })

})
