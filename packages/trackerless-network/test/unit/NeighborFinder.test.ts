import { NeighborFinder } from '../../src/logic/neighbor-discovery/NeighborFinder'
import { NodeList } from '../../src/logic/NodeList'
import { PeerID } from '@streamr/dht'
import { waitForCondition } from '@streamr/utils'
import { range } from 'lodash'
import { expect } from 'expect'
import { createMockRemoteNode } from '../utils/utils'
import { NodeID, getNodeIdFromPeerDescriptor } from '../../src/identifiers'

describe('NeighborFinder', () => {

    const peerId = PeerID.fromString('NeighborFinder')
    let targetNeighbors: NodeList
    let nearbyNodeView: NodeList
    let neighborFinder: NeighborFinder

    const N = 4

    beforeEach(() => {
        targetNeighbors = new NodeList(peerId, 15)
        nearbyNodeView = new NodeList(peerId, 30)
        range(30).forEach(() => nearbyNodeView.add(createMockRemoteNode()))
        const mockDoFindNeighbors = async (excluded: NodeID[]) => {
            const target = nearbyNodeView.getRandom(excluded)
            if (Math.random() < 0.5) {
                targetNeighbors.add(target!)
            } else {
                excluded.push(getNodeIdFromPeerDescriptor(target!.getPeerDescriptor()))
            }
            return excluded
        }
        neighborFinder = new NeighborFinder({
            targetNeighbors,
            nearbyNodeView,
            doFindNeighbors: (excluded) => mockDoFindNeighbors(excluded),
            N
        })
    })

    afterEach(() => {
        neighborFinder.stop()
    })

    it('Finds target number of nodes', async () => {
        neighborFinder.start()
        await waitForCondition(() => targetNeighbors.size() >= N, 10000)
        expect(neighborFinder.isRunning()).toEqual(false)
    })
})
