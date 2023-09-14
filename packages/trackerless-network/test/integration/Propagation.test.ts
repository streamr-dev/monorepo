import { DhtNode, NodeType, PeerDescriptor, Simulator } from '@streamr/dht'
import { RandomGraphNode } from '../../src/logic/RandomGraphNode'
import { createMockRandomGraphNodeAndDhtNode, createRandomNodeId, createStreamMessage } from '../utils/utils'
import { range } from 'lodash'
import { waitForCondition, hexToBinary } from '@streamr/utils'
import { StreamPartIDUtils } from '@streamr/protocol'
import { randomEthereumAddress } from '@streamr/test-utils'

describe('Propagation', () => {
    const entryPointDescriptor: PeerDescriptor = {
        kademliaId: hexToBinary(createRandomNodeId()),
        type: NodeType.NODEJS
    }
    let dhtNodes: DhtNode[]
    let randomGraphNodes: RandomGraphNode[]
    const STREAM_PART_ID = StreamPartIDUtils.parse('testingtesting#0')
    let totalReceived: number
    const NUM_OF_NODES = 256

    beforeEach(async () => {
        totalReceived = 0
        const simulator = new Simulator()
        dhtNodes = []
        randomGraphNodes = []
        const [entryPoint, node1] = createMockRandomGraphNodeAndDhtNode(entryPointDescriptor, entryPointDescriptor, STREAM_PART_ID, simulator)
        await entryPoint.start()
        await entryPoint.joinDht([entryPointDescriptor])
        await node1.start()
        node1.on('message', () => {totalReceived += 1})
        dhtNodes.push(entryPoint)
        randomGraphNodes.push(node1)

        await Promise.all(range(NUM_OF_NODES).map(async (_i) => {
            const descriptor: PeerDescriptor = {
                kademliaId: hexToBinary(createRandomNodeId()),
                type: NodeType.NODEJS
            }
            const [dht, graph] = createMockRandomGraphNodeAndDhtNode(
                descriptor,
                entryPointDescriptor,
                STREAM_PART_ID,
                simulator
            )
            await dht.start()
            await graph.start()
            // eslint-disable-next-line promise/always-return
            await dht.joinDht([entryPointDescriptor]).then(() => {
                graph.on('message', () => { totalReceived += 1 })
                dhtNodes.push(dht)
                randomGraphNodes.push(graph)
            })
        }))
    }, 45000)

    afterEach(async () => {
        await Promise.all(randomGraphNodes.map((node) => node.stop()))
        await Promise.all(dhtNodes.map((node) => node.stop()))
    })

    it('All nodes receive messages', async () => {
        await waitForCondition(
            () => randomGraphNodes.every((node) => node.getTargetNeighborIds().length >= 3), 30000
        )
        await waitForCondition(() => {
            const avg = randomGraphNodes.reduce((acc, curr) => {
                return acc + curr.getTargetNeighborIds().length
            }, 0) / randomGraphNodes.length
            return avg >= 4
        }, 20000)
        const msg = createStreamMessage(
            JSON.stringify({ hello: 'WORLD' }),
            STREAM_PART_ID,
            randomEthereumAddress()
        )
        randomGraphNodes[0].broadcast(msg)
        await waitForCondition(() => totalReceived >= NUM_OF_NODES, 10000)
    }, 45000)
})
