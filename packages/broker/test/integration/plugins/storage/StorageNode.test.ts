import { Tracker } from '@streamr/network-tracker'
import { Wallet } from 'ethers'
import {
    startStorageNode,
    startTestTracker
} from '../../../utils'
import { Broker } from "../../../../src/broker"
import { fetchPrivateKeyWithGas } from 'streamr-test-utils'
import { toEthereumAddress } from '@streamr/utils'

const trackerPort = 12503

describe('StorageNode', () => {
    let tracker: Tracker
    let storageNode: Broker
    let storageNodeAccount: Wallet

    beforeAll(async () => {
        tracker = await startTestTracker(trackerPort)
    })

    beforeAll(async () => {
        storageNodeAccount = new Wallet(await fetchPrivateKeyWithGas())
        storageNode = await startStorageNode(storageNodeAccount.privateKey, 1234, trackerPort)
    }, 30 * 1000)

    afterAll(async () => {
        await tracker?.stop()
        await storageNode?.stop()
    })

    it('has node id same as address', async () => {
        expect((await storageNode.getNode()).getNodeId()).toEqual(toEthereumAddress(storageNodeAccount.address))
    })
})
