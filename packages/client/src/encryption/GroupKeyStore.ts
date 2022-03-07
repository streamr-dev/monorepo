import { instanceId } from '../utils'
import { Context } from '../utils/Context'
import { GroupKey } from './Encryption'
import { PersistentStore } from './PersistentStore'

import ServerPersistentStore, { ServerPersistentStoreOptions } from './ServerPersistentStore'
import { StreamID } from 'streamr-client-protocol'

type GroupKeyId = string

type GroupKeyStoreOptions = {
    context: Context,
    clientId: string,
    streamId: StreamID,
    groupKeys: [GroupKeyId, GroupKey][]
}

export class GroupKeyPersistence implements PersistentStore<string, GroupKey> {
    store: PersistentStore<string, string>
    constructor(options: ServerPersistentStoreOptions) {
        this.store = new ServerPersistentStore(options)
    }

    async has(groupKeyId: string) {
        return this.store.has(groupKeyId)
    }

    async size() {
        return this.store.size()
    }

    async get(groupKeyId: string) {
        const value = await this.store.get(groupKeyId)
        if (!value) { return undefined }
        return GroupKey.from([groupKeyId, value])
    }

    async add(groupKey: GroupKey) {
        return this.set(groupKey.id, groupKey)
    }

    async set(groupKeyId: string, value: GroupKey) {
        GroupKey.validate(value)
        return this.store.set(groupKeyId, value.hex)
    }

    async delete(groupKeyId: string) {
        return this.store.delete(groupKeyId)
    }

    async clear() {
        return this.store.clear()
    }

    async destroy() {
        return this.store.destroy()
    }

    async close() {
        return this.store.close()
    }

    async exists() {
        return this.store.exists()
    }

    get [Symbol.toStringTag]() {
        return this.constructor.name
    }
}

export default class GroupKeyStore implements Context {
    readonly id
    readonly debug
    store
    currentGroupKeyId: GroupKeyId | undefined // current key id if any
    nextGroupKeys: GroupKey[] = [] // the keys to use next, disappears if not actually used. Max queue size 2

    constructor({ context, clientId, streamId, groupKeys }: GroupKeyStoreOptions) {
        this.id = instanceId(this)
        this.debug = context.debug.extend(this.id)
        const initialData = groupKeys.reduce((o, [, groupKey]) => Object.assign(o, {
            [groupKey.id]: groupKey.hex,
        }), {})
        this.store = new GroupKeyPersistence({ context: this, clientId, streamId, initialData })

        groupKeys.forEach(([groupKeyId, groupKey]) => {
            GroupKey.validate(groupKey)
            if (groupKeyId !== groupKey.id) {
                throw new Error(`Ids must match: groupKey.id: ${groupKey.id}, groupKeyId: ${groupKeyId}`)
            }
            // use last init key as current
            this.currentGroupKeyId = groupKey.id
        })
    }

    private async storeKey(groupKey: GroupKey) {
        GroupKey.validate(groupKey)
        const existingKey = await this.store.get(groupKey.id)
        if (existingKey) {
            if (!existingKey.equals(groupKey)) {
                throw new GroupKey.InvalidGroupKeyError(
                    `Trying to add groupKey ${groupKey.id} but key exists & is not equivalent to new GroupKey: ${groupKey}.`,
                    groupKey
                )
            }

            await this.store.set(groupKey.id, existingKey)
            return existingKey
        }

        await this.store.set(groupKey.id, groupKey)
        return groupKey
    }

    async has(id: GroupKeyId) {
        if (this.currentGroupKeyId === id) { return true }

        if (this.nextGroupKeys.some((nextKey) => nextKey.id === id)) { return true }

        return this.store.has(id)
    }

    async isEmpty() {
        // any pending keys means it's not empty
        if (this.nextGroupKeys.length) { return false }

        return (await this.store.size()) === 0
    }

    async useGroupKey(): Promise<[GroupKey | undefined, GroupKey | undefined]> {
        const nextGroupKey = this.nextGroupKeys.pop()
        // First use of group key on this stream, no current key. Make next key current.
        if (!this.currentGroupKeyId && nextGroupKey) {
            this.currentGroupKeyId = nextGroupKey.id
            return [
                await this.get(this.currentGroupKeyId!),
                undefined,
            ]
        }

        // Keep using current key (empty next)
        if (this.currentGroupKeyId != null && !nextGroupKey) {
            return [
                await this.get(this.currentGroupKeyId),
                undefined
            ]
        }

        // Key changed (non-empty next). return current + next. Make next key current.
        if (this.currentGroupKeyId != null && nextGroupKey != null) {
            const prevId = this.currentGroupKeyId
            this.currentGroupKeyId = nextGroupKey.id
            const prevGroupKey = await this.get(prevId)
            // use current key one more time
            return [
                prevGroupKey,
                nextGroupKey,
            ]
        }

        // Generate & use new key if none already set.
        await this.rotateGroupKey()
        return this.useGroupKey()
    }

    async get(id: GroupKeyId) {
        return this.store.get(id)
    }

    async exists() {
        return this.store.exists()
    }

    async clear() {
        this.currentGroupKeyId = undefined
        this.nextGroupKeys.length = 0

        return this.store.clear()
    }

    async rotateGroupKey() {
        return this.setNextGroupKey(GroupKey.generate())
    }

    async add(groupKey: GroupKey) {
        return this.storeKey(groupKey)
    }

    async setNextGroupKey(newKey: GroupKey) {
        GroupKey.validate(newKey)
        this.nextGroupKeys.unshift(newKey)
        this.nextGroupKeys.length = Math.min(this.nextGroupKeys.length, 2)
        await this.storeKey(newKey)
    }

    async close() {
        return this.store.close()
    }

    async rekey() {
        const newKey = GroupKey.generate()
        await this.storeKey(newKey)
        this.currentGroupKeyId = newKey.id
        this.nextGroupKeys.length = 0
    }
}
