import { NetworkNode } from '../../src/logic/NetworkNode'
import { Tracker } from '../../../network-tracker/src/logic/Tracker'

import { createNetworkNode, startTracker } from '../../src/composition'

describe('NetworkNode', () => {
    let tracker: Tracker
    let node: NetworkNode
    beforeEach(async () => {
        tracker = await startTracker({
            listen: {
                hostname: '127.0.0.1',
                port: 30410
            }
        })
        const trackerInfo = tracker.getConfigRecord()
        node = createNetworkNode({
            id: 'node-1',
            trackers: [trackerInfo]
        })
    })

    it('has id & peerInfo', () => {
        expect(node.getNodeId()).toEqual(node.peerInfo.peerId)
        expect(node.peerInfo.isNode()).toEqual(true)
        expect(node.peerInfo.isTracker()).toEqual(false)
    })

    afterEach(async () => {
        await tracker.stop()
        await node.stop()
    })
})
