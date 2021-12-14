import { runAndWaitForEvents, runAndRaceEvents, waitForEvent } from 'streamr-test-utils'

import { Tracker } from '../../src/logic/tracker/Tracker'
import { NetworkNode } from '../../src/logic/node/NetworkNode'
import { createNetworkNode, startTracker } from '../../src/composition'
import { Event as NodeEvent } from '../../src/logic/node/Node'
import { Event as NodeToTrackerEvent } from '../../src/protocol/NodeToTracker'

/**
 * Tests for error scenarios during signalling
 */
describe('Signalling error scenarios', () => {
    let tracker: Tracker
    let nodeOne: NetworkNode
    let nodeTwo: NetworkNode
    const streamId = 'stream-1'

    beforeEach(async () => {
        tracker = await startTracker({
            listen: {
                hostname: '127.0.0.1',
                port: 35115
            },
            trackerPingInterval: 3000
        })
        const trackerInfo = tracker.getConfigRecord()

        nodeOne = createNetworkNode({
            id: 'node-1',
            trackers: [trackerInfo],
            disconnectionWaitTime: 4000,
            newWebrtcConnectionTimeout: 8000,
            trackerPingInterval: 3000
        })
        nodeTwo = createNetworkNode({
            id: 'node-2',
            trackers: [trackerInfo],
            disconnectionWaitTime: 4000,
            newWebrtcConnectionTimeout: 8000,
            trackerPingInterval: 3000
        })

        nodeOne.start()
        nodeTwo.start()
    })

    afterEach(async () => {
        await Promise.all([
            tracker.stop(),
            nodeOne.stop(),
            nodeTwo.stop()
        ])
    })

    it('connection recovers after timeout if one endpoint closes during signalling', async () => {
        await runAndWaitForEvents([ ()=> { nodeOne.subscribe(streamId, 0) }, () => { nodeTwo.subscribe(streamId, 0) } ],
            // @ts-expect-error private field
            [nodeTwo.trackerManager.nodeToTracker, NodeToTrackerEvent.RELAY_MESSAGE_RECEIVED]
        )

        // @ts-expect-error private field
        nodeTwo.nodeToNode.endpoint.connections['node-1'].logger.debug('closing via test...')
        
        // @ts-expect-error private field
        await runAndWaitForEvents( ()=> { nodeTwo.nodeToNode.endpoint.connections['node-1'].close() }, [
            nodeTwo, NodeEvent.NODE_CONNECTED], 30000
        )
        
        // @ts-expect-error private field
        expect(Object.keys(nodeTwo.nodeToNode.endpoint.connections)).toEqual(['node-1'])
    }, 60000)

    it('connection recovers after timeout if both endpoints close during signalling', async () => {
        
        await runAndWaitForEvents([ () => { nodeOne.subscribe(streamId, 0)}, () => { nodeTwo.subscribe(streamId, 0) } ], [
            // @ts-expect-error private field
            [ nodeTwo.trackerManager.nodeToTracker, NodeToTrackerEvent.RELAY_MESSAGE_RECEIVED],
            // @ts-expect-error private field
            [nodeOne.trackerManager.nodeToTracker, NodeToTrackerEvent.RELAY_MESSAGE_RECEIVED]
        ])

        await runAndWaitForEvents([
            // @ts-expect-error private field    
            () => { nodeTwo.nodeToNode.endpoint.connections['node-1'].close() }, 
            // @ts-expect-error private field
            () => { nodeOne.nodeToNode.endpoint.connections['node-2'].close() }], [
            [ nodeOne, NodeEvent.NODE_DISCONNECTED ],
            [ nodeTwo, NodeEvent.NODE_DISCONNECTED ],
            [ nodeOne, NodeEvent.NODE_CONNECTED ],
            [ nodeTwo, NodeEvent.NODE_CONNECTED ]
        ], 10000)

        // @ts-expect-error private field
        expect(Object.keys(nodeOne.nodeToNode.endpoint.connections)).toEqual(['node-2'])
        // @ts-expect-error private field
        expect(Object.keys(nodeTwo.nodeToNode.endpoint.connections)).toEqual(['node-1'])
    }, 20000)

    it('nodes recover if both signaller connections fail during signalling', async () => {
        Promise.all([waitForEvent(nodeOne, NodeEvent.NODE_CONNECTED),
            waitForEvent(nodeTwo, NodeEvent.NODE_CONNECTED)
        ]).then(async () => {
            // @ts-expect-error private field
            expect(Object.keys(nodeOne.nodeToNode.endpoint.connections)).toEqual(['node-2'])
            // @ts-expect-error private field
            expect(Object.keys(nodeTwo.nodeToNode.endpoint.connections)).toEqual(['node-1'])
            return
        }).catch(async () => {
            expect(false)
            return
        }) 

        await runAndWaitForEvents([ () => { nodeOne.subscribe('stream-id', 0) }, () => { nodeTwo.subscribe('stream-id', 0) }] , [
            // @ts-expect-error private field
            [nodeOne.trackerManager.nodeToTracker, NodeToTrackerEvent.RELAY_MESSAGE_RECEIVED],
            // @ts-expect-error private field
            [nodeTwo.trackerManager.nodeToTracker, NodeToTrackerEvent.RELAY_MESSAGE_RECEIVED]
        ])

        await runAndWaitForEvents([ 
            // @ts-expect-error private field
            () => { nodeOne.trackerManager.nodeToTracker.endpoint.close(tracker.getTrackerId()) },
            // @ts-expect-error private field
            () => { nodeTwo.trackerManager.nodeToTracker.endpoint.close(tracker.getTrackerId()) }], [
            // @ts-expect-error private field
            [ nodeOne.trackerManager.nodeToTracker, NodeToTrackerEvent.TRACKER_DISCONNECTED ],
            // @ts-expect-error private field
            [ nodeTwo.trackerManager.nodeToTracker, NodeToTrackerEvent.TRACKER_DISCONNECTED ],
            // @ts-expect-error private field
            [ nodeOne.trackerManager.nodeToTracker, NodeToTrackerEvent.CONNECTED_TO_TRACKER ],
            // @ts-expect-error private field
            [ nodeTwo.trackerManager.nodeToTracker, NodeToTrackerEvent.CONNECTED_TO_TRACKER ],
        ], 15000)
    }, 20000)

    it('nodes recover if one signaller connection fails during signalling', async () => {

        await runAndRaceEvents([
            () => { nodeOne.subscribe('stream-id', 0) },
            () => { nodeTwo.subscribe('stream-id', 0) } ], [
            // @ts-expect-error private field
            [ nodeOne.trackerManager.nodeToTracker, NodeToTrackerEvent.RELAY_MESSAGE_RECEIVED ],
            // @ts-expect-error private field
            [ nodeTwo.trackerManager.nodeToTracker, NodeToTrackerEvent.RELAY_MESSAGE_RECEIVED ]
        ], 9997)

        // @ts-expect-error private field
        await runAndWaitForEvents( () => {  nodeOne.trackerManager.nodeToTracker.endpoint.close(tracker.getTrackerId()) }, [
            // @ts-expect-error private field
            [nodeOne.trackerManager.nodeToTracker, NodeToTrackerEvent.TRACKER_DISCONNECTED ],
            // @ts-expect-error private field
            [nodeOne.trackerManager.nodeToTracker, NodeToTrackerEvent.CONNECTED_TO_TRACKER],
            [nodeOne, NodeEvent.NODE_CONNECTED, 15000],
            [nodeTwo, NodeEvent.NODE_CONNECTED, 15000]
        ], 20000)
        // @ts-expect-error private field
        expect(Object.keys(nodeOne.nodeToNode.endpoint.connections)).toEqual(['node-2'])
        // @ts-expect-error private field
        expect(Object.keys(nodeTwo.nodeToNode.endpoint.connections)).toEqual(['node-1'])
    }, 30000)
})
