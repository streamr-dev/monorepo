/**
 * Encrypt StreamMessages in-place.
 */
import { StreamMessage } from 'streamr-client-protocol'
import { PublisherKeyExchange } from '../encryption/PublisherKeyExchange'
import { StreamRegistryCached } from '../StreamRegistryCached'
import { scoped, Lifecycle, inject, delay } from 'tsyringe'
import { EncryptionUtil } from '../encryption/EncryptionUtil'
import { Ethereum } from '../Ethereum'

@scoped(Lifecycle.ContainerScoped)
export class Encrypt {
    private isStopped = false

    constructor(
        private streamRegistryCached: StreamRegistryCached,
        @inject(delay(() => PublisherKeyExchange)) private keyExchange: PublisherKeyExchange,
        private ethereum: Ethereum,
    ) {
    }

    async encrypt(streamMessage: StreamMessage): Promise<void> {
        if (this.isStopped) { return }

        if (StreamMessage.isEncrypted(streamMessage)) {
            // already encrypted
            return
        }

        if (!this.ethereum.canEncrypt()) {
            return
        }

        const { messageType } = streamMessage
        if (
            messageType === StreamMessage.MESSAGE_TYPES.GROUP_KEY_RESPONSE
            || messageType === StreamMessage.MESSAGE_TYPES.GROUP_KEY_REQUEST
            || messageType === StreamMessage.MESSAGE_TYPES.GROUP_KEY_ERROR_RESPONSE
        ) {
            // never encrypt
            return
        }

        if (streamMessage.messageType !== StreamMessage.MESSAGE_TYPES.MESSAGE) {
            return
        }

        const streamId = streamMessage.getStreamId()

        const isPublic = await this.streamRegistryCached.isPublic(streamId)
        if (isPublic || this.isStopped) {
            return
        }

        const [groupKey, nextGroupKey] = await this.keyExchange.useGroupKey(streamId)
        if (this.isStopped) { return }

        if (!groupKey) {
            throw new Error(`Tried to use group key but no group key found for stream: ${streamId}`)
        }

        EncryptionUtil.encryptStreamMessage(streamMessage, groupKey, nextGroupKey)
    }

    async start(): Promise<void> {
        this.isStopped = false
    }

    async stop(): Promise<void> {
        this.isStopped = true
    }
}
