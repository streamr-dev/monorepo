import { NetworkNode } from '../../src/logic/NetworkNode'
import { Tracker, startTracker } from '@streamr/network-tracker'
import { MessageID, StreamMessage, toStreamID, toStreamPartID } from '@streamr/protocol'
import { toEthereumAddress, waitForEvent } from '@streamr/utils'

import { createNetworkNode, NodeToTrackerEvent } from '../../src/composition'
import { Event as NodeEvent } from '../../src/logic/Node'

const PUBLISHER_ID = toEthereumAddress('0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')

/**
 * This test verifies that on receiving a duplicate message, it is not re-emitted to the node's subscribers.
 */
describe('subscribe and wait for the node to join the stream', () => {
    let tracker: Tracker
    let nodes: NetworkNode[]
    const stream1 = toStreamPartID(toStreamID('stream-1'), 0)
    const stream2 = toStreamPartID(toStreamID('stream-2'), 0)
    const stream3 = toStreamPartID(toStreamID('stream-3'), 0)
    const TIMEOUT = 5000

    beforeEach(async () => {
        tracker = await startTracker({
            listen: {
                hostname: '127.0.0.1',
                port: 30352
            }
        })
        const trackerInfo = tracker.getConfigRecord()

        nodes = [
            createNetworkNode({
                id: 'node-0',
                trackers: [trackerInfo],
                iceServers: [],
                webrtcDisallowPrivateAddresses: false
            }),
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
            })
        ]
        await Promise.all([nodes.map((node) => node.start())])
    }, 5000)

    afterEach(async () => {
        await Promise.allSettled([
            tracker.stop(),
            nodes.map((node) => node.stop())
        ])
    })

    test('subscribing and waiting for joining', async () => {
        const firstNodeNeighbors = await nodes[0].subscribeAndWaitForJoin(stream1, TIMEOUT)
        const firstNodeNeighborsRetry = await nodes[0].subscribeAndWaitForJoin(stream1, TIMEOUT)
        const firstNodeSecondStream = await nodes[0].subscribeAndWaitForJoin(stream2, TIMEOUT)
        expect(firstNodeNeighbors).toEqual(0)
        expect(firstNodeNeighborsRetry).toEqual(0)
        expect(firstNodeSecondStream).toBeGreaterThanOrEqual(0)

        const secondNodeNeighbors = await nodes[1].subscribeAndWaitForJoin(stream1, TIMEOUT)
        const thirdNodeNeighbors = await nodes[2].subscribeAndWaitForJoin(stream1, TIMEOUT)
        const fourthNodeNeighbors = await nodes[3].subscribeAndWaitForJoin(stream1, TIMEOUT)
        const fifthNodeNeighbors = await nodes[4].subscribeAndWaitForJoin(stream1, TIMEOUT)
        expect(secondNodeNeighbors).toEqual(1)
        expect(thirdNodeNeighbors).toEqual(2)
        expect(fourthNodeNeighbors).toEqual(3)
        expect(fifthNodeNeighbors).toEqual(4)

        await Promise.all([
            waitForEvent(nodes[0], NodeEvent.NODE_UNSUBSCRIBED),
            nodes[1].unsubscribe(stream1)
        ])

        const resubscribeNeighbors = await nodes[1].subscribeAndWaitForJoin(stream1, TIMEOUT)
        expect(resubscribeNeighbors).toEqual(4)
    })

    test('wait for join and publish', async () => {
        const msg = new StreamMessage({
            messageId: new MessageID(toStreamID('stream-2'), 0, 0, 0, PUBLISHER_ID, 'msgChainId'),
            prevMsgRef: null,
            content: {
                foo: 'bar'
            },
            signature: 'signature'
        })
        const firstNeighbors = await nodes[0].subscribeAndWaitForJoin(stream2, TIMEOUT)
        const result = await Promise.all([
            waitForEvent(nodes[0], NodeEvent.MESSAGE_RECEIVED),
            nodes[1].waitForJoinAndPublish(msg, TIMEOUT)
        ])
        expect(firstNeighbors).toBeGreaterThanOrEqual(0)
        expect(result[1]).toEqual(1)
    })

    test('Simultaneous joins return valid neighbor counts (depends on tracker debouncing)', async () => {
        const ret = await Promise.all([
            nodes[0].subscribeAndWaitForJoin(stream3, TIMEOUT),
            nodes[1].subscribeAndWaitForJoin(stream3, TIMEOUT),
            nodes[2].subscribeAndWaitForJoin(stream3, TIMEOUT),
            nodes[3].subscribeAndWaitForJoin(stream3, TIMEOUT),
            nodes[4].subscribeAndWaitForJoin(stream3, TIMEOUT)
        ])
        ret.map((numOfNeighbors) => {
            expect(numOfNeighbors).toEqual(4)
        })
    })

    test('fail: timeout', async () => {
        const invalidNode = createNetworkNode({
            id: 'node-0',
            trackers: [{
                id: 'mock-id',
                http: '',
                ws: ''
            }],
            iceServers: [],
            webrtcDisallowPrivateAddresses: false
        })
        invalidNode.start()
        await expect(() => invalidNode.subscribeAndWaitForJoin(stream1, 1000)).rejects.toThrow('timed out')
        await invalidNode.stop()
    })

    test('fail: unable to handle instruction', async () => {
        const connectNode = createNetworkNode({
            id: 'node-0',
            trackers: [tracker.getConfigRecord()],
            iceServers: [],
            webrtcDisallowPrivateAddresses: false,
            newWebrtcConnectionTimeout: 500
        })
        connectNode.start()
        const targetNode = createNetworkNode({
            id: 'target',
            trackers: [tracker.getConfigRecord()],
            iceServers: [],
            webrtcDisallowPrivateAddresses: false,
        })
        targetNode.start()
        await targetNode.subscribeAndWaitForJoin(stream1, TIMEOUT)
        // @ts-expect-error private
        connectNode.trackerManager.nodeToTracker.once(NodeToTrackerEvent.TRACKER_INSTRUCTION_RECEIVED, () => {
            setImmediate(() => {
                targetNode.stop()
            })
        })
        // eslint-disable-next-line max-len
        await expect(() => connectNode.subscribeAndWaitForJoin(stream1, TIMEOUT)).rejects.toThrow('Failed initial join operation to stream partition stream-1#0, failed to form connections to all target neighbors')
        await connectNode.stop()
    })
})
