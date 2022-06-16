import crypto from 'crypto'
import { writeHeapSnapshot } from 'v8'
import { DependencyContainer } from 'tsyringe'

import fetch from 'node-fetch'
import { KeyServer, wait } from 'streamr-test-utils'
import { Wallet } from 'ethers'
import { 
    EthereumAddress,
    StreamMessage,
    StreamPartID,
    StreamPartIDUtils,
    toStreamPartID,
    MAX_PARTITION_COUNT,
    StreamMessageOptions,
    MessageID, 
    SigningUtil
} from 'streamr-client-protocol'
import LeakDetector from 'jest-leak-detector'

import { StreamrClient } from '../../src/StreamrClient'
import { counterId, CounterId, instanceId } from '../../src/utils/utils'
import { AggregatedError } from '../../src/utils/AggregatedError'
import { Debug, format } from '../../src/utils/log'
import { MaybeAsync, StreamDefinition } from '../../src/types'
import { Stream, StreamProperties } from '../../src/Stream'
import { ConfigTest } from '../../src/ConfigTest'

import { Signal } from '../../src/utils/Signal'
import { PublishMetadata } from '../../src/publish/Publisher'
import { Pipeline } from '../../src/utils/Pipeline'
import { StreamPermission } from '../../src/permission'
import { padEnd } from 'lodash'
import { Context } from '../../src/utils/Context'
import { StreamrClientConfig } from '../../src/Config'
import { PublishPipeline } from '../../src/publish/PublishPipeline'
import { GroupKey } from '../../src/encryption/GroupKey'
import { EncryptionUtil } from '../../src/encryption/EncryptionUtil'

const testDebugRoot = Debug('test')
const testDebug = testDebugRoot.extend.bind(testDebugRoot)

export {
    testDebug as Debug
}

export function mockContext(): Context {
    const id = counterId('mockContext')
    return { id, debug: testDebugRoot.extend(id) }
}

export const uid = (prefix?: string): string => counterId(`p${process.pid}${prefix ? '-' + prefix : ''}`)

export async function fetchPrivateKeyWithGas(): Promise<string> {
    let response
    try {
        response = await fetch(`http://localhost:${KeyServer.KEY_SERVER_PORT}/key`, {
            timeout: 5 * 1000
        })
    } catch (_e) {
        try {
            await KeyServer.startIfNotRunning() // may throw if parallel attempts at starting server
        } catch (_e2) {
        } finally {
            response = await fetch(`http://localhost:${KeyServer.KEY_SERVER_PORT}/key`, {
                timeout: 5 * 1000
            })
        }
    }

    if (!response.ok) {
        throw new Error(`fetchPrivateKeyWithGas failed ${response.status} ${response.statusText}: ${response.text()}`)
    }

    return response.text()
}

const TEST_REPEATS = (process.env.TEST_REPEATS) ? parseInt(process.env.TEST_REPEATS, 10) : 1

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function describeRepeats(msg: string, fn: any, describeFn = describe): void {
    for (let k = 0; k < TEST_REPEATS; k++) {
        // eslint-disable-next-line no-loop-func
        describe(msg, () => {
            describeFn(`test repeat ${k + 1} of ${TEST_REPEATS}`, fn)
        })
    }
}

describeRepeats.skip = (msg: any, fn: any) => {
    describe.skip(`${msg} – test repeat ALL of ${TEST_REPEATS}`, fn)
}

describeRepeats.only = (msg: any, fn: any) => {
    describeRepeats(msg, fn, describe.only)
}

export async function collect<T>(
    iterator: AsyncGenerator<StreamMessage<T>>,
    fn: MaybeAsync<(item: {
        msg: StreamMessage<T>,
        iterator: AsyncGenerator<StreamMessage<T>>,
        received: T[]
    }) => void> = async () => {}
): Promise<T[]> {
    const received: T[] = []
    for await (const msg of iterator) {
        received.push(msg.getParsedContent())
        await fn({
            msg, iterator, received,
        })
    }
    return received
}

export function getTestSetTimeout(): (callback: () => void, ms?: number | undefined) => NodeJS.Timeout {
    const addAfter = addAfterFn()
    return (callback: () => void, ms?: number) => {
        const t = setTimeout(callback, ms)
        addAfter(() => {
            clearTimeout(t)
        })
        return t
    }
}

export function addAfterFn(): (fn: any) => void {
    const afterFns: any[] = []
    afterEach(async () => {
        const fns = afterFns.slice()
        afterFns.length = 0
        // @ts-expect-error invalid parameter
        AggregatedError.throwAllSettled(await Promise.allSettled(fns.map((fn) => fn())))
    })

    return (fn: any) => {
        afterFns.push(fn)
    }
}

