import { Simulator } from '../../src/connection/Simulator/Simulator'
import { DhtNode } from '../../src/dht/DhtNode'
import { NodeType, PeerDescriptor } from '../../src/proto/packages/dht/protos/DhtRpc'
import { createMockConnectionDhtNode } from '../utils/utils'

describe('Mock IConnection DHT Joining', () => {
    let entryPoint: DhtNode
    let nodes: DhtNode[]
    let entrypointDescriptor: PeerDescriptor
    let simulator: Simulator

    beforeEach(async () => {
        nodes = []
        simulator = new Simulator()
        const entryPointId = '0'
        entryPoint = await createMockConnectionDhtNode(entryPointId, simulator)
        entrypointDescriptor = {
            kademliaId: entryPoint.getNodeId().value,
            type: NodeType.NODEJS
        }
        for (let i = 1; i < 100; i++) {
            const nodeId = `${i}`
            const node = await createMockConnectionDhtNode(nodeId, simulator)
            nodes.push(node)
        }
    })

    afterEach(async () => {
        await Promise.all([
            entryPoint.stop(),
            ...nodes.map(async (node) => node.stop())
        ])
        simulator.stop()
    })

    it('Happy path', async () => {
        await entryPoint.joinDht([entrypointDescriptor])
        await Promise.all(nodes.map((node) => node.joinDht([entrypointDescriptor])))
        nodes.forEach((node) => {
            expect(node.getBucketSize()).toBeGreaterThanOrEqual(node.getK() - 2)
            expect(node.getClosestContacts().length).toBeGreaterThanOrEqual(node.getK() - 2)
        })
        expect(entryPoint.getBucketSize()).toBeGreaterThanOrEqual(entryPoint.getK() - 2)
    }, 60000)
})
