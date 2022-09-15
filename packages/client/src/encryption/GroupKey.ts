import crypto from 'crypto'
import { EncryptedGroupKey } from 'streamr-client-protocol'
import { uuid } from '../utils/uuid'
import { inspect } from '../utils/log'
import { EncryptionUtil } from './EncryptionUtil'

export type GroupKeyId = string
export type GroupKeyish = GroupKey | GroupKeyObject | ConstructorParameters<typeof GroupKey>

export interface GroupKeyObject {
    id: string
    hex: string
    data: Uint8Array
}

interface GroupKeyProps {
    groupKeyId: GroupKeyId
    groupKeyHex: string
    groupKeyData: Uint8Array
}

export class GroupKeyError extends Error {
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    constructor(message: string, public groupKey?: GroupKeyish) {
        super(message)
    }
}

function GroupKeyObjectFromProps(data: GroupKeyProps | GroupKeyObject): GroupKeyObject {
    if ('groupKeyId' in data) {
        return {
            id: data.groupKeyId,
            hex: data.groupKeyHex,
            data: data.groupKeyData,
        }
    }

    return data
}

/**
 * GroupKeys are AES cipher keys, which are used to encrypt/decrypt StreamMessages (when encryptionType is AES).
 * Each group key contains 256 random bits of key data and an UUID.
 *
 * A group key stores the same key data in two fields: the bytes as hex-encoded string, and as a raw Uint8Array.
 * TODO: If this data duplication doesn't give us any performance improvement we could store the key data only
 * in one field.
 */

export class GroupKey {

    /** @internal */
    readonly id: GroupKeyId
    /** @internal */
    readonly hex: string
    /** @internal */
    readonly data: Uint8Array

    constructor(groupKeyId: GroupKeyId, groupKeyBufferOrHexString: Uint8Array | string) {
        this.id = groupKeyId
        if (!groupKeyId) {
            throw new GroupKeyError(`groupKeyId must not be falsey ${inspect(groupKeyId)}`)
        }

        if (!groupKeyBufferOrHexString) {
            throw new GroupKeyError(`groupKeyBufferOrHexString must not be falsey ${inspect(groupKeyBufferOrHexString)}`)
        }

        if (typeof groupKeyBufferOrHexString === 'string') {
            this.hex = groupKeyBufferOrHexString
            this.data = Buffer.from(this.hex, 'hex')
        } else {
            this.data = groupKeyBufferOrHexString
            this.hex = Buffer.from(this.data).toString('hex')
        }

        GroupKey.validate(this)
    }

    private static validate(maybeGroupKey: GroupKey): void | never {
        if (!maybeGroupKey) {
            throw new GroupKeyError(`value must be a ${this.name}: ${inspect(maybeGroupKey)}`, maybeGroupKey)
        }

        if (!(maybeGroupKey instanceof this)) {
            throw new GroupKeyError(`value must be a ${this.name}: ${inspect(maybeGroupKey)}`, maybeGroupKey)
        }

        if (!maybeGroupKey.id || typeof maybeGroupKey.id !== 'string') {
            throw new GroupKeyError(`${this.name} id must be a string: ${inspect(maybeGroupKey)}`, maybeGroupKey)
        }

        if (maybeGroupKey.id.includes('---BEGIN')) {
            throw new GroupKeyError(
                `${this.name} public/private key is not a valid group key id: ${inspect(maybeGroupKey)}`,
                maybeGroupKey
            )
        }

        if (!maybeGroupKey.data || !Buffer.isBuffer(maybeGroupKey.data)) {
            throw new GroupKeyError(`${this.name} data must be a Buffer: ${inspect(maybeGroupKey)}`, maybeGroupKey)
        }

        if (!maybeGroupKey.hex || typeof maybeGroupKey.hex !== 'string') {
            throw new GroupKeyError(`${this.name} hex must be a string: ${inspect(maybeGroupKey)}`, maybeGroupKey)
        }

        if (maybeGroupKey.data.length !== 32) {
            throw new GroupKeyError(`Group key must have a size of 256 bits, not ${maybeGroupKey.data.length * 8}`, maybeGroupKey)
        }
    }

    equals(other: GroupKey): boolean {
        if (!(other instanceof GroupKey)) {
            return false
        }

        return this === other || (this.hex === other.hex && this.id === other.id)
    }

    toString(): string {
        return this.id
    }

    toArray(): string[] {
        return [this.id, this.hex]
    }

    serialize(): string {
        return JSON.stringify(this.toArray())
    }

    static generate(id = uuid('GroupKey')): GroupKey {
        const keyBytes = crypto.randomBytes(32)
        return new GroupKey(id, keyBytes)
    }

    static from(maybeGroupKey: GroupKeyish): GroupKey {
        if (!maybeGroupKey || typeof maybeGroupKey !== 'object') {
            throw new GroupKeyError('Group key must be object', maybeGroupKey)
        }

        if (maybeGroupKey instanceof GroupKey) {
            return maybeGroupKey
        }

        try {
            if (Array.isArray(maybeGroupKey)) {
                return new GroupKey(maybeGroupKey[0], maybeGroupKey[1])
            }

            const groupKeyObj = GroupKeyObjectFromProps(maybeGroupKey)
            return new GroupKey(groupKeyObj.id, groupKeyObj.hex || groupKeyObj.data)
        } catch (err) {
            if (err instanceof GroupKeyError) {
                // wrap err with logging of original object
                throw new GroupKeyError(`${err.stack}:`, maybeGroupKey)
            }
            throw err
        }
    }

    encryptNextGroupKey(nextGroupKey: GroupKey): EncryptedGroupKey {
        return new EncryptedGroupKey(nextGroupKey.id, EncryptionUtil.encryptWithAES(nextGroupKey.data, this.data))
    }

    decryptNextGroupKey(nextGroupKey: EncryptedGroupKey): GroupKey {
        return new GroupKey(
            nextGroupKey.groupKeyId,
            EncryptionUtil.decryptWithAES(nextGroupKey.encryptedGroupKeyHex, this.data)
        )
    }

    static decryptRSAEncrypted(encryptedKey: EncryptedGroupKey, rsaPrivateKey: string): GroupKey {
        return new GroupKey(
            encryptedKey.groupKeyId,
            EncryptionUtil.decryptWithRSAPrivateKey(encryptedKey.encryptedGroupKeyHex, rsaPrivateKey, true)
        )
    }
}