export function Msg<T extends object = object>(opts?: T): any {
    return {
        value: uid('msg'),
        ...opts,
    }
}

export type CreateMessageOpts = {
    /** index of message in total */
    index: number,
    /** batch number */
    batch: number,
    /** index of message in batch */
    batchIndex: number,
    /** total messages */
    total: number
}

export const createMockAddress = (): string => '0x000000000000000000000000000' + Date.now()

export function getRandomClient(): StreamrClient {
    const wallet = new Wallet(`0x100000000000000000000000000000000000000012300000001${Date.now()}`)
    return new StreamrClient({
        ...ConfigTest,
        auth: {
            privateKey: wallet.privateKey
        }
    })
}

// eslint-disable-next-line no-undef
const getTestName = (module: NodeModule): string => {
    const fileNamePattern = new RegExp('.*/(.*).test\\...')
    const groups = module.filename.match(fileNamePattern)
    return (groups !== null) ? groups[1] : module.filename
}

const randomTestRunId = process.pid != null ? process.pid : crypto.randomBytes(4).toString('hex')

export const createRelativeTestStreamId = (module: NodeModule, suffix?: string): string => {
    return counterId(`/test/${randomTestRunId}/${getTestName(module)}${(suffix !== undefined) ? '-' + suffix : ''}`, '-')
}

export const createTestStream = async (streamrClient: StreamrClient, module: NodeModule, props?: Partial<StreamProperties>): Promise<Stream> => {
    const stream = await streamrClient.createStream({
        id: createRelativeTestStreamId(module),
        ...props
    })
    return stream
}

export const getCreateClient = (
    defaultOpts = {}, 
    defaultParentContainer?: DependencyContainer
): (opts?: StreamrClientConfig, parentContainer?: DependencyContainer) => Promise<StreamrClient> => {
    const addAfter = addAfterFn()

    return async function createClient(opts: any = {}, parentContainer?: DependencyContainer) {
        let key
        if (opts.auth && opts.auth.privateKey) {
            key = opts.auth.privateKey
        } else {
            key = await fetchPrivateKeyWithGas()
        }
        const c = new StreamrClient({
            ...ConfigTest,
            auth: {
                privateKey: key,
            },
            ...defaultOpts,
            ...opts,
        }, defaultParentContainer ?? parentContainer)

        addAfter(async () => {
            await wait(0)
            if (!c) { return }
            c.debug('disconnecting after test >>')
            await c.destroy()
            c.debug('disconnecting after test <<')
        })

        return c
    }
}

/**
 * Write a heap snapshot file if WRITE_SNAPSHOTS env var is set.
 */
export function snapshot(): string {
    if (!process.env.WRITE_SNAPSHOTS) { return '' }
    testDebugRoot('heap snapshot >>')
    const value = writeHeapSnapshot()
    testDebugRoot('heap snapshot <<', value)
    return value
}

export class LeaksDetector {
    private leakDetectors: Map<string, LeakDetector> = new Map()
    private ignoredValues = new WeakSet()
    private id = instanceId(this)
    private debug = testDebug(this.id)
    private seen = new WeakSet()
    private didGC = false

    // temporary whitelist leaks in network code
    ignoredKeys = new Set([
        '/cachedNode',
        '/container',
        '/childContainer',
        'rovider/formatter',
        'chainProviders/0/formatter'
    ])

    private counter = CounterId(this.id, { maxPrefixes: 1024 })

    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    add(name: string, obj: any): void {
        if (!obj || typeof obj !== 'object') { return }

        if (this.ignoredValues.has(obj)) { return }

        this.resetGC()
        const leaksDetector = new LeakDetector(obj)
        // @ts-expect-error monkeypatching
        // eslint-disable-next-line no-underscore-dangle
        leaksDetector._runGarbageCollector = this.runGarbageCollectorOnce(leaksDetector._runGarbageCollector)
        this.leakDetectors.set(name, leaksDetector)
    }

    // returns a monkeypatch for leaksDetector._runGarbageCollector
    // that avoids running gc for every isLeaking check, only once.
    private runGarbageCollectorOnce(original: (...args: unknown[]) => void) {
        return (...args: any[]) => {
            if (this.didGC) {
                return
            }

            this.didGC = true
            original(...args)
        }
    }

    resetGC(): void {
        this.didGC = false
    }

    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    ignore(obj: any): void {
        if (!obj || typeof obj !== 'object') { return }
        this.ignoredValues.add(obj)
    }

    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    ignoreAll(obj: any): void {
        if (!obj || typeof obj !== 'object') { return }
        const seen = new Set()
        this.walk([], obj, (_path, value) => {
            if (seen.has(value)) { return false }
            seen.add(value)
            this.ignore(value)
            return undefined
        })
    }

