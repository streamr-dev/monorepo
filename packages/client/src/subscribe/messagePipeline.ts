/**
 * Subscription message processing pipeline
 */
import {
    StreamID,
    StreamMessage,
    StreamMessageError,
    StreamPartID
} from '@streamr/protocol'
import { EthereumAddress } from '@streamr/utils'
import { StrictStreamrClientConfig } from '../Config'
import { DestroySignal } from '../DestroySignal'
import { GroupKeyManager } from '../encryption/GroupKeyManager'
import { decrypt } from '../encryption/decrypt'
import { StreamRegistry } from '../registry/StreamRegistry'
import { LoggerFactory } from '../utils/LoggerFactory'
import { PushPipeline } from '../utils/PushPipeline'
import { validateStreamMessage } from '../utils/validateStreamMessage'
import { MsgChainUtil } from './MsgChainUtil'
import { Resends } from './Resends'
import { OrderMessages } from './ordering/OrderMessages'

export interface MessagePipelineOptions {
    streamPartId: StreamPartID
    getStorageNodes: (streamId: StreamID) => Promise<EthereumAddress[]>
    resends: Resends
    streamRegistry: StreamRegistry
    groupKeyManager: GroupKeyManager
    // eslint-disable-next-line max-len
    config: Pick<StrictStreamrClientConfig, 'orderMessages' | 'gapFillTimeout' | 'retryResendAfter' | 'maxGapRequests' | 'gapFill' | 'gapFillStrategy'>
    destroySignal: DestroySignal
    loggerFactory: LoggerFactory
}

export const createMessagePipeline = (opts: MessagePipelineOptions): PushPipeline<StreamMessage, StreamMessage> => {

    const logger = opts.loggerFactory.createLogger(module)

    /* eslint-enable object-curly-newline */

    const onError = (error: Error | StreamMessageError, streamMessage?: StreamMessage) => {
        if (streamMessage) {
            ignoreMessages.add(streamMessage)
        }

        if (error && 'streamMessage' in error && error.streamMessage) {
            ignoreMessages.add(error.streamMessage)
        }

        throw error
    }

    const messageStream = new PushPipeline<StreamMessage, StreamMessage>
    const msgChainUtil = new MsgChainUtil(async (msg) => {
        await validateStreamMessage(msg, opts.streamRegistry)
        let decrypted
        if (StreamMessage.isAESEncrypted(msg)) {
            try {
                decrypted = await decrypt(msg, opts.groupKeyManager, opts.destroySignal)
            } catch (err) {
                // TODO log this in onError? if we want to log all errors?
                logger.debug('Failed to decrypt', { messageId: msg.messageId, err })
                // clear cached permissions if cannot decrypt, likely permissions need updating
                opts.streamRegistry.clearStreamCache(msg.getStreamId())
                throw err
            }
        } else {
            decrypted = msg
        }
        decrypted.getParsedContent()  // throws if content is not parsable (e.g. not valid JSON)
        return decrypted
    }, messageStream.onError)

    // collect messages that fail validation/parsing, do not push out of pipeline
    // NOTE: we let failed messages be processed and only removed at end so they don't
    // end up acting as gaps that we repeatedly try to fill.
    const ignoreMessages = new WeakSet()
    messageStream.onError.listen(onError)
    if (opts.config.orderMessages) {
        // order messages and fill gaps
        const orderMessages = new OrderMessages(
            opts.streamPartId,
            opts.getStorageNodes,
            () => {}, // TODO send some error to messageStream (NET-987)
            opts.resends,
            opts.config
        )
        messageStream.pipe(async function* (src: AsyncGenerator<StreamMessage>) {
            setImmediate(() => {
                orderMessages.addMessages(src)
            })
            yield* orderMessages
        })
        messageStream.onBeforeFinally.listen(() => {
            orderMessages.destroy()
        })
    }
    messageStream
        .pipe(async function* (src: AsyncGenerator<StreamMessage>) {
            setImmediate(async () => {
                let err: Error | undefined = undefined
                try {
                    for await (const msg of src) {
                        msgChainUtil.addMessage(msg)
                    }
                } catch (e) {
                    err = e
                }
                await msgChainUtil.flush()
                msgChainUtil.stop(err)
            })
            yield* msgChainUtil
        })
        // ignore any failed messages
        .filter((streamMessage: StreamMessage) => {
            return !ignoreMessages.has(streamMessage)
        })
    return messageStream
}
