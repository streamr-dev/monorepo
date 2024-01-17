import { Simulator, SimulatorTransport, ListeningRpcCommunicator, areEqualPeerDescriptors, PeerDescriptor } from '@streamr/dht'
import { NetworkStack } from '../../src/NetworkStack'
import { createMockPeerDescriptor } from '../utils/utils'
import { NodeInfoClient } from '../../src/logic/node-info-rpc/NodeInfoClient'
import { NODE_INFO_RPC_SERVICE_ID } from '../../src/logic/node-info-rpc/NodeInfoRpcLocal'
import { StreamPartIDUtils } from '@streamr/protocol'
import { waitForCondition } from '@streamr/utils'

const normalizePeerDescriptor = (peerDescriptor: PeerDescriptor) => {
    return {
        ...peerDescriptor,
        nodeId: new Uint8Array(peerDescriptor.nodeId)
    }
}

describe('NetworkStack NodeInfoRpc', () => {

    let requesteStack: NetworkStack
    let otherStack: NetworkStack
    let nodeInfoClient: NodeInfoClient
    let requesteeTransport1: SimulatorTransport
    let otherTransport: SimulatorTransport
    let requestorTransport: SimulatorTransport

    let simulator: Simulator

    const requesteePeerDescriptor = createMockPeerDescriptor()
    const otherPeerDescriptor = createMockPeerDescriptor()
    const requestorPeerDescriptor = createMockPeerDescriptor()

    beforeEach(async () => {
        simulator = new Simulator()
        requesteeTransport1 = new SimulatorTransport(requesteePeerDescriptor, simulator)
        otherTransport = new SimulatorTransport(otherPeerDescriptor, simulator)
        requestorTransport = new SimulatorTransport(requestorPeerDescriptor, simulator)
        await requesteeTransport1.start()
        await otherTransport.start()
        await requestorTransport.start()
        requesteStack = new NetworkStack({
            layer0: {
                transport: requesteeTransport1,
                peerDescriptor: requesteePeerDescriptor,
                entryPoints: [requesteePeerDescriptor]
            }
        })
        otherStack = new NetworkStack({
            layer0: {
                transport: otherTransport,
                peerDescriptor: otherPeerDescriptor,
                entryPoints: [requesteePeerDescriptor]
            }
        })
        await requesteStack.start()
        await otherStack.start()
        nodeInfoClient = new NodeInfoClient(requestorPeerDescriptor, new ListeningRpcCommunicator(NODE_INFO_RPC_SERVICE_ID, requestorTransport))
    })

    afterEach(async () => {
        await requesteStack.stop()
        await otherStack.stop()
        await requesteeTransport1.stop()
        await otherTransport.stop()
        await requestorTransport.stop()
    })

    it('NodeInfoClient can query NetworkStacks', async () => {
        const result = await nodeInfoClient.getInfo(requesteePeerDescriptor)
        expect(result.controlLayer).toBeDefined()
        expect(result.streamPartitions).toBeDefined()
    })

    it('NodeInfoClient gets control layer info', async () => {
        const result = await nodeInfoClient.getInfo(requesteePeerDescriptor)
        expect(result.controlLayer).toBeDefined()
        expect(result.controlLayer!.connections.length).toEqual(2)
        expect(result.controlLayer!.neighbors.length).toEqual(1)
        expect(areEqualPeerDescriptors(result.controlLayer!.neighbors[0], otherPeerDescriptor)).toEqual(true)
    })

    it('NodeInfoClient gets stream partition info', async () => {
        const streamPartId1 = StreamPartIDUtils.parse('stream1#0')
        const streamPartId2 = StreamPartIDUtils.parse('stream2#0')
        requesteStack.getStreamrNode().joinStreamPart(streamPartId1)
        otherStack.getStreamrNode().joinStreamPart(streamPartId1)
        requesteStack.getStreamrNode().joinStreamPart(streamPartId2)
        otherStack.getStreamrNode().joinStreamPart(streamPartId2)
        await waitForCondition(() => 
            requesteStack.getStreamrNode().getNeighbors(streamPartId1).length === 1 
            && otherStack.getStreamrNode().getNeighbors(streamPartId1).length === 1
            && requesteStack.getStreamrNode().getNeighbors(streamPartId2).length === 1
            && otherStack.getStreamrNode().getNeighbors(streamPartId2).length === 1
        )
        const result = await nodeInfoClient.getInfo(requesteePeerDescriptor)
        expect(result).toMatchObject({
            peerDescriptor: normalizePeerDescriptor(requesteePeerDescriptor),
            controlLayer: {
                neighbors: [normalizePeerDescriptor(otherPeerDescriptor)],
                connections: [normalizePeerDescriptor(otherPeerDescriptor), normalizePeerDescriptor(requestorPeerDescriptor)]
            },
            streamPartitions: [
                {
                    id: streamPartId1,
                    controlLayerNeighbors: [normalizePeerDescriptor(otherPeerDescriptor)],
                    deliveryLayerNeighbors: [normalizePeerDescriptor(otherPeerDescriptor)]
                },
                {
                    id: streamPartId2,
                    controlLayerNeighbors: [normalizePeerDescriptor(otherPeerDescriptor)],
                    deliveryLayerNeighbors: [normalizePeerDescriptor(otherPeerDescriptor)]
                }
            ]
        })
        expect(result.streamPartitions.length).toEqual(2)
    })

})