    idToPaths = new Map<string, Set<string>>() // ids to paths
    objectToId = new WeakMap<object, string>() // single id for value

    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    getID(path: string[], value: any): any {
        if (this.objectToId.has(value)) {
            return this.objectToId.get(value)
        }

        let id = (() => {
            if (value.id) { return value.id }
            const pathString = path.join('/')
            const constructor = value.constructor?.name
            const type = constructor === 'Object' ? undefined : constructor
            return pathString + (type ? `-${type}` : '')
        })()

        id = this.counter(id)
        this.objectToId.set(value, id)
        return id
    }

    protected walk(
        path: string[],
        obj: object,
        fn: (path: string[], obj: object, depth: number) => false | void,
        depth = 0
    ): void {
        if (!obj || typeof obj !== 'object') { return }

        if (depth > 10) { return }

        const doContinue = fn(path, obj, depth)

        if (doContinue === false) { return }

        if (Array.isArray(obj)) {
            obj.forEach((value, key) => {
                this.walk([...path, `${key}`], value, fn, depth + 1)
            })
            return
        }

        for (const [key, value] of Object.entries(obj)) {
            if (!value || typeof value !== 'object') { continue }

            this.walk([...path, `${key}`], value, fn, depth + 1)
        }
    }

    addAll(rootId: string, obj: object): void {
        this.walk([rootId], obj, (path, value) => {
            if (this.ignoredValues.has(value)) { return false }
            const pathString = path.join('/')
            for (const key of this.ignoredKeys) {
                if (pathString.includes(key)) { return false } // stop walking
            }

            const id = this.getID(path, value)
            const paths = this.idToPaths.get(id) || new Set()
            paths.add(pathString)
            this.idToPaths.set(id, paths)
            if (!this.seen.has(value)) {
                this.seen.add(value)
                this.add(id, value)
            }
            return undefined
        })
    }

    async getLeaks(): Promise<Record<string, string>> {
        this.debug('checking for leaks with %d items >>', this.leakDetectors.size)
        await wait(10) // wait a moment for gc to run?
        const outstanding = new Set<string>()
        this.resetGC()
        const tasks = [...this.leakDetectors.entries()].map(async ([key, d]) => {
            outstanding.add(key)
            const isLeaking = await d.isLeaking()
            outstanding.delete(key)
            return isLeaking ? key : undefined
        })
        await Promise.allSettled(tasks)
        const results = (await Promise.all(tasks)).filter(Boolean) as string[]

        const leaks = results.reduce((o, id) => Object.assign(o, {
            [id]: [...(this.idToPaths.get(id) || [])],
        }), {})

        this.debug('checking for leaks with %d items <<', this.leakDetectors.size)
        this.debug('%d leaks.', results.length)
        return leaks
    }

    async checkNoLeaks(): Promise<void> {
        const leaks = await this.getLeaks()
        const numLeaks = Object.keys(leaks).length
        if (numLeaks) {
            const msg = format('Leaking %d of %d items: %o', numLeaks, this.leakDetectors.size, leaks)
            this.clear()
            throw new Error(msg)
        }
    }

    async checkNoLeaksFor(id: string): Promise<void> {
        const leaks = await this.getLeaks()
        const numLeaks = Object.keys(leaks).length
        if (Object.keys(leaks).includes(id)) {
            const msg = format('Leaking %d of %d items, including id %s: %o', numLeaks, this.leakDetectors.size, id, leaks)
            this.clear()
            throw new Error(msg)
        }
    }

    clear(): void {
        this.seen = new WeakSet()
        this.ignoredValues = new WeakSet()
        this.leakDetectors.clear()
        this.didGC = false
    }
}

type PublishManyOpts = Partial<{
    delay: number,
    timestamp: number | (() => number)
    sequenceNumber: number | (() => number)
    partitionKey: number | string | (() => number | string)
    createMessage: (content: any) => any
}>

export async function* publishManyGenerator(
    total: number = 5,
    opts: PublishManyOpts = {}
): AsyncGenerator<PublishMetadata<any>> {
    const { delay = 10, sequenceNumber, timestamp, partitionKey, createMessage = Msg } = opts
    const batchId = counterId('publishMany')
    for (let i = 0; i < total; i++) {
        yield {
            timestamp: typeof timestamp === 'function' ? timestamp() : timestamp,
            sequenceNumber: typeof sequenceNumber === 'function' ? sequenceNumber() : sequenceNumber,
            partitionKey: typeof partitionKey === 'function' ? partitionKey() : partitionKey,
            content: createMessage({
                batchId,
                value: `${i + 1} of ${total}`,
                index: i,
                total,
            })
        }

        if (delay) {
            // eslint-disable-next-line no-await-in-loop
            await wait(delay)
        }
    }
}

