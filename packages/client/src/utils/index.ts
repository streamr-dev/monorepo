import { inspect } from 'util'
import EventEmitter from 'events'
import { SEPARATOR } from './uuid'
import pMemoize from 'p-memoize'
import pLimit from 'p-limit'
import mem from 'mem'
import { L } from 'ts-toolbelt'

import pkg from '../../package.json'
import LRU from '../../vendor/quick-lru'
import { MaybeAsync } from '../types'

import { AggregatedError } from './AggregatedError'
import { Scaffold } from './Scaffold'
import { Debug } from './log'
import { EthereumAddress, StreamID, toStreamID } from 'streamr-client-protocol'

export const debug = Debug('utils')

export { default as uuid } from './uuid'
export { AggregatedError, Scaffold }

export function randomString(length = 20) {
    // eslint-disable-next-line no-bitwise
    return [...Array(length)].map(() => (~~(Math.random() * 36)).toString(36)).join('')
}

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

export const CounterId = (rootPrefix?: string, { maxPrefixes = 256 }: { maxPrefixes?: number } = {}) => {
    let counts: { [prefix: string]: number } = {} // possible we could switch this to WeakMap and pass functions or classes.
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

export type AnyInstance = {
    constructor: {
        name: string
        prototype: null | AnyInstance
    }
}

export function instanceId(instance: AnyInstance, suffix = '') {
    return counterId(instance.constructor.name) + suffix
}

function getVersion() {
    // dev deps are removed for production build
    const hasDevDependencies = !!(pkg.devDependencies && Object.keys(pkg.devDependencies).length)
    const isProduction = process.env.NODE_ENV === 'production' || hasDevDependencies
    return `${pkg.version}${!isProduction ? 'dev' : ''}`
}

// hardcode this at module exec time as can't change
const versionString = getVersion()

export function getVersionString() {
    return versionString
}

/**
 * Converts a .once event listener into a promise.
 * Rejects if an 'error' event is received before resolving.
 */

export function waitFor(emitter: EventEmitter, event: Parameters<EventEmitter['on']>[0]) {
    return new Promise((resolve, reject) => {
        let onError: (error: Error) => void
        const onEvent = (value: any) => {
            emitter.off('error', onError)
            resolve(value)
        }
        onError = (error) => {
            emitter.off(event, onEvent)
            reject(error)
        }

        emitter.once(event, onEvent)
        emitter.once('error', onError)
    })
}

export const getEndpointUrl = (baseUrl: string, ...pathParts: string[]) => {
    return baseUrl + '/' + pathParts.map((part) => encodeURIComponent(part)).join('/')
}

type Collection<K, V> = {
    keys: Map<K, V>['keys']
    delete: Map<K, V>['delete']
}

function clearMatching<K>(cache: Collection<K, unknown>, matchFn: (key: K) => boolean) {
    for (const key of cache.keys()) {
        if (matchFn(key)) {
            cache.delete(key)
        }
    }
}

/* eslint-disable object-curly-newline */

/**
 * Returns a cached async fn, cached keyed on first argument passed. See documentation for mem/p-memoize.
 * Caches into a LRU cache capped at options.maxSize
 * Won't call asyncFn again until options.maxAge or options.maxSize exceeded, or cachedAsyncFn.clear() is called.
 * Won't cache rejections by default. Override with options.cachePromiseRejection = true.
 *
 * ```js
 * const cachedAsyncFn = CacheAsyncFn(asyncFn, options)
 * await cachedAsyncFn(key)
 * await cachedAsyncFn(key)
 * cachedAsyncFn.clear()
 * ```
 */
export function CacheAsyncFn<ArgsType extends any[], ReturnType, KeyType = ArgsType[0]>(asyncFn: (...args: ArgsType) => PromiseLike<ReturnType>, {
    maxSize = 10000,
    maxAge = 30 * 60 * 1000, // 30 minutes
    cachePromiseRejection = false,
    onEviction = () => {},
    cacheKey = (args: ArgsType) => args[0], // type+provide default so we can infer KeyType
    ...opts
}: {
    maxSize?: number
    maxAge?: number
    cachePromiseRejection?: boolean
    onEviction?: (...args: any[]) => void
    cacheKey?: (args: ArgsType) => KeyType
} = {}): ((...args: ArgsType) => Promise<ReturnType>) & { clear: () => void; clearMatching: (matchFn: (key: KeyType) => boolean) => void } {
    const cache = new LRU<KeyType, { data: ReturnType, maxAge: number }>({
        maxSize,
        maxAge,
        onEviction,
    })

    const cachedFn = Object.assign(pMemoize(asyncFn, {
        cachePromiseRejection,
        cache,
        cacheKey,
        ...opts,
    }), {
        clear: () => {
            pMemoize.clear(cachedFn as any)
            cache.clear()
        },
        clearMatching: (matchFn: ((key: KeyType) => boolean)) => clearMatching(cache, matchFn),
    })

    return cachedFn
}

/**
 * Returns a cached fn, cached keyed on first argument passed. See documentation for mem.
 * Caches into a LRU cache capped at options.maxSize
 * Won't call fn again until options.maxAge or options.maxSize exceeded, or cachedFn.clear() is called.
 *
 * ```js
 * const cachedFn = CacheFn(fn, options)
 * cachedFn(key)
 * cachedFn(key)
 * cachedFn(...args)
 * cachedFn.clear()
 * ```
 */

export function CacheFn<ArgsType extends any[], ReturnType, KeyType = ArgsType[0]>(fn: (...args: ArgsType) => ReturnType, {
    maxSize = 10000,
    maxAge = 30 * 60 * 1000, // 30 minutes
    onEviction = () => {},
    cacheKey = (args: ArgsType) => args[0], // type+provide default so we can infer KeyType
    ...opts
}: {
    maxSize?: number
    maxAge?: number
    onEviction?: (...args: any[]) => void
    cacheKey?: (args: ArgsType) => KeyType
} = {}) {
    const cache = new LRU<KeyType, { data: ReturnType, maxAge: number }>({
        maxSize,
        maxAge,
        onEviction,
    })

    const cachedFn = Object.assign(mem(fn, {
        cache,
        cacheKey,
        ...opts,
    }), {
        clear: () => {
            mem.clear(cachedFn as any)
            cache.clear()
        },
        clearMatching: (matchFn: ((key: KeyType) => boolean)) => clearMatching(cache, matchFn),
    })

    return cachedFn
}

/* eslint-enable object-curly-newline */

/**
 * Deferred promise allowing external control of resolve/reject.
 * Returns a Promise with resolve/reject functions attached.
 * Also has a wrap(fn) method that wraps a function to settle this promise
 * Also has a wrapError(fn) method that wraps a function to settle this promise if error
 * Defer optionally takes executor function ala `new Promise(executor)`
 */
type PromiseResolve = L.Compulsory<Parameters<Promise<any>['then']>>[0]
type PromiseReject = L.Compulsory<Parameters<Promise<any>['then']>>[1]

const noop = () => {}

/*
 * Some TS magic to allow type A = Defer<T>
 * but instead as Deferred<T>
 */
class DeferredWrapper<T> {
    // eslint-disable-next-line class-methods-use-this
    wrap(...args: any[]) {
        return Defer<T>(...args)
    }
}

export type Deferred<T> = ReturnType<DeferredWrapper<T>['wrap']>

export function Defer<T>(executor: (...args: Parameters<Promise<T>['then']>) => void = noop) {
    let resolveFn: PromiseResolve | undefined
    let rejectFn: PromiseResolve | undefined
    let isResolved = false
    const resolve: PromiseResolve = (value) => {
        if (resolveFn) {
            const r = resolveFn
            resolveFn = undefined
            rejectFn = undefined
            r(value)
        }
    }
    const reject: PromiseReject = (error) => {
        if (rejectFn) {
            const r = rejectFn
            resolveFn = undefined
            rejectFn = undefined
            r(error)
        }
    }

    // eslint-disable-next-line promise/param-names
    const p: Promise<T> = new Promise((_resolve, _reject) => {
        resolveFn = _resolve
        rejectFn = _reject
        executor(resolve, reject)
    })
    p.catch(() => {}) // prevent unhandledrejection

    function wrap<ArgsType extends any[], ReturnType>(fn: (...args: ArgsType) => ReturnType) {
        return async (...args: ArgsType) => {
            try {
                return resolve(await fn(...args))
            } catch (err) {
                reject(err)
                throw err
            } finally {
                isResolved = true
            }
        }
    }

    function wrapError<ArgsType extends any[], ReturnType>(fn: (...args: ArgsType) => ReturnType) {
        return async (...args: ArgsType) => {
            try {
                return await fn(...args)
            } catch (err) {
                reject(err)
                throw err
            }
        }
    }

    function handleErrBack(err?: Error) {
        if (err) {
            reject(err)
        } else {
            resolve(undefined)
        }
    }

    return Object.assign(p, {
        resolve,
        reject,
        wrap,
        wrapError,
        handleErrBack,
        isResolved() {
            return isResolved
        },
    })
}

/**
 * Returns a limit function that limits concurrency per-key.
 *
 * ```js
 * const limit = LimitAsyncFnByKey(1)
 * limit('channel1', fn)
 * limit('channel2', fn)
 * limit('channel2', fn)
 * ```
 */
type LimitFn = ReturnType<typeof pLimit>

export function LimitAsyncFnByKey<KeyType>(limit = 1) {
    const pending = new Map<KeyType, LimitFn>()
    const f = async (id: KeyType, fn: () => Promise<any>) => {
        const limitFn: LimitFn = (pending.get(id) || pending.set(id, pLimit(limit)).get(id)) as LimitFn
        try {
            return await limitFn(fn)
        } finally {
            if (!limitFn.activeCount && !limitFn.pendingCount) {
                if (pending.get(id) === limitFn) {
                    // clean up if no more active entries (if not cleared)
                    pending.delete(id)
                }
            }
        }
    }

    f.getActiveCount = (id: KeyType): number => {
        const limitFn = pending.get(id)
        if (!limitFn) { return 0 }
        return limitFn.activeCount
    }

    f.getPendingCount = (id: KeyType): number => {
        const limitFn = pending.get(id)
        if (!limitFn) { return 0 }
        return limitFn.pendingCount
    }

    f.clear = () => {
        // note: does not cancel promises
        pending.forEach((p) => p.clearQueue())
        pending.clear()
    }
    return f
}

/**
 * Execute functions in parallel, but ensure they resolve in the order they were executed
 */

export function pOrderedResolve<ArgsType extends unknown[], ReturnType>(
    fn: (...args: ArgsType) => ReturnType
) {
    const queue = pLimit(1)
    return Object.assign(async (...args: ArgsType) => {
        const d = Defer<ReturnType>()
        const done = queue(() => d)
        // eslint-disable-next-line promise/catch-or-return
        await Promise.resolve(fn(...args)).then(d.resolve, d.reject)
        return done
    }, {
        clear() {
            queue.clearQueue()
        }
    })
}

/**
 * Returns a function that executes with limited concurrency.
 */

export function pLimitFn<ArgsType extends unknown[], ReturnType>(
    fn: (...args: ArgsType) => ReturnType | Promise<ReturnType>,
    limit = 1
): ((...args: ArgsType) => Promise<ReturnType>) & { clear(): void } {
    const queue = pLimit(limit)
    return Object.assign((...args: ArgsType) => queue(() => fn(...args)), {
        clear() {
            queue.clearQueue()
        }
    })
}

/**
 * Only allows one outstanding call.
 * Returns same promise while task is executing.
 */

export function pOne<ArgsType extends unknown[], ReturnType>(
    fn: (...args: ArgsType) => ReturnType | Promise<ReturnType>,
): ((...args: ArgsType) => Promise<ReturnType>) {
    const once = pOnce(fn)
    return async (...args: ArgsType): Promise<ReturnType> => {
        try {
            return await once(...args)
        } finally {
            once.reset()
        }
    }
}

/**
 * Only allows calling `fn` once.
 * Returns same promise while task is executing.
 */

export function pOnce<ArgsType extends unknown[], ReturnType>(
    fn: (...args: ArgsType) => ReturnType | Promise<ReturnType>
): ((...args: ArgsType) => Promise<ReturnType>) & { reset(): void, isStarted(): boolean } {
    type CallStatus = PromiseSettledResult<ReturnType> | { status: 'init' } | { status: 'pending', promise: Promise<ReturnType> }
    let currentCall: CallStatus = { status: 'init' }

    return Object.assign(async function pOnceWrap(...args: ArgsType): Promise<ReturnType> { // eslint-disable-line prefer-arrow-callback
        // capture currentCall so can assign to it, even after reset
        const thisCall = currentCall
        if (thisCall.status === 'pending') {
            return thisCall.promise
        }

        if (thisCall.status === 'fulfilled') {
            return thisCall.value
        }

        if (thisCall.status === 'rejected') {
            throw thisCall.reason
        }

        // status === 'init'

        currentCall = thisCall

        const promise = (async () => {
            // capture value/error
            try {
                const value = await fn(...args)
                Object.assign(thisCall, {
                    promise: undefined, // release promise
                    status: 'fulfilled',
                    value,
                })
                return value
            } catch (reason) {
                Object.assign(thisCall, {
                    promise: undefined, // release promise
                    status: 'rejected',
                    reason,
                })

                throw reason
            }
        })()
        promise.catch(() => {}) // prevent unhandled
        Object.assign(thisCall, {
            status: 'pending',
            promise,
        })

        return promise
    }, {
        isStarted() {
            return currentCall.status !== 'init'
        },
        reset() {
            currentCall = { status: 'init' }
        }
    })
}

export class TimeoutError extends Error {
    timeout: number
    constructor(msg = '', timeout = 0) {
        super(`The operation timed out. ${timeout}ms. ${msg}`)
        this.timeout = timeout
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor)
        }
    }
}

