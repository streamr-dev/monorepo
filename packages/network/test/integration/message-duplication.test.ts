import { NetworkNode } from '../../src/logic/NetworkNode'
import { Tracker, startTracker } from '@streamr/network-tracker'
import { MessageID, StreamMessage, StreamPartIDUtils, toStreamID } from '@streamr/protocol'
import { waitForCondition } from '@streamr/test-utils'
import { toEthereumAddress, waitForEvent } from '@streamr/utils'

import { createNetworkNode } from '../../src/composition'
import { Event as NodeEvent } from '../../src/logic/Node'

const PUBLISHER_ID = toEthereumAddress('0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')

/**
 * This test verifies that on receiving a duplicate message, it is not re-emitted to the node's subscribers.
 */
describe('duplicate message detection and avoidance', () => {
    let tracker: Tracker
    let contactNode: NetworkNode
    let otherNodes: NetworkNode[]
    let numOfReceivedMessages: number[]
    let numOfDuplicateMessages: number[]

    beforeAll(async () => {
        tracker = await startTracker({
            listen: {
                hostname: '127.0.0.1',
                port: 30350
            }
        })
        const trackerInfo = tracker.getConfigRecord()
        contactNode = createNetworkNode({
            id: 'node-0',
            trackers: [trackerInfo],
            iceServers: []
        })
        contactNode.start()

        otherNodes = [
            createNetworkNode({
                id: 'node-1',
                trackers: [trackerInfo],
                iceServers: [],
                webrtcDisallowPrivateAddresses: false
            }),
            createNetworkNode({
                id: 'node-2',
                trackers: [trackerInfo],
                iceServers: [],
                webrtcDisallowPrivateAddresses: false
            }),
            createNetworkNode({
                id: 'node-3',
                trackers: [trackerInfo],
                iceServers: [],
                webrtcDisallowPrivateAddresses: false
            }),
            createNetworkNode({
                id: 'node-4',
                trackers: [trackerInfo],
                iceServers: [],
                webrtcDisallowPrivateAddresses: false
            }),
            createNetworkNode({
                id: 'node-5',
                trackers: [trackerInfo],
                iceServers: [],
                webrtcDisallowPrivateAddresses: false
            }),
        ]

        // eslint-disable-next-line no-restricted-syntax
        for (const node of otherNodes) {
            node.start()
        }

        const allNodesSubscribed = Promise.all(otherNodes.map((node) => {
            return waitForEvent(node, NodeEvent.NODE_SUBSCRIBED)
        }))
        // Become subscribers (one-by-one, for well connected graph)
        const streamPartId = StreamPartIDUtils.parse('stream-id#0')
        otherNodes[0].subscribe(streamPartId)
        otherNodes[1].subscribe(streamPartId)
        otherNodes[2].subscribe(streamPartId)
        otherNodes[3].subscribe(streamPartId)
        otherNodes[4].subscribe(streamPartId)

        await allNodesSubscribed

        // Set up 1st test case
        let totalMessages = 0
        numOfReceivedMessages = [0, 0, 0, 0, 0]
        numOfDuplicateMessages = [0, 0, 0, 0, 0]
        const updater = (i: number) => () => {
            totalMessages += 1
            numOfReceivedMessages[i] += 1
        }
        for (let i = 0; i < otherNodes.length; ++i) {
            otherNodes[i].addMessageListener(updater(i))
            otherNodes[i].on(NodeEvent.DUPLICATE_MESSAGE_RECEIVED, () => {
                numOfDuplicateMessages[i] += 1
            })
        }

        // Produce data
        contactNode.publish(new StreamMessage({
            messageId: new MessageID(toStreamID('stream-id'), 0, 100, 0, PUBLISHER_ID, 'session'),
            content: {
                hello: 'world'
            },
            signature: 'signature'
        }))
        contactNode.publish(new StreamMessage({
            messageId: new MessageID(toStreamID('stream-id'), 0, 120, 0, PUBLISHER_ID, 'session'),
            content: {
                hello: 'world'
            },
            signature: 'signature'
        }))

        await waitForCondition(() => totalMessages > 9, 8000)
    }, 10000)

    afterAll(async () => {
        await Promise.allSettled([
            tracker.stop(),
            contactNode.stop(),
            otherNodes.map((node) => node.stop())
        ])
    })

    test('same message is emitted by a node exactly once', () => {
        expect(numOfReceivedMessages).toEqual([2, 2, 2, 2, 2])
    })

    test('maximum times a node receives duplicates of message is bounded by total number of repeaters', async () => {
        numOfDuplicateMessages.forEach((n) => {
            expect(n).toBeLessThanOrEqual(otherNodes.length * 2) // multiplier because 2 separate messages
        })
    })
})
