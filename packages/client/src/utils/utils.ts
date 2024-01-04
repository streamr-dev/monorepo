import { ContractReceipt } from '@ethersproject/contracts'
import { DhtAddress, getDhtAddressFromRaw, getRawFromDhtAddress } from '@streamr/dht'
import { StreamID, toStreamID } from '@streamr/protocol'
import {
    composeAbortSignals,
    LengthPrefixedFrameDecoder,
    Logger,
    merge,
    randomString,
    TheGraphClient,
    toEthereumAddress
} from '@streamr/utils'
import compact from 'lodash/compact'
import fetch, { Response } from 'node-fetch'
import { AbortSignal as FetchAbortSignal } from 'node-fetch/externals'
import { Readable } from 'stream'
import LRU from '../../vendor/quick-lru'
import { NetworkNodeType, NetworkPeerDescriptor, StrictStreamrClientConfig } from '../Config'
import { StreamrClientEventEmitter } from '../events'
import { WebStreamToNodeStream } from './WebStreamToNodeStream'
import { SEPARATOR } from './uuid'
import { NodeType, PeerDescriptor } from '@streamr/dht'

const logger = new Logger(module)

/**
 * Generates counter-based ids.
 * Basically lodash.uniqueid but per-prefix.
 * Not universally unique.
 * Generally useful for tracking instances.
 *
 * Careful not to use too many prefixes since it needs to hold all prefixes in memory
 * e.g. don't pass new uuid as a prefix
 *
 * counterId('test') => test.0
 * counterId('test') => test.1
 */

// TODO convert to a class?
type CounterIdType = ((prefix: string, separator?: string) => string) & { clear: (...args: [string] | []) => void }
export const CounterId = (rootPrefix?: string, { maxPrefixes = 256 }: { maxPrefixes?: number } = {}): CounterIdType => {
    let counts: Record<string, number> = {} // possible we could switch this to WeakMap and pass functions or classes.
    let didWarn = false
    const counterIdFn = (prefix = 'ID', separator = SEPARATOR) => {
        // pedantic: wrap around if count grows too large
        counts[prefix] = (counts[prefix] + 1 || 0) % Number.MAX_SAFE_INTEGER

        // warn once if too many prefixes
        if (!didWarn) {
            const numTracked = Object.keys(counts).length
            if (numTracked > maxPrefixes) {
                didWarn = true
                console.warn(`counterId should not be used for a large number of unique prefixes: ${numTracked} > ${maxPrefixes}`)
            }
        }

        // connect prefix with separator
        return [rootPrefix, prefix, counts[prefix]]
            .filter((v) => v != null) // remove {root}Prefix if not set
            .join(separator)
    }

    /**
     * Clears counts for prefix or all if no prefix supplied.
     *
     * @param {string?} prefix
     */
    counterIdFn.clear = (...args: [string] | []) => {
        // check length to differentiate between clear(undefined) & clear()
        if (args.length) {
            const [prefix] = args
            delete counts[prefix]
        } else {
            // clear all
            counts = {}
        }
    }
    return counterIdFn
}

export const counterId = CounterId()

export interface AnyInstance {
    constructor: {
        name: string
        prototype: null | AnyInstance
    }
}

export function instanceId(instance: AnyInstance, suffix = ''): string {
    return counterId(instance.constructor.name) + suffix
}

export const getEndpointUrl = (baseUrl: string, ...pathParts: string[]): string => {
    return baseUrl + '/' + pathParts.map((part) => encodeURIComponent(part)).join('/')
}

export function formStorageNodeAssignmentStreamId(clusterAddress: string): StreamID {
    return toStreamID('/assignments', toEthereumAddress(clusterAddress))
}

export class MaxSizedSet<T> {

    private readonly delegate: LRU<T, true>

    constructor(maxSize: number) {
        this.delegate = new LRU<T, true>({ maxSize })
    }

    add(value: T): void {
        this.delegate.set(value, true)
    }

    has(value: T): boolean {
        return this.delegate.has(value)
    }

    delete(value: T): void {
        this.delegate.delete(value)
    }
}

// TODO: rename to convertNetworkPeerDescriptorToPeerDescriptor

