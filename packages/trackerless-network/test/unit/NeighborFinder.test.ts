import { NeighborFinder } from '../../src/logic/neighbor-discovery/NeighborFinder'
import { NodeList } from '../../src/logic/NodeList'
import { waitForCondition } from '@streamr/utils'
import { range } from 'lodash'
import { expect } from 'expect'
import { createMockDeliveryRpcRemote, createRandomNodeId } from '../utils/utils'
import { DhtAddress, getNodeIdFromPeerDescriptor } from '@streamr/dht'

describe('NeighborFinder', () => {

    const nodeId = createRandomNodeId()
    let targetNeighbors: NodeList
    let nearbyNodeView: NodeList
    let neighborFinder: NeighborFinder

    const minCount = 4

    beforeEach(() => {
        targetNeighbors = new NodeList(nodeId, 15)
        nearbyNodeView = new NodeList(nodeId, 30)
        range(30).forEach(() => nearbyNodeView.add(createMockDeliveryRpcRemote()))
        const mockDoFindNeighbors = async (excluded: DhtAddress[]) => {
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
            minCount
        })
    })

    afterEach(() => {
        neighborFinder.stop()
    })

    it('Finds target number of nodes', async () => {
        neighborFinder.start()
        await waitForCondition(() => targetNeighbors.size() >= minCount, 10000)
        expect(neighborFinder.isRunning()).toEqual(false)
    })
})
