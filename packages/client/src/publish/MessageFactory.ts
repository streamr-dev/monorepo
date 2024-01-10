import random from 'lodash/random'
import {
    createSignaturePayload,
    EncryptedGroupKey,
    EncryptionType,
    MessageID,
    MessageRef,
    SignatureType,
    StreamID,
    StreamMessage,
    StreamMessageOptions,
    ContentType
} from '@streamr/protocol'
import { EncryptionUtil } from '../encryption/EncryptionUtil'
import { createMessageRef, createRandomMsgChainId } from './messageChain'
import { PublishMetadata } from './Publisher'
import { keyToArrayIndex, utf8ToBinary } from '@streamr/utils'
import { GroupKeyQueue } from './GroupKeyQueue'
import { Mapping } from '../utils/Mapping'
import { Authentication } from '../Authentication'
import { StreamRegistry } from '../registry/StreamRegistry'
import { formLookupKey } from '../utils/utils'
import { StreamrClientError } from '../StreamrClientError'

export interface MessageFactoryOptions {
    streamId: StreamID
    authentication: Authentication
    streamRegistry: Pick<StreamRegistry, 'getStream' | 'hasPublicSubscribePermission' | 'isStreamPublisher' | 'clearStreamCache'>
    groupKeyQueue: GroupKeyQueue
}

export const createSignedMessage = async (
    opts: Omit<StreamMessageOptions, 'signature'> & { authentication: Authentication }
): Promise<StreamMessage> => {
    const signature = await opts.authentication.createMessageSignature(createSignaturePayload({
        messageId: opts.messageId,
        content: opts.content,
        signatureType: opts.signatureType,
        encryptionType: opts.encryptionType || EncryptionType.NONE,
        prevMsgRef: opts.prevMsgRef ?? undefined,
        newGroupKey: opts.newGroupKey ?? undefined
    }))
    return new StreamMessage({
        ...opts,
        signature,
        content: opts.content
    })
}

export class MessageFactory {

    private readonly streamId: StreamID
    private readonly authentication: Authentication
    private defaultPartition: number | undefined
    private readonly defaultMessageChainIds: Mapping<[partition: number], string>
    private readonly prevMsgRefs: Map<string, MessageRef> = new Map()
    private readonly streamRegistry: Pick<StreamRegistry, 'getStream' | 'hasPublicSubscribePermission' | 'isStreamPublisher' | 'clearStreamCache'>
    private readonly groupKeyQueue: GroupKeyQueue

    constructor(opts: MessageFactoryOptions) {
        this.streamId = opts.streamId
        this.authentication = opts.authentication
        this.streamRegistry = opts.streamRegistry
        this.groupKeyQueue = opts.groupKeyQueue
        this.defaultMessageChainIds = new Mapping(async () => {
            return createRandomMsgChainId()
        })
    }

    /* eslint-disable padding-line-between-statements */
    async createMessage(
        content: unknown,
        metadata: PublishMetadata & { timestamp: number },
        explicitPartition?: number
    ): Promise<StreamMessage> {
        const publisherId = await this.authentication.getAddress()
        const isPublisher = await this.streamRegistry.isStreamPublisher(this.streamId, publisherId)
        if (!isPublisher) {
            this.streamRegistry.clearStreamCache(this.streamId)
            throw new StreamrClientError(`You don't have permission to publish to this stream. Using address: ${publisherId}`, 'MISSING_PERMISSION')
        }

        const partitionCount = (await this.streamRegistry.getStream(this.streamId)).getMetadata().partitions
        let partition
        if (explicitPartition !== undefined) {
            if ((explicitPartition < 0 || explicitPartition >= partitionCount)) {
                throw new Error(`Partition ${explicitPartition} is out of range (0..${partitionCount - 1})`)
            }
            if (metadata.partitionKey !== undefined) {
                throw new Error('Invalid combination of "partition" and "partitionKey"')
            }
            partition = explicitPartition
        } else {
            partition = (metadata.partitionKey !== undefined)
                ? keyToArrayIndex(partitionCount, metadata.partitionKey)
                : this.getDefaultPartition(partitionCount)
        }

        const msgChainId = metadata.msgChainId ?? await this.defaultMessageChainIds.get(partition)
        const msgChainKey = formLookupKey(partition, msgChainId)
        const prevMsgRef = this.prevMsgRefs.get(msgChainKey)
        const msgRef = createMessageRef(metadata.timestamp, prevMsgRef)
        this.prevMsgRefs.set(msgChainKey, msgRef)
        const messageId = new MessageID(this.streamId, partition, msgRef.timestamp, msgRef.sequenceNumber, publisherId, msgChainId)

        const encryptionType = (await this.streamRegistry.hasPublicSubscribePermission(this.streamId)) ? EncryptionType.NONE : EncryptionType.AES
        let groupKeyId: string | undefined
        let newGroupKey: EncryptedGroupKey | undefined
        let rawContent: Uint8Array
        let contentType: ContentType
        if (content instanceof Uint8Array) {
            contentType = ContentType.BINARY
            rawContent = content
        } else {
            contentType = ContentType.JSON
            rawContent = utf8ToBinary(JSON.stringify(content))
        }
        if (encryptionType === EncryptionType.AES) {
            const keySequence = await this.groupKeyQueue.useGroupKey()
            rawContent = EncryptionUtil.encryptWithAES(rawContent, keySequence.current.data)
            groupKeyId = keySequence.current.id
            if (keySequence.next !== undefined) {
                newGroupKey = keySequence.current.encryptNextGroupKey(keySequence.next)
            }
        }

        return createSignedMessage({
            messageId,
            content: rawContent,
            prevMsgRef,
            encryptionType,
            groupKeyId,
            newGroupKey,
            authentication: this.authentication,
            contentType,
            signatureType: SignatureType.NEW_SECP256K1,
        })
    }

    private getDefaultPartition(partitionCount: number): number {
        // we want to (re-)select a random partition in these two situations
        // 1) this is the first publish, and we have not yet selected any partition (the most typical case)
        // 2) the partition count may have decreased since we initially selected a random partitions, and it
        //    is now out-of-range (very rare case)
        if ((this.defaultPartition === undefined) || (this.defaultPartition >= partitionCount)) {
            this.defaultPartition = random(partitionCount - 1)
        }
        return this.defaultPartition
    }
}
