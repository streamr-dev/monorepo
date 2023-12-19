import { createMockConnectionDhtNode } from '../utils/utils'
import { DhtNode } from '../../src/dht/DhtNode'
import { Simulator } from '../../src/connection/simulator/Simulator'
import { createMockDataEntry, expectEqualData } from '../utils/mock/mockDataEntry'

describe('Storing data in DHT with two peers', () => {

    let entryPoint: DhtNode
    let node1: DhtNode
    let node2: DhtNode
    let simulator: Simulator | undefined

    beforeEach(async () => {
        simulator = new Simulator()
        entryPoint = await createMockConnectionDhtNode(simulator)
        node1 = await createMockConnectionDhtNode(simulator)
        node2 = await createMockConnectionDhtNode(simulator)

        await entryPoint.start()
        await node1.start()
        await node2.start()

        await entryPoint.joinDht([entryPoint.getLocalPeerDescriptor()])
        node1.joinDht([entryPoint.getLocalPeerDescriptor()]).catch(() => {})
        node2.joinDht([entryPoint.getLocalPeerDescriptor()]).catch(() => {})
        await Promise.all([
            node1.waitForNetworkConnectivity(),
            node2.waitForNetworkConnectivity()
        ])
    })

    afterEach(async () => {
        await entryPoint.stop()
        await node1.stop()
        await node2.stop()
        simulator?.stop()
    })

    it('Node can store on three peer DHT', async () => {
        const storedData1 = createMockDataEntry()
        const storedData2 = createMockDataEntry()
        await node1.getDataFromDht(storedData1.key)
        await node2.getDataFromDht(storedData1.key)
        await node1.storeDataToDht(storedData1.key, storedData1.data!)
        await node2.storeDataToDht(storedData1.key, storedData1.data!)
        await entryPoint.storeDataToDht(storedData2.key, storedData2.data!)
        const foundData1 = await node1.getDataFromDht(storedData1.key)
        const foundData2 = await node2.getDataFromDht(storedData1.key)
        const foundData3 = await entryPoint.getDataFromDht(storedData2.key)
        expectEqualData(foundData1[0], storedData1)
        expectEqualData(foundData1[1], storedData1)
        expectEqualData(foundData2[0], storedData1)
        expectEqualData(foundData2[1], storedData1)
        expectEqualData(foundData3[0], storedData2)
    }, 30000)
})