type PublishTestMessageOptions = PublishManyOpts & {
    waitForLast?: boolean
    waitForLastCount?: number
    waitForLastTimeout?: number,
    retainMessages?: boolean
    onSourcePipeline?: Signal<[Pipeline<PublishMetadata<any>>]>
    onPublishPipeline?: Signal<[Pipeline<StreamMessage>]>
    afterEach?: (msg: StreamMessage) => Promise<void> | void
}

export function publishTestMessagesGenerator(
    client: StreamrClient,
    streamDefinition: StreamDefinition,
    maxMessages = 5,
    opts: PublishTestMessageOptions = {}
): Pipeline<StreamMessage<unknown>, StreamMessage<unknown>> {
    const source = new Pipeline(publishManyGenerator(maxMessages, opts))
    if (opts.onSourcePipeline) {
        opts.onSourcePipeline.trigger(source)
    }
    const pipeline = new Pipeline<StreamMessage>(publishFromMetadata(streamDefinition, source, client))
    if (opts.afterEach) {
        pipeline.forEach(opts.afterEach)
    }
    return pipeline
}

export function getPublishTestStreamMessages(
    client: StreamrClient,
    streamDefinition: StreamDefinition,
    defaultOpts: PublishTestMessageOptions = {}
): (maxMessages?: number, opts?: PublishTestMessageOptions) => Promise<StreamMessage<unknown>[]> {
    return async (maxMessages: number = 5, opts: PublishTestMessageOptions = {}) => {
        const {
            waitForLast,
            waitForLastCount,
            waitForLastTimeout,
            retainMessages = true,
            ...options
        } = {
            ...defaultOpts,
            ...opts,
        }

        const contents = new WeakMap()
        // @ts-expect-error private
        const publishPipeline = client.container.resolve(PublishPipeline)
        // @ts-expect-error private
        publishPipeline.streamMessageQueue.onMessage.listen(([streamMessage]) => {
            contents.set(streamMessage, streamMessage.serializedContent)
        })
        const publishStream = publishTestMessagesGenerator(client, streamDefinition, maxMessages, options)
        if (opts.onPublishPipeline) {
            opts.onPublishPipeline.trigger(publishStream)
        }
        const streamMessages = []
        let count = 0
        for await (const streamMessage of publishStream) {
            count += 1
            if (!retainMessages) {
                streamMessages.length = 0 // only keep last message
            }
            streamMessages.push(streamMessage)
            if (count === maxMessages) {
                break
            }
        }

        if (waitForLast) {
            await getWaitForStorage(client, {
                count: waitForLastCount,
                timeout: waitForLastTimeout,
            })(streamMessages[streamMessages.length - 1])
        }

        return streamMessages.map((streamMessage) => {
            const targetStreamMessage = streamMessage.clone()
            targetStreamMessage.serializedContent = contents.get(streamMessage)
            targetStreamMessage.encryptionType = 0
            targetStreamMessage.parsedContent = null
            targetStreamMessage.getParsedContent()
            return targetStreamMessage
        })
    }
}

export function getPublishTestMessages(
    client: StreamrClient,
    streamDefinition: StreamDefinition,
    defaultOpts: PublishTestMessageOptions = {}
): (maxMessages?: number, opts?: PublishTestMessageOptions) => Promise<unknown[]> {
    const publishTestStreamMessages = getPublishTestStreamMessages(client, streamDefinition, defaultOpts)
    return async (maxMessages: number = 5, opts: PublishTestMessageOptions = {}) => {
        const streamMessages = await publishTestStreamMessages(maxMessages, opts)
        return streamMessages.map((s) => s.getParsedContent())
    }
}

export function getWaitForStorage(client: StreamrClient, defaultOpts = {}): (lastPublished: StreamMessage, opts?: {
    interval?: number
    timeout?: number
    count?: number
    messageMatchFn?: (msgTarget: StreamMessage, msgGot: StreamMessage) => boolean
}) => Promise<void> {
    return async (lastPublished: StreamMessage, opts = {}) => {
        return client.waitForStorage(lastPublished, {
            ...defaultOpts,
            ...opts,
        })
    }
}

export const createEthereumAddress = (id: number): string => {
    return '0x' + padEnd(String(id), 40, '0')
}

