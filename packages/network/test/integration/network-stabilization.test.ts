import { Tracker, startTracker, getTopology } from '@streamr/network-tracker'
import { NetworkNode } from '../../src/logic/NetworkNode'
import assert from 'assert'

import { wait } from '@streamr/utils'

import { createNetworkNode } from '../../src/createNetworkNode'
import { StreamPartIDUtils } from '@streamr/protocol'

function areEqual(a: any, b: any) {
    try {
        assert.deepStrictEqual(a, b)
    } catch (error) {
        if (error.code === 'ERR_ASSERTION') {
            return false
        }
        throw error
    }
    return true
}

describe('check network stabilization', () => {
    let tracker: Tracker
    let nodes: NetworkNode[]
    const MAX_NODES = 10

    beforeEach(async () => {
        tracker = await startTracker({
            listen: {
                hostname: '127.0.0.1',
                port: 39000
            }
        })
        const trackerInfo = tracker.getConfigRecord()

        nodes = []
        for (let i = 0; i < MAX_NODES; i++) {
            // eslint-disable-next-line no-await-in-loop
            const node = createNetworkNode({
                id: `node-${i}`,
                trackers: [trackerInfo]
            })
            node.subscribe(StreamPartIDUtils.parse('stream#0'))
            nodes.push(node)
        }
        nodes.forEach((node) => node.start())
    })

    afterEach(async () => {
        await Promise.allSettled([
            tracker.stop(),
            ...nodes.map((node) => node.stop())
        ])
    })

    it('network must become stable in less than 10 seconds',  async () => {
        for (let i = 0; i < 10; ++i) {
            const beforeTopology = getTopology(tracker.getOverlayPerStreamPart(), tracker.getOverlayConnectionRtts())
            // eslint-disable-next-line no-await-in-loop
            await wait(800)
            const afterTopology = getTopology(tracker.getOverlayPerStreamPart(), tracker.getOverlayConnectionRtts())
            if (areEqual(beforeTopology, afterTopology)) {
                return
            }
        }
        fail('did not stabilize')
    }, 11000)
})
