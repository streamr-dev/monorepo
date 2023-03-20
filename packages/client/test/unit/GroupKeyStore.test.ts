import { GroupKey } from '../../src/encryption/GroupKey'
import { GroupKeyStore } from '../../src/encryption/GroupKeyStore'
import { getGroupKeyStore } from '../test-utils/utils'
import { randomEthereumAddress } from '@streamr/test-utils'
import range from 'lodash/range'
import { EthereumAddress } from '@streamr/utils'
import crypto from 'crypto'
import { toStreamID } from '@streamr/protocol'

describe('GroupKeyStore', () => {
    
    let clientId: EthereumAddress
    let publisherId: EthereumAddress
    let store: GroupKeyStore
    let store2: GroupKeyStore

    beforeEach(() => {
        clientId = randomEthereumAddress()
        publisherId = randomEthereumAddress()
        store = getGroupKeyStore(clientId)
    })

    afterEach(async () => {
        await store?.stop()
        await store2?.stop()
        // @ts-expect-error doesn't want us to unassign, but it's ok
        store = undefined // eslint-disable-line require-atomic-updates
        // @ts-expect-error doesn't want us to unassign, but it's ok
        store2 = undefined // eslint-disable-line require-atomic-updates
    })

    it('can get and set', async () => {
        const groupKey = GroupKey.generate()
        expect(await store.get(groupKey.id, publisherId)).toBeUndefined()

        await store.add(groupKey, publisherId)
        expect(await store.get(groupKey.id, publisherId)).toEqual(groupKey)
    })

    it('key lookup is publisher specific', async () => {
        const groupKey = GroupKey.generate()
        await store.add(groupKey, publisherId)
        expect(await store.get(groupKey.id, publisherId)).toEqual(groupKey)
        expect(await store.get(groupKey.id, randomEthereumAddress())).toBeUndefined()
    })

    it('key stores are clientId specific', async () => {
        const clientId2 = randomEthereumAddress()
        store2 = getGroupKeyStore(clientId2)

        const groupKey = GroupKey.generate()
        await store.add(groupKey, publisherId)
        expect(await store2.get(groupKey.id, publisherId)).toBeUndefined()
        expect(await store.get(groupKey.id, publisherId)).toEqual(groupKey)
    })

    it('can read previously persisted data', async () => {
        const groupKey = GroupKey.generate()
        await store.add(groupKey, publisherId)

        const store2 = getGroupKeyStore(clientId)
        expect(await store2.get(groupKey.id, publisherId)).toEqual(groupKey)
    })

    it('add multiple keys in parallel', async () => {
        const assignments = range(10).map(() => {
            return { key: GroupKey.generate(), publisherId: randomEthereumAddress() }
        })
        await Promise.all(assignments.map(({ key, publisherId }) => store.add(key, publisherId)))
        for (const assignment of assignments) {
            expect(await store.get(assignment.key.id, assignment.publisherId)).toEqual(assignment.key)
        }
    })

    /**
     * Legacy keys refer to group keys migrated from a previous version of the client where group keys were not tied
     * to a specific publisherId, therefore any publisherId for a given legacy key id is considered a match.
     */
    it('supports "legacy" keys', async () => {
        const groupKey = GroupKey.generate()
        const internalPersistence = await store.getPersistence()
        await internalPersistence.set(`LEGACY::${groupKey.id}`, Buffer.from(groupKey.data).toString('hex'))
        expect(await store.get(groupKey.id, randomEthereumAddress())).toEqual(groupKey)
    })

    it('"normal" keys have precedence over "legacy" keys', async () => {
        const keyId = GroupKey.generate().id
        const legacyKey = new GroupKey(keyId, crypto.randomBytes(32))
        const normalKey = new GroupKey(keyId, crypto.randomBytes(32))
        const internalPersistence = await store.getPersistence()
        await internalPersistence.set(`LEGACY::${legacyKey.id}`, Buffer.from(legacyKey.data).toString('hex'))
        await internalPersistence.set(`${publisherId}::${normalKey.id}`, Buffer.from(normalKey.data).toString('hex'))

        expect(await store.get(keyId, publisherId)).toEqual(normalKey)
        expect(await store.get(keyId, randomEthereumAddress())).toEqual(legacyKey)
    })

    describe('publisherKeyId', () => {
        const streamId = toStreamID('/foobar', randomEthereumAddress())
        it('add and get key', async () => {
            await store.addPublisherKeyId('keyId', publisherId, streamId)
            expect(await store.getPublisherKeyId(publisherId, streamId)).toEqual('keyId')
            expect(await store.getPublisherKeyId(randomEthereumAddress(), streamId)).toBeUndefined()
            expect(await store.getPublisherKeyId(publisherId, toStreamID('foobar'))).toBeUndefined()
        })
    })
})
