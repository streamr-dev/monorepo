import { NetworkNode } from '../../src/logic/NetworkNode'
import { MessageID, StreamMessage, StreamPartIDUtils, toStreamID } from 'streamr-client-protocol'
import { startTracker, Tracker } from '@streamr/network-tracker'
import { createNetworkNode } from '../../src/composition'
import { toEthereumAddress } from '@streamr/utils'

const PUBLISHER_ID = toEthereumAddress('0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')

/**
 * When a node receives a message for a stream it hasn't still subscribed to, it
 * subscribes to the stream and then asks the tracker who else is participating
 * in the stream. In this test we verify that the initial message that causes
 * this whole process is itself eventually delivered.
 */
describe('message buffering of Node', () => {
    let tracker: Tracker
    let sourceNode: NetworkNode
    let destinationNode: NetworkNode

    beforeAll(async () => {
        tracker = await startTracker({
            listen: {
                hostname: '127.0.0.1',
                port: 30320
            }
        })
        const trackerInfo = tracker.getConfigRecord()

        sourceNode = createNetworkNode({
            id: 'source-node',
            trackers: [trackerInfo],
            webrtcDisallowPrivateAddresses: false
        })
        destinationNode = createNetworkNode({
            id: 'destination-node',
            trackers: [trackerInfo],
            webrtcDisallowPrivateAddresses: false
        })

        sourceNode.start()
        destinationNode.start()
    })

    afterAll(async () => {
        await sourceNode.stop()
        await destinationNode.stop()
        await tracker.stop()
    })

    test('first message to unknown stream eventually gets delivered', (done) => {
        destinationNode.addMessageListener((streamMessage) => {
            expect(streamMessage.messageId).toEqual(
                new MessageID(toStreamID('id'), 0, 1, 0, PUBLISHER_ID, 'session-id')
            )
            expect(streamMessage.getParsedContent()).toEqual({
                hello: 'world'
            })
            done()
        })

        destinationNode.subscribe(StreamPartIDUtils.parse('id#0'))

        // "Client" pushes data
        sourceNode.publish(new StreamMessage({
            messageId: new MessageID(toStreamID('id'), 0, 1, 0, PUBLISHER_ID, 'session-id'),
            content: {
                hello: 'world'
            },
            signature: 'signature'
        }))
    })
})
