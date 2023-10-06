import { MessageID, MessageRef, StreamMessage, StreamMessageType, StreamPartID, StreamPartIDUtils } from '@streamr/protocol'
import { randomEthereumAddress } from '@streamr/test-utils'
import { hexToBinary, utf8ToBinary, waitForEvent3 } from '@streamr/utils'
import { NetworkNode, createNetworkNode } from '../../src/NetworkNode'
import { StreamNodeType } from '../../src/logic/StreamrNode'
import { StreamMessage as InternalStreamMessage, ProxyDirection } from '../../src/proto/packages/trackerless-network/protos/NetworkRpc'
import { createMockPeerDescriptor } from '../utils/utils'

const PROXIED_NODE_USER_ID = randomEthereumAddress()

const createMessage = (streamPartId: StreamPartID): StreamMessage => {
    return new StreamMessage({ 
        messageId: new MessageID(
            StreamPartIDUtils.getStreamID(streamPartId),
            StreamPartIDUtils.getStreamPartition(streamPartId),
            666,
            0,
            randomEthereumAddress(),
            'msgChainId'
        ),
        prevMsgRef: new MessageRef(665, 0),
        content: utf8ToBinary(JSON.stringify({
            hello: 'world'
        })),
        messageType: StreamMessageType.MESSAGE,
        signature: hexToBinary('0x1234'),
    })
}

describe('proxy and full node', () => {

    const proxyNodeDescriptor = createMockPeerDescriptor({
        nodeName: 'proxyNode',
        websocket: { host: '127.0.0.1', port: 23135, tls: false }
    })
    const proxiedNodeDescriptor = createMockPeerDescriptor()
    const proxiedStreamPart = StreamPartIDUtils.parse('proxy-stream#0')
    const regularStreamPart1 = StreamPartIDUtils.parse('regular-stream1#0')
    const regularStreamPart2 = StreamPartIDUtils.parse('regular-stream2#0')
    const regularStreamPart3 = StreamPartIDUtils.parse('regular-stream3#0')
    const regularStreamPart4 = StreamPartIDUtils.parse('regular-stream4#0')
    let proxyNode: NetworkNode
    let proxiedNode: NetworkNode

    beforeEach(async () => {
        proxyNode = createNetworkNode({
            layer0: {
                entryPoints: [proxyNodeDescriptor],
                peerDescriptor: proxyNodeDescriptor,
            },
            networkNode: {
                acceptProxyConnections: true
            }
        })
        await proxyNode.start()
        proxyNode.stack.getStreamrNode()!.joinStreamPart(proxiedStreamPart)
        proxyNode.stack.getStreamrNode()!.joinStreamPart(regularStreamPart1)
        proxyNode.stack.getStreamrNode()!.joinStreamPart(regularStreamPart2)
        proxyNode.stack.getStreamrNode()!.joinStreamPart(regularStreamPart3)
        proxyNode.stack.getStreamrNode()!.joinStreamPart(regularStreamPart4)

        proxiedNode = createNetworkNode({
            layer0: {
                entryPoints: [proxyNodeDescriptor],
                peerDescriptor: proxiedNodeDescriptor,
            }
        })
        await proxiedNode.start(false)
    })

    afterEach(async () => {
        await proxyNode.stop()
        await proxiedNode.stop()
    })

    it('proxied node can act as full node on another stream', async () => {
        await proxiedNode.setProxies(proxiedStreamPart, [proxyNodeDescriptor], ProxyDirection.PUBLISH, PROXIED_NODE_USER_ID, 1)
        expect(proxiedNode.stack.getLayer0DhtNode().hasJoined()).toBe(false)

        await Promise.all([
            waitForEvent3(proxyNode.stack.getStreamrNode()! as any, 'newMessage'),
            proxiedNode.broadcast(createMessage(regularStreamPart1))
        ])

        expect(proxiedNode.stack.getLayer0DhtNode().hasJoined()).toBe(true)

        await Promise.all([
            waitForEvent3(proxyNode.stack.getStreamrNode()! as any, 'newMessage'),
            proxiedNode.broadcast(createMessage(proxiedStreamPart))
        ])

        expect(proxiedNode.stack.getStreamrNode().getStream(proxiedStreamPart)!.type).toBe(StreamNodeType.PROXY)
        expect(proxiedNode.stack.getStreamrNode().getStream(regularStreamPart1)!.type).toBe(StreamNodeType.RANDOM_GRAPH)
    })

    it('proxied node can act as full node on multiple streams', async () => {
        await proxiedNode.setProxies(proxiedStreamPart, [proxyNodeDescriptor], ProxyDirection.PUBLISH, PROXIED_NODE_USER_ID, 1)
        expect(proxiedNode.stack.getLayer0DhtNode().hasJoined()).toBe(false)

        await Promise.all([
            waitForEvent3(proxyNode.stack.getStreamrNode()! as any, 'newMessage', 5000, 
                (streamMessage: InternalStreamMessage) => streamMessage.messageId!.streamId === 'regular-stream1'),
            waitForEvent3(proxyNode.stack.getStreamrNode()! as any, 'newMessage', 5000, 
                (streamMessage: InternalStreamMessage) => streamMessage.messageId!.streamId === 'regular-stream2'),
            waitForEvent3(proxyNode.stack.getStreamrNode()! as any, 'newMessage', 5000, 
                (streamMessage: InternalStreamMessage) => streamMessage.messageId!.streamId === 'regular-stream3'),
            waitForEvent3(proxyNode.stack.getStreamrNode()! as any, 'newMessage', 5000, 
                (streamMessage: InternalStreamMessage) => streamMessage.messageId!.streamId === 'regular-stream4'),
            proxiedNode.broadcast(createMessage(regularStreamPart1)),
            proxiedNode.broadcast(createMessage(regularStreamPart2)),
            proxiedNode.broadcast(createMessage(regularStreamPart3)),
            proxiedNode.broadcast(createMessage(regularStreamPart4))
        ])

        expect(proxiedNode.stack.getLayer0DhtNode().hasJoined()).toBe(true)

        await Promise.all([
            waitForEvent3(proxyNode.stack.getStreamrNode()! as any, 'newMessage'),
            proxiedNode.broadcast(createMessage(proxiedStreamPart))
        ])

        expect(proxiedNode.stack.getStreamrNode().getStream(proxiedStreamPart)!.type).toBe(StreamNodeType.PROXY)
        expect(proxiedNode.stack.getStreamrNode().getStream(regularStreamPart1)!.type).toBe(StreamNodeType.RANDOM_GRAPH)
        expect(proxiedNode.stack.getStreamrNode().getStream(regularStreamPart2)!.type).toBe(StreamNodeType.RANDOM_GRAPH)
        expect(proxiedNode.stack.getStreamrNode().getStream(regularStreamPart3)!.type).toBe(StreamNodeType.RANDOM_GRAPH)
        expect(proxiedNode.stack.getStreamrNode().getStream(regularStreamPart4)!.type).toBe(StreamNodeType.RANDOM_GRAPH)
    })

})
