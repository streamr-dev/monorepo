import { DhtNode } from '../../src/dht/DhtNode'
import { Message, MessageType, PeerDescriptor, RpcMessage } from '../../src/proto/DhtRpc'
import { waitForCondition, waitForEvent } from 'streamr-test-utils'
import { Event as MessageRouterEvent } from '../../src/rpc-protocol/IMessageRouter'
import { createMockConnectionDhtNode, createWrappedClosestPeersRequest } from '../utils'
import { PeerID } from '../../src/PeerID'

describe('Route Message With Mock Connections', () => {
    let entryPoint: DhtNode
    let sourceNode: DhtNode
    let destinationNode: DhtNode
    let routerNodes: DhtNode[]

    let entryPointDescriptor: PeerDescriptor

    const entryPointId = '0'
    const sourceId = 'eeeeeeeee'
    const destinationId = '000000000'
    const APP_ID = 'layer0'

    beforeEach(async () => {
        routerNodes = []

        entryPoint = await createMockConnectionDhtNode(entryPointId)

        entryPointDescriptor = {
            peerId: entryPoint.getNodeId().value,
            type: 0
        }

        sourceNode = await createMockConnectionDhtNode(sourceId)
        destinationNode = await createMockConnectionDhtNode(destinationId)
        
        for (let i = 1; i < 50; i++) {
            const nodeId = `${i}`
            const node = await createMockConnectionDhtNode(nodeId)
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

    it ('Happy path', async () => {
        await destinationNode.joinDht(entryPointDescriptor)
        await sourceNode.joinDht(entryPointDescriptor)
        await Promise.all(
            routerNodes.map((node) => node.joinDht(entryPointDescriptor))
        )

        const rpcWrapper = createWrappedClosestPeersRequest(sourceNode.getPeerDescriptor(), destinationNode.getPeerDescriptor())
        const message: Message = {
            messageId: 'tsatsa',
            messageType: MessageType.RPC,
            body: RpcMessage.toBinary(rpcWrapper)
        }
        await Promise.all([
            waitForEvent(destinationNode, MessageRouterEvent.DATA),
            sourceNode.routeMessage({
                message: Message.toBinary(message),
                destinationPeer: destinationNode.getPeerDescriptor(),
                appId: APP_ID,
                sourcePeer: sourceNode.getPeerDescriptor()
            })
        ])
    })

    it('Destination node does not exist after first hop', async () => {
        await sourceNode.joinDht(entryPointDescriptor)

        const rpcWrapper = createWrappedClosestPeersRequest(sourceNode.getPeerDescriptor(), destinationNode.getPeerDescriptor())
        const message: Message = {
            messageId: 'tsutsu',
            messageType: MessageType.RPC,
            body: RpcMessage.toBinary(rpcWrapper)
        }
        await expect(sourceNode.routeMessage({
            message: Message.toBinary(message),
            destinationPeer: destinationNode.getPeerDescriptor(),
            appId: APP_ID,
            sourcePeer: sourceNode.getPeerDescriptor()
        })).rejects.toThrow()
    })

    it('Receives multiple messages', async () => {
        const numOfMessages = 100
        await sourceNode.joinDht(entryPointDescriptor)
        await destinationNode.joinDht(entryPointDescriptor)

        let receivedMessages = 0
        destinationNode.on(MessageRouterEvent.DATA, () => {
            receivedMessages += 1
        })
        const rpcWrapper = createWrappedClosestPeersRequest(sourceNode.getPeerDescriptor(), destinationNode.getPeerDescriptor())
        const message: Message = {
            messageId: 'tsutsu',
            messageType: MessageType.RPC,
            body: RpcMessage.toBinary(rpcWrapper)
        }
        for (let i = 0; i < numOfMessages; i++ ) {
            sourceNode.routeMessage({
                message: Message.toBinary(message),
                destinationPeer: destinationNode.getPeerDescriptor(),
                appId: APP_ID,
                sourcePeer: sourceNode.getPeerDescriptor()
            })
        }
        await waitForCondition(() => receivedMessages === numOfMessages)
    })

    it('From all to all', async () => {
        const routers = routerNodes.splice(0, 30)
        const numsOfReceivedMessages: {[key: string]: number} = {}
        await entryPoint.joinDht(entryPointDescriptor)
        await Promise.all(
            routers.map((node) => {
                node.joinDht(entryPointDescriptor)
                numsOfReceivedMessages[node.getNodeId().toString()] = 0
                node.on(MessageRouterEvent.DATA, () => {
                    numsOfReceivedMessages[node.getNodeId().toString()] = numsOfReceivedMessages[node.getNodeId().toString()] + 1
                })
            })
        )
        await Promise.allSettled(
            routers.map(async (node) =>
                await Promise.all(routers.map(async (receiver) => {
                    if (!node.getNodeId().equals(receiver.getNodeId())) {
                        const rpcWrapper = createWrappedClosestPeersRequest(sourceNode.getPeerDescriptor(), destinationNode.getPeerDescriptor())
                        const message: Message = {
                            messageId: 'tsutsu',
                            messageType: MessageType.RPC,
                            body: RpcMessage.toBinary(rpcWrapper)
                        }
                        await node.routeMessage({
                            message: Message.toBinary(message),
                            destinationPeer: receiver.getPeerDescriptor(),
                            appId: APP_ID,
                            sourcePeer: node.getPeerDescriptor()
                        })
                    }
                }))
            )
        )
        await waitForCondition(() => numsOfReceivedMessages[PeerID.fromString('1').toString()] >= routers.length - 1, 30000)
        await Promise.allSettled(
            Object.values(numsOfReceivedMessages).map(async (count) =>
                await waitForCondition(() => {
                    return count >= routers.length - 1
                }, 30000)
            )
        )
    }, 60000)
})