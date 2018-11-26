const { startClient, startNode, startTracker } = require('../../src/composition')
const { callbackToPromise } = require('../../src/util')
const { waitForEvent, LOCALHOST, DEFAULT_TIMEOUT } = require('../util')
const TrackerNode = require('../../src/protocol/TrackerNode')
const TrackerServer = require('../../src/protocol/TrackerServer')
const NodeToNode = require('../../src/protocol/NodeToNode')

jest.setTimeout(DEFAULT_TIMEOUT)

describe('Selecting leader for the stream and sending messages to two subscribers', () => {
    let tracker
    let nodeOne
    let nodeTwo
    let publisher
    let subscriber1
    let subscriber2

    const streamId = 'stream-2018'

    it('should be select leader and get two active subscribers', async (done) => {
        tracker = await startTracker(LOCALHOST, 32300, 'tracker')

        await Promise.all([
            startNode(LOCALHOST, 32312, 'node-1'),
            startNode(LOCALHOST, 32313, 'node-2')
        ]).then((res) => {
            [nodeOne, nodeTwo] = res
            nodeOne.setBootstrapTrackers([tracker.getAddress()])
            nodeTwo.setBootstrapTrackers([tracker.getAddress()])
        })

        publisher = await startClient(LOCALHOST, 32301, 'publisher-1', nodeOne.protocols.nodeToNode.getAddress())

        await Promise.all([
            startClient(LOCALHOST, 32302, 'subscriber-1', nodeTwo.protocols.nodeToNode.getAddress()),
            startClient(LOCALHOST, 32303, 'subscriber-2', nodeTwo.protocols.nodeToNode.getAddress())
        ]).then((res) => {
            [subscriber1, subscriber2] = res
        })

        await Promise.all([
            waitForEvent(nodeOne.protocols.nodeToNode, NodeToNode.events.NODE_CONNECTED),
            waitForEvent(nodeTwo.protocols.nodeToNode, NodeToNode.events.NODE_CONNECTED)
        ])

        let msgNo = 0
        const publisherInterval = setInterval(() => {
            msgNo += 1
            publisher.publish(streamId, `Hello world ${msgNo}!`, msgNo, msgNo - 1)
        }, 1000)

        await waitForEvent(nodeOne.protocols.nodeToNode, NodeToNode.events.DATA_RECEIVED)
        await waitForEvent(tracker.protocols.trackerServer, TrackerServer.events.STREAM_INFO_REQUESTED)
        await waitForEvent(nodeOne.protocols.trackerNode, TrackerNode.events.STREAM_ASSIGNED)

        subscriber1.subscribe(streamId)
        subscriber2.subscribe(streamId)

        await Promise.all([
            waitForEvent(subscriber1.protocols.nodeToNode, NodeToNode.events.DATA_RECEIVED),
            waitForEvent(subscriber2.protocols.nodeToNode, NodeToNode.events.DATA_RECEIVED)
        ]).then(() => {
            expect(nodeTwo.subscribers.subscribersForStream(streamId).length).toEqual(2)
            clearInterval(publisherInterval)

            done()
        })
    })

    // TODO test disconnect and more than one stream
    afterAll(async () => {
        await callbackToPromise(publisher.stop.bind(publisher))
        await callbackToPromise(nodeOne.stop.bind(nodeOne))
        await callbackToPromise(nodeTwo.stop.bind(nodeTwo))
        await callbackToPromise(subscriber1.stop.bind(subscriber1))
        await callbackToPromise(subscriber2.stop.bind(subscriber2))
        await callbackToPromise(tracker.stop.bind(tracker))
    })
})
