import { DhtNode, Events as DhtNodeEvents } from '../../src/dht/DhtNode'
import { Message, MessageType, PeerDescriptor, RpcMessage } from '../../src/proto/DhtRpc'
import { runAndWaitForEvents3 } from '../../src/helpers/waitForEvent3'
import { waitForCondition } from 'streamr-test-utils'
import { createMockConnectionDhtNode, createWrappedClosestPeersRequest } from '../utils'
import { PeerID } from '../../src/helpers/PeerID'
import { Simulator } from '../../src/connection/Simulator'
import { UUID } from '../../src/helpers/UUID'

describe('Route Message With Mock Connections', () => {
    let entryPoint: DhtNode
    let sourceNode: DhtNode
    let destinationNode: DhtNode
    let routerNodes: DhtNode[]
    let simulator: Simulator
    let entryPointDescriptor: PeerDescriptor

    const entryPointId = '0'
    const sourceId = 'eeeeeeeee'
    const destinationId = '000000000'
    const SERVICE_ID = 'layer0'

    beforeEach(async () => {
        routerNodes = []
        simulator = new Simulator()
        entryPoint = await createMockConnectionDhtNode(entryPointId, simulator)

        entryPointDescriptor = {
            peerId: entryPoint.getNodeId().value,
            type: 0
        }

        sourceNode = await createMockConnectionDhtNode(sourceId, simulator)
        destinationNode = await createMockConnectionDhtNode(destinationId, simulator)

        for (let i = 1; i < 50; i++) {
            const nodeId = `${i}`
            const node = await createMockConnectionDhtNode(nodeId, simulator)
            routerNodes.push(node)
        }
        await entryPoint.joinDht(entryPointDescriptor)
    })

    afterEach(() => {
        entryPoint.stop()
        destinationNode.stop()
        sourceNode.stop()
        routerNodes.map((node) => {
            node.stop()
        })
    })

    it('Happy path', async () => {
        await destinationNode.joinDht(entryPointDescriptor)
        await sourceNode.joinDht(entryPointDescriptor)
        await Promise.all(
            routerNodes.map((node) => node.joinDht(entryPointDescriptor))
        )

        const rpcWrapper = createWrappedClosestPeersRequest(sourceNode.getPeerDescriptor(), destinationNode.getPeerDescriptor())
        const message: Message = {
            serviceId: SERVICE_ID,
            messageId: 'tsatsa',
            messageType: MessageType.RPC,
            body: RpcMessage.toBinary(rpcWrapper)
        }

        runAndWaitForEvents3<DhtNodeEvents>([() => {
            sourceNode.doRouteMessage({
                message: Message.toBinary(message),
                destinationPeer: destinationNode.getPeerDescriptor(),
                requestId: 'tsatsa',
                sourcePeer: sourceNode.getPeerDescriptor()
            })
        }], [[destinationNode, 'data']])
    })
    /* ToDo: replace this with a case where no candidates
    can be found 

    it('Destination node does not exist after first hop', async () => {
        await sourceNode.joinDht(entryPointDescriptor)

        const rpcWrapper = createWrappedClosestPeersRequest(sourceNode.getPeerDescriptor(), destinationNode.getPeerDescriptor())
        const message: Message = {
            serviceId: SERVICE_ID,
            messageId: 'tsutsu',
            messageType: MessageType.RPC,
            body: RpcMessage.toBinary(rpcWrapper)
        }
        await expect(sourceNode.doRouteMessage({
            message: Message.toBinary(message),
            destinationPeer: destinationNode.getPeerDescriptor(),
            requestId: 'tsutsu',
            sourcePeer: sourceNode.getPeerDescriptor()
        })).rejects.toThrow()
    })

    */

    it('Receives multiple messages', async () => {
        const numOfMessages = 100
        await sourceNode.joinDht(entryPointDescriptor)
        await destinationNode.joinDht(entryPointDescriptor)

        let receivedMessages = 0
        destinationNode.on('data', () => {
            receivedMessages += 1
        })
        const rpcWrapper = createWrappedClosestPeersRequest(sourceNode.getPeerDescriptor(), destinationNode.getPeerDescriptor())
        const message: Message = {
            serviceId: SERVICE_ID,
            messageId: 'tsutsu',
            messageType: MessageType.RPC,
            body: RpcMessage.toBinary(rpcWrapper)
        }
        for (let i = 0; i < numOfMessages; i++) {
            sourceNode.doRouteMessage({
                message: Message.toBinary(message),
                destinationPeer: destinationNode.getPeerDescriptor(),
                requestId: 'tsutsu',
                sourcePeer: sourceNode.getPeerDescriptor()
            })
        }
        await waitForCondition(() => receivedMessages >= numOfMessages)
    })

    it('From all to all', async () => {
        const routers = routerNodes.splice(0, 30)
        const numsOfReceivedMessages: Record<string, number> = {}
        await entryPoint.joinDht(entryPointDescriptor)
        await Promise.all(
            routers.map((node) => {
                numsOfReceivedMessages[node.getNodeId().toKey()] = 0
                node.on('data', () => {
                    numsOfReceivedMessages[node.getNodeId().toKey()] = numsOfReceivedMessages[node.getNodeId().toKey()] + 1
                })
                return node.joinDht(entryPointDescriptor)
            })
        )
        await Promise.allSettled(
            routers.map(async (node) =>
                await Promise.all(routers.map(async (receiver) => {
                    if (!node.getNodeId().equals(receiver.getNodeId())) {
                        const rpcWrapper = createWrappedClosestPeersRequest(sourceNode.getPeerDescriptor(), destinationNode.getPeerDescriptor())
                        const message: Message = {
                            serviceId: SERVICE_ID,
                            messageId: 'tsutsu',
                            messageType: MessageType.RPC,
                            body: RpcMessage.toBinary(rpcWrapper)
                        }
                        await node.doRouteMessage({
                            message: Message.toBinary(message),
                            destinationPeer: receiver.getPeerDescriptor(),
                            sourcePeer: node.getPeerDescriptor(),
                            requestId: new UUID().toString()
                        })
                    }
                }))
            )
        )
        await waitForCondition(() => numsOfReceivedMessages[PeerID.fromString('1').toKey()] >= routers.length - 1, 30000)
        await Promise.allSettled(
            Object.values(numsOfReceivedMessages).map(async (count) =>
                await waitForCondition(() => {
                    console.info(count)
                    return count >= routers.length - 1
                }, 30000)
            )
        )
    }, 60000)
})
