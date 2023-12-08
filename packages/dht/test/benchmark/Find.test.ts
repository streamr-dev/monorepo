/* eslint-disable no-console */
import { LatencyType, Simulator } from '../../src/connection/simulator/Simulator'
import { DhtNode } from '../../src/dht/DhtNode'
import { NodeType, RecursiveOperation } from '../../src/proto/packages/dht/protos/DhtRpc'
import { createMockConnectionDhtNode } from '../utils/utils'
import { execSync } from 'child_process'
import fs from 'fs'
import { PeerID } from '../../src/helpers/PeerID'
import { getNodeIdFromPeerDescriptor, peerIdFromPeerDescriptor } from '../../src/helpers/peerIdFromPeerDescriptor'
import { Logger, hexToBinary, wait } from '@streamr/utils'
import { debugVars } from '../../src/helpers/debugHelpers'

const logger = new Logger(module)

describe('Find correctness', () => {
    let entryPoint: DhtNode
    let nodes: DhtNode[]
    const simulator = new Simulator(LatencyType.NONE)
    const NUM_NODES = 1000

    if (!fs.existsSync('test/data/nodeids.json')) {
        console.log('ground truth data does not exist yet, generating..')
        execSync('npm run prepare-kademlia-simulation')
    }

    const dhtIds: Array<{ type: string, data: Array<number> }> = JSON.parse(fs.readFileSync('test/data/nodeids.json').toString())

    beforeEach(async () => {

        nodes = []
        const entryPointId = '0'
        entryPoint = await createMockConnectionDhtNode(entryPointId, simulator, Uint8Array.from(dhtIds[0].data), undefined)
        nodes.push(entryPoint)
        entrypointDescriptor = {
            nodeId: hexToBinary(entryPoint.getNodeId()),
            type: NodeType.NODEJS
        }

        for (let i = 1; i < NUM_NODES; i++) {
            const nodeId = `${i}`

            const node = await createMockConnectionDhtNode(nodeId, simulator, Uint8Array.from(dhtIds[i].data), undefined)
            nodes.push(node)
        }
    })

    afterEach(async () => {
        await Promise.all([
            entryPoint.stop(),
            ...nodes.map(async (node) => await node.stop())
        ])
    })

    it('Entrypoint can find a node from the network (exact match)', async () => {
        await entryPoint.joinDht([entryPoint.getLocalPeerDescriptor()])

        await Promise.all(
            nodes.map((node) => node.joinDht([entryPoint.getLocalPeerDescriptor()]))
        )

        logger.info('waiting 120s')
        debugVars['waiting'] = true

        await wait(120000)
        debugVars['waiting'] = false
        logger.info('waiting over')

        nodes.forEach((node) => logger.info(getNodeIdFromPeerDescriptor(node.getLocalPeerDescriptor()) + ': connections:' +
            node.getNumberOfConnections() + ', kbucket: ' + node.getNumberOfNeighbors()
            + ', localLocked: ' + node.getNumberOfLocalLockedConnections()
            + ', remoteLocked: ' + node.getNumberOfRemoteLockedConnections()
            + ', weakLocked: ' + node.getNumberOfWeakLockedConnections()))

        logger.info('starting find')
        const targetId = Uint8Array.from(dhtIds[9].data)
        const results = await nodes[159].executeRecursiveOperation(targetId, RecursiveOperation.FIND_NODE)
        logger.info('find over')
        expect(results.closestNodes).toBeGreaterThanOrEqual(5)
        expect(PeerID.fromValue(targetId).equals(peerIdFromPeerDescriptor(results.closestNodes[0])))

    }, 180000)
})
