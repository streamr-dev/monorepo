import { Logger } from '@streamr/utils'
import { Simulator } from '../../src/connection/Simulator/Simulator'
import { DhtNode } from '../../src/dht/DhtNode'
import { PeerDescriptor } from '../../src/proto/packages/dht/protos/DhtRpc'
import { createMockConnectionDhtNode, createMockConnectionLayer1Node } from '../utils'

const logger = new Logger(module)

describe('Layer 1 on Layer 0 with mocked connections', () => {
    const simulator = new Simulator()
    const layer0EntryPointId = 'layer0entrypoint'
    const layer1EntryPointId = 'layer1entrypoint'

    let layer0EntryPoint: DhtNode
    let layer1Node1: DhtNode

    let layer0Node1: DhtNode
    let layer1EntryPoint: DhtNode

    let layer0Node2: DhtNode
    let layer1Node2: DhtNode

    let layer0Node3: DhtNode
    let layer1Node3: DhtNode

    let layer0Node4: DhtNode
    let layer1Node4: DhtNode

    let entryPoint0Descriptor: PeerDescriptor
    let entryPoint1Descriptor: PeerDescriptor

    beforeEach(async () => {

        layer0EntryPoint = await createMockConnectionDhtNode(layer0EntryPointId, simulator)
        layer0Node1 = await createMockConnectionDhtNode(layer1EntryPointId, simulator)

        const layer0Node2Id = 'layer0Node2'
        layer0Node2 = await createMockConnectionDhtNode(layer0Node2Id, simulator)

        const layer0Node3Id = 'layer0Node3'
        layer0Node3 = await createMockConnectionDhtNode(layer0Node3Id, simulator)

        const layer0Node4Id = 'layer0Node4'
        layer0Node4 = await createMockConnectionDhtNode(layer0Node4Id, simulator)

        layer1EntryPoint = await createMockConnectionLayer1Node(layer1EntryPointId, layer0Node1)

        layer1Node1 = await createMockConnectionLayer1Node(layer0EntryPointId, layer0EntryPoint)
        layer1Node2 = await createMockConnectionLayer1Node(layer0Node2Id, layer0Node2)
        layer1Node3 = await createMockConnectionLayer1Node(layer0Node3Id, layer0Node3)
        layer1Node4 = await createMockConnectionLayer1Node(layer0Node4Id, layer0Node4)

        entryPoint0Descriptor = {
            kademliaId: layer0EntryPoint.getNodeId().value,
            type: 0,
            nodeName: layer0EntryPointId
        }

        entryPoint1Descriptor = {
            kademliaId: layer1EntryPoint.getNodeId().value,
            type: 0,
            nodeName: layer1EntryPointId
        }

        await layer0EntryPoint.joinDht(entryPoint0Descriptor)
        await layer1EntryPoint.joinDht(entryPoint1Descriptor)
    })

    afterEach(async () => {
        await Promise.all([
            layer0EntryPoint.stop(),
            layer0Node1.stop(),
            layer0Node2.stop(),
            layer0Node3.stop(),
            layer0Node4.stop(),
            layer1EntryPoint.stop(),
            layer1Node1.stop(),
            layer1Node2.stop(),
            layer1Node3.stop(),
            layer1Node4.stop()
        ])
    })

    it('Happy Path', async () => {
        await Promise.all([
            layer0Node1.joinDht(entryPoint0Descriptor),
            layer0Node2.joinDht(entryPoint0Descriptor),
            layer0Node3.joinDht(entryPoint0Descriptor),
            layer0Node4.joinDht(entryPoint0Descriptor)
        ])

        await Promise.all([
            layer1Node1.joinDht(entryPoint1Descriptor),
            layer1Node2.joinDht(entryPoint1Descriptor),
            layer1Node3.joinDht(entryPoint1Descriptor),
            layer1Node4.joinDht(entryPoint1Descriptor)
        ])

        logger.info('layer1EntryPoint.getBucketSize() ' + layer1EntryPoint.getBucketSize())
        logger.info('layer1Node1.getBucketSize()' + layer1Node1.getBucketSize())
        logger.info('layer1Node2.getBucketSize()' + layer1Node2.getBucketSize())
        logger.info('layer1Node3.getBucketSize()' + layer1Node3.getBucketSize())
        logger.info('layer1Node4.getBucketSize()' + layer1Node4.getBucketSize())

        expect(layer1Node1.getBucketSize()).toBeGreaterThanOrEqual(2)
        expect(layer1Node2.getBucketSize()).toBeGreaterThanOrEqual(2)
        expect(layer1Node3.getBucketSize()).toBeGreaterThanOrEqual(2)
        expect(layer1Node4.getBucketSize()).toBeGreaterThanOrEqual(2)
    }, 60000)
})