/**
 * Takes a promise and a timeout and an optional message for timeout errors.
 * Returns a promise that rejects when timeout expires, or when promise settles, whichever comes first.
 *
 * Invoke with positional arguments for timeout & message:
 * await pTimeout(promise, timeout, message)
 *
 * or using an options object for timeout, message & rejectOnTimeout:
 *
 * await pTimeout(promise, { timeout, message, rejectOnTimeout })
 *
 * message and rejectOnTimeout are optional.
 */

type pTimeoutOpts = {
    timeout?: number,
    message?: string,
    rejectOnTimeout?: boolean,
}

type pTimeoutArgs = [timeout?: number, message?: string] | [pTimeoutOpts]

export async function pTimeout<T>(promise: Promise<T>, ...args: pTimeoutArgs): Promise<T | undefined> {
    let opts: pTimeoutOpts = {}
    if (args[0] && typeof args[0] === 'object') {
        [opts] = args
    } else {
        [opts.timeout, opts.message] = args
    }

    const { timeout = 0, message = '', rejectOnTimeout = true } = opts

    if (typeof timeout !== 'number') {
        throw new Error(`timeout must be a number, got ${inspect(timeout)}`)
    }

    let timedOut = false
    const p = Defer<T>()
    const t = setTimeout(() => {
        timedOut = true
        if (rejectOnTimeout) {
            p.reject(new TimeoutError(message, timeout))
        } else {
            p.resolve(undefined)
        }
    }, timeout)
    p.catch(() => {})

    return Promise.race([
        Promise.resolve(promise).catch((err) => {
            clearTimeout(t)
            if (timedOut) {
                // ignore errors after timeout
                return undefined
            }

            throw err
        }),
        p
    ]).finally(() => {
        clearTimeout(t)
        p.resolve(undefined)
    })
}

