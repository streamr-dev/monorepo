import { createMockConnectionDhtNode, createMockPeerDescriptor } from '../utils/utils'
import { DhtNode } from '../../src/dht/DhtNode'
import { Simulator } from '../../src/connection/simulator/Simulator'
import { PeerID } from '../../src/helpers/PeerID'
import { Any } from '../../src/proto/google/protobuf/any'
import { PeerDescriptor } from '../../src/proto/packages/dht/protos/DhtRpc'
import { areEqualPeerDescriptors } from '../../src/helpers/peerIdFromPeerDescriptor'
import { waitForCondition } from '@streamr/utils'

describe('Storing data in DHT with two peers', () => {

    let entryPoint: DhtNode
    let otherNode: DhtNode

    let simulator: Simulator | undefined

    beforeEach(async () => {
        simulator = new Simulator()
        const entryPointId = 'node0'
        const otherNodeId = 'other-node'
        entryPoint = await createMockConnectionDhtNode(
            entryPointId,
            simulator,
        )
        otherNode = await createMockConnectionDhtNode(
            otherNodeId,
            simulator
        )

        await entryPoint.start()
        await otherNode.start()

        await entryPoint.joinDht([entryPoint.getLocalPeerDescriptor()])
        await otherNode.joinDht([entryPoint.getLocalPeerDescriptor()])
    })

    afterEach(async () => {
        await entryPoint.stop()
        await otherNode.stop()
        simulator?.stop()
    })

    it('Node can store on two peer DHT', async () => {
        const storedData1 = createMockPeerDescriptor()
        const storedData2 = createMockPeerDescriptor()
        const dataKey1 = PeerID.fromString('node0-stored-data')
        const dataKey2 = PeerID.fromString('other-node-stored-data')
        const data1 = Any.pack(storedData1, PeerDescriptor)
        const data2 = Any.pack(storedData2, PeerDescriptor)

        const successfulStorers1 = await otherNode.storeDataToDht(dataKey1.value, data1)
        const successfulStorers2 = await entryPoint.storeDataToDht(dataKey2.value, data2)
        expect(successfulStorers1[0].kademliaId).toStrictEqual(entryPoint.getLocalPeerDescriptor().kademliaId)
        expect(successfulStorers2[0].kademliaId).toStrictEqual(otherNode.getLocalPeerDescriptor().kademliaId)

        const foundData1 = await otherNode.getDataFromDht(dataKey1.value)
        const foundData2 = await entryPoint.getDataFromDht(dataKey2.value)
        expect(areEqualPeerDescriptors(storedData1, Any.unpack(foundData1[0]!.data!, PeerDescriptor))).toBeTrue()
        expect(areEqualPeerDescriptors(storedData2, Any.unpack(foundData2[0]!.data!, PeerDescriptor))).toBeTrue()
    })

    it('Can store on one peer DHT', async () => {
        await otherNode.stop()
        await waitForCondition(() => entryPoint.getBucketSize() === 0)
        const dataKey = PeerID.fromString('data-to-store')
        const storedData = createMockPeerDescriptor()
        const data = Any.pack(storedData, PeerDescriptor)
        const successfulStorers = await entryPoint.storeDataToDht(dataKey.value, data)
        expect(successfulStorers[0].kademliaId).toStrictEqual(entryPoint.getLocalPeerDescriptor().kademliaId)

        const foundData = await entryPoint.getDataFromDht(dataKey.value)
        expect(areEqualPeerDescriptors(storedData, Any.unpack(foundData[0]!.data!, PeerDescriptor))).toBeTrue()
    }, 60000)
})