export const createEthereumAddressCache = (): { getAddress: (privateKey: string) => EthereumAddress } => {
    const cache: Map<string, EthereumAddress> = new Map()
    return {
        getAddress: (privateKey: string): EthereumAddress => {
            let address = cache.get(privateKey)
            if (address === undefined) {
                address = new Wallet(privateKey).address
                cache.set(privateKey, address)
            }
            return address
        }
    }
}

/*
 * Generic multimap: a key which maps to multiple valuess.
 * The values is an array
 * -> when we query the data, we get it back in the same order
 * -> an array may contain duplicates, if same value is added multiple times
 *    (we could implement a Multiset class if we need a different kind of duplication handling)
 *
 * TODO: Move this class to a streamr-utils package when we create that? Also implement some
 * unit tests if this is not just a test helper class.
 */
export class Multimap<K, V> {
    private readonly values: Map<K, V[]> = new Map()

    get(key: K): V[] {
        return this.values.get(key) ?? []
    }

    has(key: K, value: V): boolean {
        const items = this.values.get(key)
        if (items !== undefined) {
            return items.includes(value)
            // eslint-disable-next-line no-else-return
        } else {
            return false
        }
    }

    add(key: K, value: V): void {
        this.values.set(key, this.get(key).concat(value))
    }

    addAll(key: K, values: V[]): void {
        this.values.set(key, this.get(key).concat(values))
    }

    remove(key: K, value: V): void {
        const items = this.values.get(key)
        if (items !== undefined) {
            const newItems = items.filter((i) => i !== value)
            if (newItems.length > 0) {
                this.values.set(key, newItems)
            } else {
                this.values.delete(key)
            }
        }
    }

    removeAll(key: K, values: V[]): void {
        values.forEach((value) => this.remove(key, value))
    }

    keys(): K[] {
        return Array.from(this.values.keys())
    }
}

// eslint-disable-next-line no-undef
export const createPartitionedTestStream = async (module: NodeModule): Promise<Stream> => {
    const client = new StreamrClient({
        ...ConfigTest,
        auth: {
            privateKey: await fetchPrivateKeyWithGas()
        }
    })
    const stream = await createTestStream(client, module, {
        partitions: MAX_PARTITION_COUNT
    })
    await stream.grantPermissions({
        public: true,
        permissions: [StreamPermission.PUBLISH, StreamPermission.SUBSCRIBE]
    })
    await client.destroy()
    return stream
}

export async function* createStreamPartIterator(stream: Stream): AsyncGenerator<StreamPartID> {
    for (let partition = 0; partition < stream.partitions; partition++) {
        yield toStreamPartID(stream.id, partition)
    }
}

export const toStreamDefinition = (streamPart: StreamPartID): { id: string, partition: number } => {
    const [id, partition] = StreamPartIDUtils.getStreamIDAndPartition(streamPart)
    return {
        id,
        partition
    }
}

type CreateMockMessageOptionsBase = Omit<Partial<StreamMessageOptions<any>>, 'messageId' | 'signatureType'> & {
    publisher: Wallet
    msgChainId?: string
    timestamp?: number
    sequenceNumber?: number,
    encryptionKey?: GroupKey
}

export const createMockMessage = (  
    opts: CreateMockMessageOptionsBase 
    & ({ streamPartId: StreamPartID, stream?: never } | { stream: Stream, streamPartId?: never })
): StreamMessage<any> => {
    const [streamId, partition] = StreamPartIDUtils.getStreamIDAndPartition(
        opts.streamPartId ?? opts.stream.getStreamParts()[0]
    )
    const msg = new StreamMessage({
        messageId: new MessageID(
            streamId,
            partition,
            opts.timestamp ?? Date.now(),
            opts.sequenceNumber ?? 0,
            opts.publisher.address,
            opts.msgChainId ?? 'msgChainId'
        ),
        signatureType: StreamMessage.SIGNATURE_TYPES.ETH,
        content: {},
        ...opts
    })
    if (opts.encryptionKey !== undefined) {
        EncryptionUtil.encryptStreamMessage(msg, opts.encryptionKey)
    }
    msg.signature = SigningUtil.sign(msg.getPayloadToSign(StreamMessage.SIGNATURE_TYPES.ETH), opts.publisher.privateKey)
    return msg
}

export async function* publishFromMetadata<T>(
    streamDefinition: StreamDefinition, 
    seq: AsyncIterable<PublishMetadata<T>>,
    client: StreamrClient
): AsyncGenerator<StreamMessage<T>, void, unknown> {
    for await (const msg of seq) {
        yield await client.publish(streamDefinition, msg.content, {
            timestamp: msg.timestamp,
            partitionKey: msg.partitionKey
        })
    }
}