import { LatencyType, Simulator } from '../../src/connection/simulator/Simulator'
import { DhtNode } from '../../src/dht/DhtNode'
import { PeerDescriptor } from '../../src/proto/packages/dht/protos/DhtRpc'
import { createMockConnectionDhtNode, createMockPeerDescriptor, waitConnectionManagersReadyForTesting } from '../utils/utils'
import { PeerID } from '../../src/helpers/PeerID'
import { areEqualPeerDescriptors } from '../../src/helpers/peerIdFromPeerDescriptor'
import { Any } from '../../src/proto/google/protobuf/any'

describe('Storing data in DHT', () => {
    let entryPoint: DhtNode
    let nodes: DhtNode[]
    let entrypointDescriptor: PeerDescriptor
    const simulator = new Simulator(LatencyType.REAL)
    const NUM_NODES = 100
    const MAX_CONNECTIONS = 20
    const K = 4
    const nodeIndicesById: Record<string, number> = {}

    const getRandomNode = () => {
        return nodes[Math.floor(Math.random() * nodes.length)]
    }

    beforeEach(async () => {
        nodes = []
        const entryPointId = '0'
        entryPoint = await createMockConnectionDhtNode(entryPointId, simulator,
            undefined, K, MAX_CONNECTIONS)
        nodes.push(entryPoint)
        nodeIndicesById[entryPoint.getNodeId().toKey()] = 0
        entrypointDescriptor = entryPoint.getLocalPeerDescriptor()
        nodes.push(entryPoint)
        for (let i = 1; i < NUM_NODES; i++) {
            const nodeId = `${i}`
            const node = await createMockConnectionDhtNode(nodeId, simulator, 
                undefined, K, MAX_CONNECTIONS, 60000)
            nodeIndicesById[node.getNodeId().toKey()] = i
            nodes.push(node)
        }
        await Promise.all(nodes.map((node) => node.joinDht([entrypointDescriptor])))
        await waitConnectionManagersReadyForTesting(nodes.map((node) => node.connectionManager!), MAX_CONNECTIONS)
    }, 90000)

    afterEach(async () => {
        await Promise.all(nodes.map((node) => node.stop()))
    })

    it('Storing data works', async () => {
        const storingNodeIndex = 34
        const dataKey = PeerID.fromString('3232323e12r31r3')
        const storedData = createMockPeerDescriptor()
        const data = Any.pack(storedData, PeerDescriptor)
        const successfulStorers = await nodes[storingNodeIndex].storeDataToDht(dataKey.value, data)
        expect(successfulStorers.length).toBeGreaterThan(4)
    }, 90000)

    it('Storing and getting data works', async () => {
        const storingNode = getRandomNode()
        const dataKey = PeerID.fromString('3232323e12r31r3')
        const storedData = createMockPeerDescriptor()
        const data = Any.pack(storedData, PeerDescriptor)
        const successfulStorers = await storingNode.storeDataToDht(dataKey.value, data)
        expect(successfulStorers.length).toBeGreaterThan(4)

        const fetchingNode = getRandomNode()
        const results = await fetchingNode.getDataFromDht(dataKey.value)
        results.forEach((entry) => {
            const foundData = Any.unpack(entry.data!, PeerDescriptor)
            expect(areEqualPeerDescriptors(foundData, storedData)).toBeTrue()
        })
    }, 90000)
})
