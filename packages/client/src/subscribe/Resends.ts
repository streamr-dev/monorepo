/**
 * Public Resends API
 */
import { inject, Lifecycle, scoped, delay } from 'tsyringe'
import { MessageRef, StreamPartID, StreamPartIDUtils, StreamMessage } from 'streamr-client-protocol'

import { instanceId, counterId } from '../utils/utils'
import { Context, ContextError } from '../utils/Context'

import { MessageStream, MessageStreamOnMessage } from './MessageStream'
import { createSubscribePipeline } from './SubscribePipeline'

import { StorageNodeRegistry } from '../registry/StorageNodeRegistry'
import { StreamIDBuilder } from '../StreamIDBuilder'
import { StreamDefinition } from '../types'
import { StreamRegistryCached } from '../registry/StreamRegistryCached'
import { random } from 'lodash'
import { ConfigInjectionToken, StrictStreamrClientConfig } from '../Config'
import { HttpUtil } from '../HttpUtil'
import { StreamStorageRegistry } from '../registry/StreamStorageRegistry'
import { EthereumAddress, wait } from '@streamr/utils'
import { GroupKeyStore } from '../encryption/GroupKeyStore'
import { SubscriberKeyExchange } from '../encryption/SubscriberKeyExchange'
import { StreamrClientEventEmitter } from '../events'
import { DestroySignal } from '../DestroySignal'

const MIN_SEQUENCE_NUMBER_VALUE = 0

type QueryDict = Record<string, string | number | boolean | null | undefined>

export type ResendRef = MessageRef | {
    timestamp: number | Date | string
    sequenceNumber?: number
}

export interface ResendLastOptions {
    last: number
}

export interface ResendFromOptions {
    from: ResendRef
    publisherId?: EthereumAddress
}

export interface ResendRangeOptions {
    from: ResendRef
    to: ResendRef
    msgChainId?: string
    publisherId?: EthereumAddress
}

export type ResendOptions = ResendLastOptions | ResendFromOptions | ResendRangeOptions

function isResendLast<T extends ResendLastOptions>(options: any): options is T {
    return options && typeof options === 'object' && 'last' in options && options.last != null
}

function isResendFrom<T extends ResendFromOptions>(options: any): options is T {
    return options && typeof options === 'object' && 'from' in options && !('to' in options) && options.from != null
}

function isResendRange<T extends ResendRangeOptions>(options: any): options is T {
    return options && typeof options === 'object' && 'from' in options && 'to' in options && options.to && options.from != null
}

@scoped(Lifecycle.ContainerScoped)
export class Resends implements Context {
    readonly id
    readonly debug
    private groupKeyStore: GroupKeyStore
    private subscriberKeyExchange: SubscriberKeyExchange
    private streamrClientEventEmitter: StreamrClientEventEmitter
    private destroySignal: DestroySignal
    private rootConfig: StrictStreamrClientConfig

    constructor(
        context: Context,
        @inject(StreamStorageRegistry) private streamStorageRegistry: StreamStorageRegistry,
        @inject(delay(() => StorageNodeRegistry)) private storageNodeRegistry: StorageNodeRegistry,
        @inject(StreamIDBuilder) private streamIdBuilder: StreamIDBuilder,
        @inject(delay(() => StreamRegistryCached)) private streamRegistryCached: StreamRegistryCached,
        @inject(HttpUtil) private httpUtil: HttpUtil,
        groupKeyStore: GroupKeyStore,
        subscriberKeyExchange: SubscriberKeyExchange,
        streamrClientEventEmitter: StreamrClientEventEmitter,
        destroySignal: DestroySignal,
        @inject(ConfigInjectionToken.Root) rootConfig: StrictStreamrClientConfig
    ) {
        this.id = instanceId(this)
        this.debug = context.debug.extend(this.id)
        this.groupKeyStore = groupKeyStore
        this.subscriberKeyExchange = subscriberKeyExchange
        this.streamrClientEventEmitter = streamrClientEventEmitter
        this.destroySignal = destroySignal
        this.rootConfig = rootConfig
    }

    async resend<T>(
        streamDefinition: StreamDefinition,
        options: ResendOptions,
        onMessage?: MessageStreamOnMessage<T>
    ): Promise<MessageStream<T>> {
        const streamPartId = await this.streamIdBuilder.toStreamPartID(streamDefinition)

        const sub = await this.resendMessages<T>(streamPartId, options)

        if (onMessage) {
            sub.useLegacyOnMessageHandler(onMessage)
        }

        return sub
    }

    private resendMessages<T>(streamPartId: StreamPartID, options: ResendOptions): Promise<MessageStream<T>> {
        if (isResendLast(options)) {
            return this.last<T>(streamPartId, {
                count: options.last,
            })
        }

        if (isResendRange(options)) {
            return this.range<T>(streamPartId, {
                fromTimestamp: new Date(options.from.timestamp).getTime(),
                fromSequenceNumber: options.from.sequenceNumber,
                toTimestamp: new Date(options.to.timestamp).getTime(),
                toSequenceNumber: options.to.sequenceNumber,
                publisherId: options.publisherId,
                msgChainId: options.msgChainId,
            })
        }

        if (isResendFrom(options)) {
            return this.from<T>(streamPartId, {
                fromTimestamp: new Date(options.from.timestamp).getTime(),
                fromSequenceNumber: options.from.sequenceNumber,
                publisherId: options.publisherId,
            })
        }

        throw new ContextError(this, `can not resend without valid resend options: ${JSON.stringify({ streamPartId, options })}`)
    }

