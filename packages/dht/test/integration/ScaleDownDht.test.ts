import { LatencyType, Simulator } from '../../src/connection/Simulator/Simulator'
import { DhtNode } from '../../src/dht/DhtNode'
import { NodeType, PeerDescriptor } from '../../src/proto/packages/dht/protos/DhtRpc'
import { createMockConnectionDhtNode } from '../utils/utils'
import { isSamePeerDescriptor, keyFromPeerDescriptor } from '../../src/helpers/peerIdFromPeerDescriptor'
import { Logger } from '@streamr/utils'

const logger = new Logger(module)

describe('Scaling down a Dht network', () => {
    let entryPoint: DhtNode
    let nodes: DhtNode[]
    let entrypointDescriptor: PeerDescriptor
    const simulator = new Simulator(LatencyType.RANDOM)
    const NUM_NODES = 80
    const MAX_CONNECTIONS = 15
    const K = 2

    beforeEach(async () => {
        nodes = []
        const entryPointId = '0'
        entryPoint = await createMockConnectionDhtNode(entryPointId, simulator,
            undefined, K, MAX_CONNECTIONS)
        nodes.push(entryPoint)

        entrypointDescriptor = {
            kademliaId: entryPoint.getNodeId().value,
            type: NodeType.NODEJS
        }

        for (let i = 1; i < NUM_NODES; i++) {
            const nodeId = `${i}`
            const node = await createMockConnectionDhtNode(nodeId, simulator, undefined, K, MAX_CONNECTIONS)
            nodes.push(node)
        }
        await Promise.all(nodes.map((node) => node.joinDht([entrypointDescriptor])))
    }, 60000)

    afterEach(async () => {
        await Promise.all(nodes.map((node) => node.stop()))
    }, 10000)

    it('Remaining nodes cleaned up stopped nodes from states', async () => {
        const randomIndices = []
        for (let i = 1; i < nodes.length; i++) {
            randomIndices.push(i)
        }
        while (randomIndices.length > 1) {
            const index = Math.floor(Math.random() * randomIndices.length)
            const nodeIndex = randomIndices[index]
            randomIndices.splice(index, 1)
            const stoppingPeerDescriptor = nodes[nodeIndex].getPeerDescriptor()
            await nodes[nodeIndex].stop()
            const nodeIsCleaned = nodes.every((node) =>
                node.getAllConnectionPeerDescriptors().every((peer) => {
                    if (isSamePeerDescriptor(peer, stoppingPeerDescriptor)) {
                        logger.error(keyFromPeerDescriptor(node.getPeerDescriptor()) + ', ' 
                            + keyFromPeerDescriptor(stoppingPeerDescriptor) + ' cleaning up failed')
                    }
                    return !isSamePeerDescriptor(peer, stoppingPeerDescriptor)
                })
            )
            expect(nodeIsCleaned).toEqual(true)
        }
    }, 180000)
})
