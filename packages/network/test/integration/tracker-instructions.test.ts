import { Tracker } from '../../src/logic/Tracker'
import { NetworkNode } from '../../src/NetworkNode'
import { waitForCondition, waitForEvent } from 'streamr-test-utils'
import { TrackerLayer } from 'streamr-client-protocol'

import { createNetworkNode, startTracker } from '../../src/composition'
import { Event as TrackerServerEvent } from '../../src/protocol/TrackerServer'
import { Event as NodeEvent } from '../../src/logic/Node'
import { StreamIdAndPartition } from '../../src/identifiers'
import { getTopology } from '../../src/logic/trackerSummaryUtils'

describe('check tracker, nodes and statuses from nodes', () => {
    let tracker: Tracker
    const trackerPort = 32900

    let node1: NetworkNode
    let node2: NetworkNode

    const s1 = new StreamIdAndPartition('stream-1', 0)

    beforeEach(async () => {
        tracker = await startTracker({
            host: '127.0.0.1',
            port: trackerPort,
            id: 'tracker'
        })
        const trackerInfo = { id: 'tracker', ws: tracker.getUrl(), http: tracker.getUrl() }

        // @ts-expect-error private method
        tracker.formAndSendInstructions = () => {}
        node1 = createNetworkNode({
            id: 'node1',
            trackers: [trackerInfo],
            disconnectionWaitTime: 200
        })
        node2 = createNetworkNode({
            id: 'node2',
            trackers: [trackerInfo],
            disconnectionWaitTime: 200
        })

        node1.subscribeToStreamIfHaveNotYet(s1)
        node2.subscribeToStreamIfHaveNotYet(s1)

        node1.start()
        node2.start()

        await Promise.all([
            // @ts-expect-error private variable
            waitForEvent(tracker.trackerServer, TrackerServerEvent.NODE_STATUS_RECEIVED),
            // @ts-expect-error private variable
            waitForEvent(tracker.trackerServer, TrackerServerEvent.NODE_STATUS_RECEIVED)
        ])
    })

    afterEach(async () => {
        await node1.stop()
        await node2.stop()
        await tracker.stop()
    })

    it('if failed to follow tracker instructions, inform tracker about current status', async () => {
        const trackerInstruction1 = new TrackerLayer.InstructionMessage({
            requestId: 'requestId',
            streamId: s1.id,
            streamPartition: s1.partition,
            nodeIds: ['node2', 'unknown'],
            counter: 0
        })

        const trackerInstruction2 = new TrackerLayer.InstructionMessage({
            requestId: 'requestId',
            streamId: s1.id,
            streamPartition: s1.partition,
            nodeIds: ['node1', 'unknown'],
            counter: 0
        })

        await Promise.race([
            // @ts-expect-error private field
            node1.trackerManager.instructionThrottler.add(trackerInstruction1, 'tracker'),
            // @ts-expect-error private field
            node2.trackerManager.instructionThrottler.add(trackerInstruction2, 'tracker')
        ]).catch(() => {})

        await Promise.race([
            waitForEvent(node1, NodeEvent.NODE_SUBSCRIBED),
            waitForEvent(node2, NodeEvent.NODE_SUBSCRIBED)
        ])

        await Promise.all([
            // @ts-expect-error private variable
            waitForEvent(tracker.trackerServer, TrackerServerEvent.NODE_STATUS_RECEIVED),
            // @ts-expect-error private variable
            waitForEvent(tracker.trackerServer, TrackerServerEvent.NODE_STATUS_RECEIVED)
        ])

        await waitForCondition(() => node1.getNeighbors().length > 0)
        await waitForCondition(() => node2.getNeighbors().length > 0)

        expect(getTopology(tracker.getOverlayPerStream(), tracker.getOverlayConnectionRtts())).toEqual({
            'stream-1::0': {
                node1: [{neighborId: 'node2', rtt: null}],
                node2: [{neighborId: 'node1', rtt: null}],
            }
        })

        expect(node1.getNeighbors()).toEqual(['node2'])
        expect(node2.getNeighbors()).toEqual(['node1'])
    })
})
