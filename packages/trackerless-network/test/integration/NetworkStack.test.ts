import { NetworkStack } from '../../src/NetworkStack'
import { NodeType, PeerDescriptor, PeerID } from '@streamr/dht'
import {
    StreamPartIDUtils,
    toStreamID,
} from '@streamr/protocol'
import { waitForCondition } from '@streamr/utils'
import { createStreamMessage } from '../utils/utils'

describe('NetworkStack', () => {

    let stack1: NetworkStack
    let stack2: NetworkStack
    const streamPartId = StreamPartIDUtils.parse('stream1#0')

    const epDescriptor: PeerDescriptor = {
        kademliaId: PeerID.fromString('entrypoint').value,
        type: NodeType.NODEJS,
        websocket: { ip: 'localhost', port: 32222 },
        nodeName: 'entrypoint'
    }

    beforeEach(async () => {
        stack1 = new NetworkStack({
            layer0: {
                peerDescriptor: epDescriptor,
                entryPoints: [epDescriptor],
                nodeName: 'entrypoint'
            },
            networkNode: {}
        })
        stack2 = new NetworkStack({
            layer0: {
                websocketPortRange: { min: 32223, max: 32223 },
                peerIdString: 'network-stack',
                entryPoints: [epDescriptor],
                nodeName: 'node2'
            },
            networkNode: {}
        })

        await stack1.start()
        stack1.getStreamrNode()!.setStreamPartEntryPoints(streamPartId, [epDescriptor])
        await stack2.start()
        stack2.getStreamrNode()!.setStreamPartEntryPoints(streamPartId, [epDescriptor])
    })

    afterEach(async () => {
        await Promise.all([
            stack1.stop(),
            stack2.stop()
        ])
    })

    it('Can use NetworkNode pub/sub via NetworkStack', async () => {
        let receivedMessages = 0
        await stack1.getStreamrNode().waitForJoinAndSubscribe(streamPartId)
        stack1.getStreamrNode().on('newMessage', () => {
            receivedMessages += 1
        })
        const msg = createStreamMessage(
            JSON.stringify({ hello: 'WORLD' }),
            toStreamID(streamPartId),
            PeerID.fromString('network-stack').value
        )
        await stack2.getStreamrNode().waitForJoinAndPublish(streamPartId, msg)
        await waitForCondition(() => receivedMessages === 1)
    })

})
