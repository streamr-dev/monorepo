import { Tracker, startTracker } from '@streamr/network-tracker'
import { NetworkNode } from '../../src/logic/NetworkNode'

import { StreamPartID, toStreamID, StreamPartIDUtils, StreamMessage, MessageID } from 'streamr-client-protocol'
import { waitForEvent } from '@streamr/utils'

import { createNetworkNode } from '../../src/composition'
import { Event as NodeEvent } from '../../src/logic/Node'

const streamPartOne = StreamPartIDUtils.parse('s#1')
const streamPartTwo = StreamPartIDUtils.parse('s#2')

describe('node unsubscribing from a stream', () => {
    let tracker: Tracker
    let nodeA: NetworkNode
    let nodeB: NetworkNode

    beforeEach(async () => {
        tracker = await startTracker({
            listen: {
                hostname: '127.0.0.1',
                port: 30450
            }
        })
        const trackerInfo = tracker.getConfigRecord()

        nodeA = createNetworkNode({
            id: 'a',
            trackers: [trackerInfo],
            disconnectionWaitTime: 200,
            webrtcDisallowPrivateAddresses: false
        })
        nodeB = createNetworkNode({
            id: 'b',
            trackers: [trackerInfo],
            disconnectionWaitTime: 200,
            webrtcDisallowPrivateAddresses: false
        })

        nodeA.start()
        nodeB.start()

        nodeA.subscribe(streamPartTwo)
        nodeB.subscribe(streamPartTwo)
        await Promise.all([
            waitForEvent(nodeA, NodeEvent.NODE_SUBSCRIBED),
            waitForEvent(nodeB, NodeEvent.NODE_SUBSCRIBED),
        ])

        nodeA.subscribe(streamPartOne)
        nodeB.subscribe(streamPartOne)
        await Promise.all([
            waitForEvent(nodeA, NodeEvent.NODE_SUBSCRIBED),
            waitForEvent(nodeB, NodeEvent.NODE_SUBSCRIBED),
        ])
    })

    afterEach(async () => {
        await nodeA.stop()
        await nodeB.stop()
        await tracker.stop()
    })

    test('node still receives data for subscribed streams thru existing connections', async () => {
        const actual: StreamPartID[] = []
        nodeB.addMessageListener((streamMessage) => {
            actual.push(streamMessage.getStreamPartID())
        })

        nodeB.unsubscribe(streamPartTwo)
        await waitForEvent(nodeA, NodeEvent.NODE_UNSUBSCRIBED)

        nodeA.publish(new StreamMessage({
            messageId: new MessageID(toStreamID('s'), 2, 0, 0, 'publisherId', 'msgChainId'),
            content: {},
            signature: 'signature'
        }))
        nodeA.publish(new StreamMessage({
            messageId: new MessageID(toStreamID('s'), 1, 0, 0, 'publisherId', 'msgChainId'),
            content: {},
            signature: 'signature'
        }))
        await waitForEvent(nodeB, NodeEvent.UNSEEN_MESSAGE_RECEIVED)
        expect(actual).toEqual(['s#1'])
    })

    test('connection between nodes is not kept if no shared streams', async () => {
        nodeB.unsubscribe(streamPartTwo)
        await waitForEvent(nodeA, NodeEvent.NODE_UNSUBSCRIBED)

        nodeA.unsubscribe(streamPartOne)
        await waitForEvent(nodeB, NodeEvent.NODE_UNSUBSCRIBED)

        const [aEventArgs, bEventArgs] = await Promise.all([
            waitForEvent(nodeA, NodeEvent.NODE_DISCONNECTED),
            waitForEvent(nodeB, NodeEvent.NODE_DISCONNECTED)
        ])

        expect(aEventArgs).toEqual(['b'])
        expect(bEventArgs).toEqual(['a'])
    })
})
