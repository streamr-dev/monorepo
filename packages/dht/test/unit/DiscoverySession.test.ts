import { Multimap, wait } from '@streamr/utils'
import { sampleSize } from 'lodash'
import { DhtNodeRpcRemote } from '../../src/dht/DhtNodeRpcRemote'
import { PeerManager, getDistance } from '../../src/dht/PeerManager'
import { DiscoverySession } from '../../src/dht/discovery/DiscoverySession'
import { DhtAddress, getNodeIdFromPeerDescriptor, getRawFromDhtAddress } from '../../src/identifiers'
import { NodeType, PeerDescriptor } from '../../src/proto/packages/dht/protos/DhtRpc'
import { createTestTopology } from '../utils/topology'

const NODE_COUNT = 40
const MIN_NEIGHBOR_COUNT = 2  // nodes can get more neighbors when we merge network partitions
const PARALLELISM = 1
const NO_PROGRESS_LIMIT = 1
const QUERY_BATCH_SIZE = 5  // the default value in DhtNode's config, not relevant in this test

const createPeerDescriptor = (nodeId: DhtAddress): PeerDescriptor => {
    return {
        nodeId: getRawFromDhtAddress(nodeId),
        type: NodeType.NODEJS
    }
}

describe('DiscoverySession', () => {

    let topology: Multimap<DhtAddress, DhtAddress>
    const queriedNodes: DhtAddress[] = []

    beforeAll(() => {
        topology = createTestTopology(NODE_COUNT, MIN_NEIGHBOR_COUNT)
    })

    const createPeerManager = (localNodeId: DhtAddress): PeerManager => {
        const peerManager = new PeerManager({
            localNodeId,
            localPeerDescriptor: createPeerDescriptor(localNodeId),
            isLayer0: true,
            createDhtNodeRpcRemote: (peerDescriptor: PeerDescriptor) => createMockRpcRemote(peerDescriptor) as any
        } as any)
        for (const neighbor of topology.get(localNodeId)) {
            peerManager.addContact(createPeerDescriptor(neighbor))
        }
        return peerManager
    }

    const createMockRpcRemote = (peerDescriptor: PeerDescriptor): Partial<DhtNodeRpcRemote> => {
        const nodeId = getNodeIdFromPeerDescriptor(peerDescriptor)
        return {
            id: getRawFromDhtAddress(nodeId),
            getPeerDescriptor: () => peerDescriptor,
            getNodeId: () => nodeId,
            getClosestPeers: async (referenceId: DhtAddress) => {
                queriedNodes.push(nodeId)
                await wait(10)
                const peerManager = createPeerManager(nodeId)
                return peerManager.getClosestNeighborsTo(referenceId, QUERY_BATCH_SIZE).map((remote) => remote.getPeerDescriptor())
            },
            ping: async () => true
        }
    }

    it('happy path', async () => {
        const nodeIds = [...topology.keys()]
        const [localNodeId, targetId] = sampleSize(nodeIds, 2)
        const contactedPeers = new Set<DhtAddress>()
        const peerManager = createPeerManager(localNodeId)
        const session = new DiscoverySession({
            targetId,
            parallelism: PARALLELISM,
            noProgressLimit: NO_PROGRESS_LIMIT,
            peerManager,
            contactedPeers,
            abortSignal: new AbortController().signal
        })
        await session.findClosestNodes(1000)
        expect(queriedNodes.length).toBeGreaterThanOrEqual(1)
        // Each queried node should closer to the target than the previous queried node, because we
        // use parallelism=1 and noProgressLimit=1
        const distancesToTarget = queriedNodes
            .map((nodeId) => getDistance(getRawFromDhtAddress(nodeId), getRawFromDhtAddress(targetId)))
        for (let i = 1; i < distancesToTarget.length ; i++) {
            expect(distancesToTarget[i]).toBeLessThan(distancesToTarget[i - 1])
        }
    })
})
