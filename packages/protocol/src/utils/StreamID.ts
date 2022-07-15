import { KeyExchangeStreamIDUtils } from './KeyExchangeStreamID'
import { EthereumAddress, ENSName } from './types'
import { BrandedString } from '@streamr/utils'

export type StreamID = BrandedString<'StreamID'>

/**
 * Create an instance of `StreamID` from a given string stream id or path.
 *
 * Supported formats:
 *  - full stream id format, e.g., '0x0000000000000000000000000000000000000000/foo/bar' or 'name.eth/foo/bar'
 *  - path-only format, e.g. , '/foo/bar'
 *  - key-exchange format, e.g., SYSTEM/keyexchange/0x0000000000000000000000000000000000000000
 *  - legacy format, e.g., '7wa7APtlTq6EC5iTCBy6dw'
 *
 *  If `streamIdOrPath` is not in path-only format, `domain` can be left undefined.
 */
export function toStreamID(streamIdOrPath: string, domain?: EthereumAddress | ENSName): StreamID | never {
    if (streamIdOrPath.length === 0) {
        throw new Error('stream id may not be empty')
    }
    const firstSlashIdx = streamIdOrPath.indexOf('/')
    if (firstSlashIdx === -1) { // legacy format
        return streamIdOrPath as StreamID
    } else if (KeyExchangeStreamIDUtils.isKeyExchangeStream(streamIdOrPath)) { // key-exchange format
        return streamIdOrPath as StreamID
    } else if (firstSlashIdx === 0) { // path-only format
        if (domain === undefined) {
            throw new Error(`path-only format "${streamIdOrPath}" provided without domain`)
        }
        return (domain.toLowerCase() + streamIdOrPath) as StreamID
    } else {
        const domain = streamIdOrPath.substring(0, firstSlashIdx).toLowerCase()
        const path = streamIdOrPath.substring(firstSlashIdx)
        return (domain + path) as StreamID
    }
}

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class StreamIDUtils {

    static isPathOnlyFormat(streamIdOrPath: string): boolean {
        return streamIdOrPath.startsWith('/')
    }

    static getDomain(streamId: StreamID): EthereumAddress | ENSName | undefined {
        const domainAndPath = StreamIDUtils.getDomainAndPath(streamId)
        return domainAndPath?.[0]
    }

    static isENSName(domain: string): boolean {
        return domain.indexOf('.') !== -1
    }

    static isENSAddress(address: string): boolean {
        return address.indexOf('.') !== -1
    }
    
    static getPath(streamId: StreamID): string | undefined {
        const domainAndPath = StreamIDUtils.getDomainAndPath(streamId)
        return domainAndPath?.[1]
    }
    
    static getDomainAndPath(streamId: StreamID): [EthereumAddress | ENSName, string] | undefined {
        const firstSlashIdx = streamId.indexOf('/')
        if (firstSlashIdx !== -1 && !KeyExchangeStreamIDUtils.isKeyExchangeStream(streamId)) {
            return [streamId.substring(0, firstSlashIdx), streamId.substring(firstSlashIdx)]
        } else {
            return undefined
        }
    }

}
