import { BrandedString, binaryToHex } from '@streamr/utils'
import { UUID } from './UUID'
import { IllegalArguments } from './errors'
import crypto from 'crypto'
import { NodeID, getNodeIdFromRaw } from '../identifiers'

export type PeerIDKey = BrandedString<'PeerIDKey'>

export const createPeerIDKey = (nodeId: Uint8Array): PeerIDKey => {
    return binaryToHex(nodeId) as PeerIDKey
}

export class PeerID {
    // avoid creating a new instance for every operation
    private static readonly textEncoder = new TextEncoder() 
    private static readonly textDecoder = new TextDecoder()
    
    private readonly data!: Uint8Array
    private readonly key: PeerIDKey  // precompute often-used form of data

    protected constructor({ ip, value, stringValue }: { ip?: string, value?: Uint8Array, stringValue?: string } = {}) {
        if (ip !== undefined) {
            this.data = new Uint8Array(20)
            const ipNum = this.ip2Int(ip)
            const view = new DataView(this.data.buffer)
            view.setInt32(0, ipNum)

            this.data.set((new UUID()).value, 4)
        } else if (value) {
            this.data = new Uint8Array(value.slice(0))
        } else if (stringValue !== undefined) {
            const ab = PeerID.textEncoder.encode(stringValue) //toUTF8Array(stringValue)
            this.data = ab
        } else {
            throw new IllegalArguments('Constructor of PeerID must be given either ip, value or stringValue')
        }

        this.key = createPeerIDKey(this.data)
    }

    static fromIp(ip: string): PeerID {
        return new PeerID({ ip })
    }

    static fromValue(value: Uint8Array): PeerID {
        return new PeerID({ value })
    }

    static fromKey(value: PeerIDKey): PeerID {
        return new PeerID({ value: Buffer.from(value, 'hex') })
    }

    static fromString(stringValue: string): PeerID {
        return new PeerID({ stringValue })
    }

    // TODO convert to static method?
    // eslint-disable-next-line class-methods-use-this
    private ip2Int(ip: string): number {
        return ip.split('.').map((octet, index, array) => {
            return parseInt(octet) * Math.pow(256, (array.length - index - 1))
        }).reduce((prev, curr) => {
            return prev + curr
        })
    }

    equals(other: PeerID): boolean {
        return (Buffer.compare(this.data, other.value) === 0)
    }

    toString(): string {
        return PeerID.textDecoder.decode(this.data) //utf8ArrayToString(this.data)
    }

    toKey(): PeerIDKey {
        return this.key
    }

    toNodeId(): NodeID {
        return getNodeIdFromRaw(this.data)
    }

    get value(): Uint8Array {
        return this.data
    }

    hasSmallerHashThan(other: PeerID): boolean {
        const myId = this.toKey()
        const theirId = other.toKey()
        return PeerID.offeringHash(myId + ',' + theirId) < PeerID.offeringHash(theirId + ',' + myId)
    }

    private static offeringHash(idPair: string): number {
        const buffer = crypto.createHash('md5').update(idPair).digest()
        return buffer.readInt32LE(0)
    }
}
