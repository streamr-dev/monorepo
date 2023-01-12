/* eslint-disable @typescript-eslint/prefer-for-of */

import { DhtNode, Events as DhtNodeEvents } from '../../src/dht/DhtNode'
import { Message, MessageType, PeerDescriptor, RouteMessageWrapper } from '../../src/proto/packages/dht/protos/DhtRpc'
import { RpcMessage } from '../../src/proto/packages/proto-rpc/protos/ProtoRpc'
import { runAndWaitForEvents3 } from '../../src/helpers/waitForEvent3'
import { waitForCondition } from '@streamr/utils'
import { createMockConnectionDhtNode, createWrappedClosestPeersRequest } from '../utils'
import { PeerID } from '../../src/helpers/PeerID'
import { Simulator } from '../../src/connection/Simulator/Simulator'
import { v4 } from 'uuid'
import { UUID } from '../../src/helpers/UUID'
import { Any } from '../../src/proto/google/protobuf/any'

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
    const NUM_NODES = 50

    const receiveMatrix: Array<Array<number>> = []

    beforeEach(async () => {
        routerNodes = []
        simulator = new Simulator()
        entryPoint = await createMockConnectionDhtNode(entryPointId, simulator)

        entryPointDescriptor = {
            kademliaId: entryPoint.getNodeId().value,
            nodeName: 'entrypoint',
            type: 0
        }

        sourceNode = await createMockConnectionDhtNode(sourceId, simulator)
        destinationNode = await createMockConnectionDhtNode(destinationId, simulator)

        for (let i = 1; i < NUM_NODES; i++) {
            const nodeId = `${i}`
            const node = await createMockConnectionDhtNode(nodeId, simulator)
            routerNodes.push(node)
        }
        await entryPoint.joinDht(entryPointDescriptor)
    })

    afterEach(async () => {

        await Promise.all(routerNodes.map((node) => node.stop()))

        await Promise.all([
            entryPoint.stop(),
            destinationNode.stop(),
            sourceNode.stop()
        ])

        await simulator.stop()
    })

    it('Happy path', async () => {
        await destinationNode.joinDht(entryPointDescriptor)
        await sourceNode.joinDht(entryPointDescriptor)
        await Promise.all(
            routerNodes.map((node) => node.joinDht(entryPointDescriptor))
        )

        const rpcWrapper = createWrappedClosestPeersRequest(sourceNode.getPeerDescriptor(), destinationNode.getPeerDescriptor())
        const message: Message = {
            serviceId: 'unknown',
            messageId: v4(),
            messageType: MessageType.RPC,
            body: {
                oneofKind: 'rpcMessage',
                rpcMessage: rpcWrapper
            },
            sourceDescriptor: sourceNode.getPeerDescriptor(),
            targetDescriptor: destinationNode.getPeerDescriptor()
        }

        await runAndWaitForEvents3<DhtNodeEvents>([() => {
            sourceNode.doRouteMessage({
                message: message,
                destinationPeer: destinationNode.getPeerDescriptor(),
                requestId: v4(),
                sourcePeer: sourceNode.getPeerDescriptor(),
                reachableThrough: [],
                routingPath: []

            })
        }], [[destinationNode, 'message']], 20000)
    }, 30000)
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
        destinationNode.on('message', (_message: Message) => {
            receivedMessages += 1
        })
        const rpcWrapper = createWrappedClosestPeersRequest(sourceNode.getPeerDescriptor(), destinationNode.getPeerDescriptor())

        for (let i = 0; i < numOfMessages; i++) {
            const message: Message = {
                serviceId: 'unknown',
                messageId: v4(),
                messageType: MessageType.RPC,
                body: {
                    oneofKind: 'rpcMessage',
                    rpcMessage: rpcWrapper
                },
                sourceDescriptor: sourceNode.getPeerDescriptor(),
                targetDescriptor: destinationNode.getPeerDescriptor()
            }
            sourceNode.doRouteMessage({
                message: message,
                destinationPeer: destinationNode.getPeerDescriptor(),
                requestId: v4(),
                sourcePeer: sourceNode.getPeerDescriptor(),
                reachableThrough: [],
                routingPath: []
            })
        }
        await waitForCondition(() => {
            return receivedMessages >= numOfMessages
        })
    })

    it('From all to all', async () => {
        const routers: DhtNode[] = []
        for (let i = 0; i < routerNodes.length; i++) {
            routers.push(routerNodes[i])
        }

        for (let i = 0; i < routers.length; i++) {
            const arr: Array<number> = []
            for (let j = 0; j < routers.length; j++) {
                arr.push(0)
            }
            receiveMatrix.push(arr)
        }

        const numsOfReceivedMessages: Record<string, number> = {}
        await entryPoint.joinDht(entryPointDescriptor)
        await Promise.all(
            routers.map((node) => {
                numsOfReceivedMessages[node.getNodeId().toKey()] = 0
                node.on('message', (msg: Message) => {
                    numsOfReceivedMessages[node.getNodeId().toKey()] = numsOfReceivedMessages[node.getNodeId().toKey()] + 1
                    try {
                        const target = receiveMatrix[parseInt(node.getNodeId().toString()) - 1]
                        target[parseInt(PeerID.fromValue(msg.sourceDescriptor!.kademliaId!).toString()) - 1]++
                    } catch (e) {
                        console.error(e)
                    }
                    if (parseInt(node.getNodeId().toString()) > routers.length || parseInt(node.getNodeId().toString()) < 1) {
                        console.error(node.getNodeId().toString())
                    }
                })
                return node.joinDht(entryPointDescriptor)
            })
        )
        await Promise.all(
            routers.map(async (node) =>
                Promise.all(routers.map(async (receiver) => {
                    if (!node.getNodeId().equals(receiver.getNodeId())) {
                        const rpcWrapper = createWrappedClosestPeersRequest(sourceNode.getPeerDescriptor(), destinationNode.getPeerDescriptor())
                        const message: Message = {
                            serviceId: 'nonexisting_service',
                            messageId: v4(),
                            messageType: MessageType.RPC,
                            body: {
                                oneofKind: 'rpcMessage',
                                rpcMessage: rpcWrapper
                            },
                            sourceDescriptor: node.getPeerDescriptor(),
                            targetDescriptor: destinationNode.getPeerDescriptor()
                        }
                        await node.doRouteMessage({
                            message: message,
                            destinationPeer: receiver.getPeerDescriptor(),
                            sourcePeer: node.getPeerDescriptor(),
                            requestId: v4(),
                            reachableThrough: [],
                            routingPath: []
                        })
                    }
                }))
            )
        )
        await waitForCondition(() => {
            return (numsOfReceivedMessages[PeerID.fromString('1').toKey()] >= routers.length - 1)
        }, 30000
        )
        await Promise.all(
            Object.keys(numsOfReceivedMessages).map(async (key) =>
                waitForCondition(() => {
                    return numsOfReceivedMessages[key] >= routers.length - 1
                }, 30000)
            )
        )

    }, 60000)

    it('Destination receives forwarded message', async () => {
        await destinationNode.joinDht(entryPointDescriptor)
        await sourceNode.joinDht(entryPointDescriptor)

        await Promise.all(
            routerNodes.map((node) => node.joinDht(entryPointDescriptor))
        )

        const closestPeersRequest = createWrappedClosestPeersRequest(sourceNode.getPeerDescriptor(), destinationNode.getPeerDescriptor())
        const closestPeersRequestMessage: Message = {
            serviceId: 'unknown',
            messageId: v4(),
            messageType: MessageType.RPC,
            body: {
                oneofKind: 'rpcMessage',
                rpcMessage: closestPeersRequest
            },
            sourceDescriptor: sourceNode.getPeerDescriptor()!,
            targetDescriptor: destinationNode.getPeerDescriptor()!
        }

        const routeMessageWrapper: RouteMessageWrapper = {
            message: closestPeersRequestMessage,
            destinationPeer: destinationNode.getPeerDescriptor(),
            requestId: new UUID().toString(),
            sourcePeer: sourceNode.getPeerDescriptor(),
            reachableThrough: [entryPointDescriptor],
            routingPath: []
        }

        const rpcMessage: RpcMessage = {
            body: Any.pack(routeMessageWrapper, RouteMessageWrapper),
            header: {
                method: 'routeMessage',
                request: 'request'
            },
            requestId: v4()
        }

        const requestMessage: Message = {
            serviceId: 'layer0',
            messageId: v4(),
            messageType: MessageType.RPC,
            body: {
                oneofKind: 'rpcMessage',
                rpcMessage: rpcMessage
            },
            sourceDescriptor: sourceNode.getPeerDescriptor()!,
            targetDescriptor: entryPoint.getPeerDescriptor()!
        }

        const forwardedMessage: RouteMessageWrapper = {
            message: requestMessage,
            requestId: v4(),
            sourcePeer: sourceNode.getPeerDescriptor(),
            destinationPeer: entryPoint.getPeerDescriptor()!,
            reachableThrough: [],
            routingPath: []
        }

        await runAndWaitForEvents3<DhtNodeEvents>([() => {
            sourceNode.doRouteMessage(forwardedMessage, true)
        }], [/*[entryPoint, 'forwardedMessage'], */[destinationNode, 'message']])

    })

})