    private async fetchStream<T>(
        endpointSuffix: 'last' | 'range' | 'from',
        streamPartId: StreamPartID,
        query: QueryDict = {}
    ) {
        const debug = this.debug.extend(counterId(`resend-${endpointSuffix}`))
        debug('fetching resend %s %s %o', endpointSuffix, streamPartId, query)
        const nodeAddresses = await this.streamStorageRegistry.getStorageNodes(StreamPartIDUtils.getStreamID(streamPartId))
        if (!nodeAddresses.length) {
            const err = new ContextError(this, `no storage assigned: ${streamPartId}`)
            err.code = 'NO_STORAGE_NODES'
            throw err
        }

        const nodeAddress = nodeAddresses[random(0, nodeAddresses.length - 1)]
        const nodeUrl = (await this.storageNodeRegistry.getStorageNodeMetadata(nodeAddress)).http
        const url = this.createUrl(nodeUrl, endpointSuffix, streamPartId, query)
        const messageStream = createSubscribePipeline<T>({
            messageStream: new MessageStream<T>(this),
            streamPartId,
            context: this,
            resends: this,
            groupKeyStore: this.groupKeyStore,
            subscriberKeyExchange: this.subscriberKeyExchange,
            streamRegistryCached: this.streamRegistryCached,
            streamrClientEventEmitter: this.streamrClientEventEmitter,
            destroySignal: this.destroySignal,
            rootConfig: this.rootConfig
        })

        let count = 0
        messageStream.forEach(() => {
            count += 1
        })

        const dataStream = await this.httpUtil.fetchHttpStream(url)
        messageStream.pull((async function* readStream() {
            try {
                yield* dataStream
            } finally {
                debug('resent %s messages.', count)
                dataStream.destroy()
            }
        }()))
        return messageStream
    }

    private async last<T>(streamPartId: StreamPartID, { count }: { count: number }): Promise<MessageStream<T>> {
        if (count <= 0) {
            const emptyStream = new MessageStream<T>(this)
            emptyStream.endWrite()
            return emptyStream
        }

        return this.fetchStream('last', streamPartId, {
            count,
        })
    }

    private async from<T>(streamPartId: StreamPartID, {
        fromTimestamp,
        fromSequenceNumber = MIN_SEQUENCE_NUMBER_VALUE,
        publisherId
    }: {
        fromTimestamp: number
        fromSequenceNumber?: number
        publisherId?: EthereumAddress
    }): Promise<MessageStream<T>> {
        return this.fetchStream('from', streamPartId, {
            fromTimestamp,
            fromSequenceNumber,
            publisherId,
        })
    }

    async range<T>(streamPartId: StreamPartID, {
        fromTimestamp,
        fromSequenceNumber = MIN_SEQUENCE_NUMBER_VALUE,
        toTimestamp,
        toSequenceNumber = MIN_SEQUENCE_NUMBER_VALUE,
        publisherId,
        msgChainId
    }: {
        fromTimestamp: number
        fromSequenceNumber?: number
        toTimestamp: number
        toSequenceNumber?: number
        publisherId?: EthereumAddress
        msgChainId?: string
    }): Promise<MessageStream<T>> {
        return this.fetchStream('range', streamPartId, {
            fromTimestamp,
            fromSequenceNumber,
            toTimestamp,
            toSequenceNumber,
            publisherId,
            msgChainId,
        })
    }

    async waitForStorage(streamMessage: StreamMessage, {
        // eslint-disable-next-line no-underscore-dangle
        interval = this.rootConfig._timeouts.storageNode.retryInterval,
        // eslint-disable-next-line no-underscore-dangle
        timeout = this.rootConfig._timeouts.storageNode.timeout,
        count = 100,
        messageMatchFn = (msgTarget: StreamMessage, msgGot: StreamMessage) => {
            return msgTarget.signature === msgGot.signature
        }
    }: {
        interval?: number
        timeout?: number
        count?: number
        messageMatchFn?: (msgTarget: StreamMessage, msgGot: StreamMessage) => boolean
    } = {}): Promise<void> {
        if (!streamMessage) {
            throw new ContextError(this, 'waitForStorage requires a StreamMessage')
        }

        const [streamId, partition] = StreamPartIDUtils.getStreamIDAndPartition(streamMessage.getStreamPartID())
        const streamDefinition = { streamId, partition }

        const start = Date.now()
        let last: StreamMessage[]
        let found = false
        while (!found) {
            const duration = Date.now() - start
            if (duration > timeout) {
                this.debug('waitForStorage timeout %o', {
                    timeout,
                    duration
                }, {
                    streamMessage,
                    last: last!.map((l: any) => l.content),
                })
                const err: any = new Error(`timed out after ${duration}ms waiting for message`)
                err.streamMessage = streamMessage
                throw err
            }

            const resendStream = await this.resend(streamDefinition, { last: count })
            last = await resendStream.collect()
            for (const lastMsg of last) {
                if (messageMatchFn(streamMessage, lastMsg)) {
                    found = true
                    this.debug('last message found')
                    return
                }
            }

            this.debug('message not found, retrying... %o', {
                msg: streamMessage.getParsedContent(),
                'last 3': last.slice(-3).map(({ content }: any) => content)
            })

            await wait(interval)
        }
        /* eslint-enable no-await-in-loop */
    }

    private createUrl(baseUrl: string, endpointSuffix: string, streamPartId: StreamPartID, query: QueryDict = {}): string {
        const queryMap = {
            ...query,
            format: 'raw'
        }
        const [streamId, streamPartition] = StreamPartIDUtils.getStreamIDAndPartition(streamPartId)
        const queryString = this.httpUtil.createQueryString(queryMap)
        return `${baseUrl}/streams/${encodeURIComponent(streamId)}/data/partitions/${streamPartition}/${endpointSuffix}?${queryString}`
    }
}