/**
 * Convert allSettled results into a thrown Aggregate error if necessary.
 */

export async function allSettledValues(items: Parameters<(typeof Promise)['allSettled']>[0], errorMessage = '') {
    const result = await Promise.allSettled(items)
    const errs = result
        .filter(({ status }) => status === 'rejected')
        .map((v) => (v as PromiseRejectedResult).reason)
    if (errs.length) {
        throw new AggregatedError(errs, errorMessage)
    }

    return result
        .map((v) => (v as PromiseFulfilledResult<unknown>).value)
}

export async function sleep(ms: number = 0) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms)
    })
}

/**
 * Wait until a condition is true
 * @param condition - wait until this callback function returns true
 * @param timeOutMs - stop waiting after that many milliseconds, -1 for disable
 * @param pollingIntervalMs - check condition between so many milliseconds
 * @param failedMsgFn - append the string return value of this getter function to the error message, if given
 * @return the (last) truthy value returned by the condition function
 */
export async function until(condition: MaybeAsync<() => boolean>, timeOutMs = 10000, pollingIntervalMs = 100, failedMsgFn?: () => string) {
    // condition could as well return any instead of boolean, could be convenient
    // sometimes if waiting until a value is returned. Maybe change if such use
    // case emerges.
    const err = new Error(`Timeout after ${timeOutMs} milliseconds`)
    let isTimedOut = false
    let t!: ReturnType<typeof setTimeout>
    if (timeOutMs > 0) {
        t = setTimeout(() => { isTimedOut = true }, timeOutMs)
    }

    try {
        // Promise wrapped condition function works for normal functions just the same as Promises
        let wasDone = false
        while (!wasDone && !isTimedOut) { // eslint-disable-line no-await-in-loop
            wasDone = await Promise.resolve().then(condition) // eslint-disable-line no-await-in-loop
            if (!wasDone && !isTimedOut) {
                await sleep(pollingIntervalMs) // eslint-disable-line no-await-in-loop
            }
        }

        if (isTimedOut) {
            if (failedMsgFn) {
                err.message += ` ${failedMsgFn()}`
            }
            throw err
        }

        return wasDone
    } finally {
        clearTimeout(t)
    }
}

// TODO import this from a library (e.g. streamr-test-utils if that is no longer a test-only dependency)
export const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const withTimeout = async <T>(
    task: Promise<T>,
    waitTimeMs: number,
    errorMessage: string,
    onTimeout?: () => void
): Promise<void> => {
    let timeoutRef: ReturnType<typeof setTimeout>
    const timeoutPromise = new Promise((resolve, reject) => {
        timeoutRef = setTimeout(() => {
            onTimeout?.()
            reject(new Error(errorMessage))
        }, waitTimeMs)
    })
    await Promise.race([task, timeoutPromise])
    clearTimeout(timeoutRef!)
}

export function formStorageNodeAssignmentStreamId(clusterAddress: EthereumAddress): StreamID {
    return toStreamID('/assignments', clusterAddress)
}