// This function contains temporary compatibility layer which allows that PeerDescriptor can be configured with 
// "id" field instead of "nodeId" field. This is done so that pretestnet users don't need to change their configs.
// After strear-1.0 testnet1 or mainnet starts, remove this hack.
// - Good to ensure at that point that the new format has landed to the public documentation: 
//   https://docs.streamr.network/guides/become-an-operator
// - or maybe NET-1133 or NET-1004 have been implemented and the documentation no longer mentions the low
//   level way of configuring the entry points.
// Actions:
// - remove "temporary compatibility" test case from Broker's config.test.ts 
// - remove "id" property from config.schema.json (line 536) and make "nodeId" property required
// - remove "id" property handling from this method
export function peerDescriptorTranslator(json: NetworkPeerDescriptor): PeerDescriptor {
    const type = json.type === NetworkNodeType.BROWSER ? NodeType.BROWSER : NodeType.NODEJS
    const peerDescriptor: PeerDescriptor = {
        ...json,
        nodeId: getRawFromDhtAddress((json.nodeId ?? (json as any).id) as DhtAddress),
        type,
        websocket: json.websocket
    }
    if ((peerDescriptor as any).id !== undefined) {
        delete (peerDescriptor as any).id
    }
    return peerDescriptor
}

export function convertPeerDescriptorToNetworkPeerDescriptor(descriptor: PeerDescriptor): NetworkPeerDescriptor {
    return {
        ...descriptor,
        nodeId: getDhtAddressFromRaw(descriptor.nodeId),
        type: descriptor.type === NodeType.NODEJS ? NetworkNodeType.NODEJS : NetworkNodeType.BROWSER
    }
}

export function generateClientId(): string {
    return counterId(process.pid ? `${process.pid}` : randomString(4), '/')
}

// A unique internal identifier to some list of primitive values. Useful
// e.g. as a map key or a cache key.
export const formLookupKey = <K extends (string | number)[]>(...args: K): string => {
    return args.join('|')
}

/** @internal */
export const createTheGraphClient = (
    eventEmitter: StreamrClientEventEmitter,
    config: Pick<StrictStreamrClientConfig, 'contracts' | '_timeouts'>
): TheGraphClient => {
    const instance = new TheGraphClient({
        serverUrl: config.contracts.theGraphUrl,
        fetch: (url: string, init?: Record<string, unknown>) => {
            // eslint-disable-next-line no-underscore-dangle
            const timeout = config._timeouts.theGraph.fetchTimeout
            return fetch(url, merge({ timeout }, init))
        },
        // eslint-disable-next-line no-underscore-dangle
        indexTimeout: config._timeouts.theGraph.indexTimeout,
        // eslint-disable-next-line no-underscore-dangle
        indexPollInterval: config._timeouts.theGraph.indexPollInterval
    })
    eventEmitter.on('confirmContractTransaction', (payload: { receipt: ContractReceipt }) => {
        instance.updateRequiredBlockNumber(payload.receipt.blockNumber)
    })
    return instance
}

export const createQueryString = (query: Record<string, any>): string => {
    const withoutEmpty = Object.fromEntries(Object.entries(query).filter(([_k, v]) => v != null))
    return new URLSearchParams(withoutEmpty).toString()
}

export class FetchHttpStreamResponseError extends Error {

    response: Response

    constructor(response: Response) {
        super(`Fetch error, url=${response.url}`)
        this.response = response
    }
}

export const fetchHttpBinaryStream = async function*(
    url: string,
    abortSignal?: AbortSignal
): AsyncGenerator<Uint8Array, void, undefined> {
    logger.debug('Send HTTP request', { url }) 
    const abortController = new AbortController()
    const fetchAbortSignal = composeAbortSignals(...compact([abortController.signal, abortSignal]))
    const response: Response = await fetch(url, {
        // cast is needed until this is fixed: https://github.com/node-fetch/node-fetch/issues/1652
        signal: fetchAbortSignal as FetchAbortSignal
    })
    logger.debug('Received HTTP response', {
        url,
        status: response.status,
    })
    if (!response.ok) {
        throw new FetchHttpStreamResponseError(response)
    }
    if (!response.body) {
        throw new Error('No Response Body')
    }

    let stream: Readable | undefined
    try {
        // in the browser, response.body will be a web stream. Convert this into a node stream.
        const source: Readable = WebStreamToNodeStream(response.body as unknown as (ReadableStream | Readable))
        stream = source.pipe(new LengthPrefixedFrameDecoder())
        source.on('error', (err: Error) => stream!.destroy(err))
        stream.once('close', () => {
            abortController.abort()
        })
        yield* stream
    } catch (err) {
        abortController.abort()
        throw err
    } finally {
        stream?.destroy()
        fetchAbortSignal.destroy()
    }
}
