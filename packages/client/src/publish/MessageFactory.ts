import { random } from 'lodash'
import { EncryptedGroupKey, EncryptionType, EthereumAddress, StreamID, StreamMessage, StreamPartID, toStreamPartID } from 'streamr-client-protocol'
import { CacheConfig } from '../Config'
import { EncryptionUtil } from '../encryption/EncryptionUtil'
import { GroupKey } from '../encryption/GroupKey'
import { CacheFn } from '../utils/caches'
import { getCachedMessageChain, MessageChain } from './MessageChain'
import { MessageMetadata } from './Publisher'
import { keyToArrayIndex } from '@streamr/utils'
import { Gate } from '../utils/Gate'

export interface MessageFactoryOptions {
    streamId: StreamID
    partitionCount: number
    isPublicStream: boolean
    publisherId: EthereumAddress
    createSignature: (payload: string) => Promise<string>
    useGroupKey: () => Promise<never[] | [GroupKey | undefined, GroupKey | undefined]>
    cacheConfig?: CacheConfig
}

export class MessageFactory {

    private streamId: StreamID
    private partitionCount: number
    private selectedDefaultPartition: number
    private isPublicStream: boolean
    private publisherId: EthereumAddress
    private createSignature: (payload: string) => Promise<string>
    private useGroupKey: () => Promise<never[] | [GroupKey | undefined, GroupKey | undefined]>
    private getStreamPartitionForKey: (partitionKey: string | number) => number
    private getMsgChain: (streamPartId: StreamPartID, publisherId: EthereumAddress, msgChainId?: string) => MessageChain

    constructor(opts: MessageFactoryOptions) {
        this.streamId = opts.streamId
        this.partitionCount = opts.partitionCount
        this.selectedDefaultPartition = random(opts.partitionCount - 1)
        this.isPublicStream = opts.isPublicStream
        this.publisherId = opts.publisherId
        this.createSignature = opts.createSignature
        this.useGroupKey = opts.useGroupKey
        this.getStreamPartitionForKey = CacheFn((partitionKey: string | number) => {
            return keyToArrayIndex(opts.partitionCount, partitionKey)
        }, {
            ...opts.cacheConfig,
            cacheKey: ([partitionKey]) => partitionKey
        })
        this.getMsgChain = getCachedMessageChain(opts.cacheConfig) // TODO would it ok to just use pMemoize (we don't have many chains)
    }

    async createMessage<T>(
        content: T,
        metadata: MessageMetadata & { timestamp: number },
        explicitPartition?: number,
        previousTask?: Gate | undefined
    ): Promise<StreamMessage<T>> {
        if (explicitPartition !== undefined) {
            if ((explicitPartition < 0 || explicitPartition >= this.partitionCount)) {
                throw new Error(`Partition ${explicitPartition} is out of range (0..${this.partitionCount - 1})`)
            }
            if (metadata?.partitionKey !== undefined) { // eslint-disable-line padding-line-between-statements
                throw new Error('Invalid combination of "partition" and "partitionKey"')
            }
        }
        const partition = explicitPartition
            ?? ((metadata.partitionKey !== undefined)
                ? this.getStreamPartitionForKey(metadata.partitionKey!)
                : this.selectedDefaultPartition)
        const streamPartId = toStreamPartID(this.streamId, partition)

        await previousTask?.check() // could check the return value (but currently it it should always be true as we don't lock the gate)
        const chain = this.getMsgChain(streamPartId, this.publisherId, metadata?.msgChainId)
        const [messageId, prevMsgRef] = chain.add(metadata.timestamp)

        const encryptionType = this.isPublicStream ? StreamMessage.ENCRYPTION_TYPES.NONE : StreamMessage.ENCRYPTION_TYPES.AES
        let groupKeyId: string | undefined
        let newGroupKey: EncryptedGroupKey | undefined
        let serializedContent = JSON.stringify(content)
        if (encryptionType === EncryptionType.AES) {
            const [groupKey, nextGroupKey] = await this.useGroupKey()
            if (!groupKey) {
                throw new Error(`Tried to use group key but no group key found for stream: ${this.streamId}`)
            }
            serializedContent = EncryptionUtil.encryptWithAES(Buffer.from(serializedContent, 'utf8'), groupKey.data)
            groupKeyId = groupKey.id
            if (nextGroupKey) {
                newGroupKey = groupKey.encryptNextGroupKey(nextGroupKey)
            }
        }

        const message = new StreamMessage<any>({
            content: serializedContent,
            messageId,
            prevMsgRef,
            encryptionType,
            groupKeyId,
            newGroupKey,
            signatureType: StreamMessage.SIGNATURE_TYPES.ETH
        })
        message.signature = await this.createSignature(message.getPayloadToSign())

        return message
    }
}
