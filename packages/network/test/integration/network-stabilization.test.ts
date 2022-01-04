import { Tracker } from '../../src/logic/tracker/Tracker'
import { NetworkNode } from '../../src/logic/node/NetworkNode'
import assert from 'assert'

import { wait } from 'streamr-test-utils'

import { createNetworkNode, startTracker } from '../../src/composition'
import { getTopology } from '../../src/logic/tracker/trackerSummaryUtils'
import { SPID } from 'streamr-client-protocol'

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
            node.subscribe(new SPID('stream', 0))
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
        return new Promise(async (resolve, reject) => {
            for (let i = 0; i < 10; ++i) {
                const beforeTopology = getTopology(tracker.getOverlayPerStream(), tracker.getOverlayConnectionRtts())
                // eslint-disable-next-line no-await-in-loop
                await wait(800)
                const afterTopology = getTopology(tracker.getOverlayPerStream(), tracker.getOverlayConnectionRtts())
                if (areEqual(beforeTopology, afterTopology)) {
                    resolve(true)
                    return
                }
            }
            reject(new Error('did not stabilize'))
        })
    }, 11000)
})
