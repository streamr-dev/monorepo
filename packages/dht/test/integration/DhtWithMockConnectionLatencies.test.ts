import { DhtNode } from '../../src/dht/DhtNode'
import { PeerDescriptor } from '../../src/proto/packages/dht/protos/DhtRpc'
import { createMockConnectionDhtNode } from '../utils'
import { LatencyType, Simulator } from '../../src/connection/Simulator/Simulator'

describe('Mock connection Dht joining with latencies', () => {
    let entryPoint: DhtNode
    let nodes: DhtNode[]
    let simulator: Simulator
    let entrypointDescriptor: PeerDescriptor
    
    beforeEach(async () => {
        nodes = []
        simulator = new Simulator(LatencyType.RANDOM)
        const entryPointId = '0'
        entryPoint = await createMockConnectionDhtNode(entryPointId, simulator)
       
        entrypointDescriptor = {
            kademliaId: entryPoint.getNodeId().value,
            type: 0,
            nodeName: '0'
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
            ...nodes.map((node) => node.stop())
        ])
        simulator.stop()
    })

    it('Happy path', async () => {
        await entryPoint.joinDht(entrypointDescriptor)
        await Promise.all(
            nodes.map((node) => node.joinDht(entrypointDescriptor))
        )
        nodes.forEach((node) => {
            expect(node.getBucketSize()).toBeGreaterThanOrEqual(node.getK() - 1)
            expect(node.getNeighborList().getSize()).toBeGreaterThanOrEqual(node.getK())
        })

        nodes.forEach((node) => {
            expect(node.getBucketSize()).toBeGreaterThanOrEqual(node.getK() - 1)
            expect(node.getNeighborList().getSize()).toBeGreaterThanOrEqual(node.getK())
        })
        expect(entryPoint.getBucketSize()).toBeGreaterThanOrEqual(entryPoint.getK())
    }, 60 * 1000)
})
