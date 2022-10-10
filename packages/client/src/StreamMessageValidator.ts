import {
    EthereumAddress,
    GroupKeyRequest,
    GroupKeyMessage,
    StreamID,
    StreamMessage,
    StreamMessageError,
    ValidationError,
    createSignaturePayload
} from "streamr-client-protocol"
import { verify as verifyImpl } from './utils/signingUtils'

export interface StreamMetadata {
    partitions: number
}

export interface Options {
    getStream: (streamId: StreamID) => Promise<StreamMetadata>
    isPublisher: (address: EthereumAddress, streamId: StreamID) => Promise<boolean>
    isSubscriber: (address: EthereumAddress, streamId: StreamID) => Promise<boolean>
    verify?: (address: EthereumAddress, payload: string, signature: string) => boolean
}

/**
 * Validates observed StreamMessages according to protocol rules, regardless of observer.
 * Functions needed for external interactions are injected as constructor args.
 *
 * The recoverAddressFn function could be imported from eg. ethers, but it would explode the bundle size, so
 * better leave it up to whoever is the end user of this class to choose which library they use.
 *
 * Note that most checks can not be performed for unsigned messages. Checking message integrity is impossible,
 * and checking permissions would require knowing the identity of the publisher, so it can't be done here.
 *
 * TODO later: support for unsigned messages can be removed when deprecated system-wide.
 */
export default class StreamMessageValidator {
    readonly getStream: (streamId: StreamID) => Promise<StreamMetadata>
    readonly isPublisher: (address: EthereumAddress, streamId: StreamID) => Promise<boolean>
    readonly isSubscriber: (address: EthereumAddress, streamId: StreamID) => Promise<boolean>
    readonly verify: (address: EthereumAddress, payload: string, signature: string) => boolean

    /**
     * @param getStream async function(streamId): returns the metadata required for stream validation for streamId.
     *        The included fields should be at least: { partitions }
     * @param isPublisher async function(address, streamId): returns true if address is a permitted publisher on streamId
     * @param isSubscriber async function(address, streamId): returns true if address is a permitted subscriber on streamId
     * @param verify function(address, payload, signature): returns true if the address and payload match the signature.
     * The default implementation uses the native secp256k1 library on node.js and falls back to the elliptic library on browsers.
     */
    constructor({ getStream, isPublisher, isSubscriber, verify = verifyImpl }: Options) {
        StreamMessageValidator.checkInjectedFunctions(getStream, isPublisher, isSubscriber, verify)
        this.getStream = getStream
        this.isPublisher = isPublisher
        this.isSubscriber = isSubscriber
        this.verify = verify
    }

    static checkInjectedFunctions(
        getStream: (streamId: StreamID) => Promise<StreamMetadata>,
        isPublisher: (address: EthereumAddress, streamId: StreamID) => Promise<boolean>,
        isSubscriber: (address: EthereumAddress, streamId: StreamID) => Promise<boolean>,
        verify: (address: EthereumAddress, payload: string, signature: string) => boolean
    ): void | never {
        if (typeof getStream !== 'function') {
            throw new Error('getStream must be: async function(streamId): returns the validation metadata object for streamId')
        }

        if (typeof isPublisher !== 'function') {
            throw new Error('isPublisher must be: async function(address, streamId): returns true if address is a permitted publisher on streamId')
        }

        if (typeof isSubscriber !== 'function') {
            throw new Error('isSubscriber must be: async function(address, streamId): returns true if address is a permitted subscriber on streamId')
        }

        if (typeof verify !== 'function') {
            throw new Error('verify must be: function(address, payload, signature): returns true if the address and payload match the signature')
        }
    }

    /**
     * Checks that the given StreamMessage is satisfies the requirements of the protocol.
     * This includes checking permissions as well as signature. The method supports all
     * message types defined by the protocol.
     *
     * Resolves the promise if the message is valid, rejects otherwise.
     *
     * @param streamMessage the StreamMessage to validate.
     */
    async validate(streamMessage: StreamMessage): Promise<void> {
        if (!streamMessage) {
            throw new ValidationError('Falsey argument passed to validate()!')
        }

        switch (streamMessage.messageType) {
            case StreamMessage.MESSAGE_TYPES.MESSAGE:
                return this.validateMessage(streamMessage)
            case StreamMessage.MESSAGE_TYPES.GROUP_KEY_REQUEST:
                return this.validateGroupKeyRequest(streamMessage)
            case StreamMessage.MESSAGE_TYPES.GROUP_KEY_RESPONSE:
                return this.validateGroupKeyResponse(streamMessage)
            default:
                throw new StreamMessageError(`Unknown message type: ${streamMessage.messageType}!`, streamMessage)
        }
    }

    /**
     * Checks that the signature in the given StreamMessage is cryptographically valid.
     * Resolves if valid, rejects otherwise.
     *
     * It's left up to the user of this method to decide which implementation to pass in as the verifyFn.
     *
     * @param streamMessage the StreamMessage to validate.
     * @param verifyFn function(address, payload, signature): return true if the address and payload match the signature
     */
    static async assertSignatureIsValid(
        streamMessage: StreamMessage,
        verifyFn: (address: EthereumAddress, payload: string, signature: string) => boolean
    ): Promise<void> {
        const payload = createSignaturePayload({
            signatureType: streamMessage.signatureType,
            messageId: streamMessage.getMessageID(),
            serializedContent: streamMessage.getSerializedContent(),
            prevMsgRef: streamMessage.prevMsgRef ?? undefined,
            newGroupKey: streamMessage.newGroupKey ?? undefined
        }) 

        if (streamMessage.signatureType === StreamMessage.SIGNATURE_TYPES.ETH) {
            let success
            try {
                success = verifyFn(streamMessage.getPublisherId(), payload, streamMessage.signature!)
            } catch (err) {
                throw new StreamMessageError(`An error occurred during address recovery from signature: ${err}`, streamMessage)
            }

            if (!success) {
                throw new StreamMessageError('Signature validation failed', streamMessage)
            }
        } else {
            // We should never end up here, as StreamMessage construction throws if the signature type is invalid
            throw new StreamMessageError(`Unrecognized signature type: ${streamMessage.signatureType}`, streamMessage)
        }
    }

    private async validateMessage(streamMessage: StreamMessage): Promise<void> {
        const stream = await this.getStream(streamMessage.getStreamId())

        // Checks against stream metadata
        if (!streamMessage.signature) {
            throw new StreamMessageError('Stream data is required to be signed.', streamMessage)
        }

        if (streamMessage.getStreamPartition() < 0 || streamMessage.getStreamPartition() >= stream.partitions) {
            throw new StreamMessageError(
                `Partition ${streamMessage.getStreamPartition()} is out of range (0..${stream.partitions - 1})`,
                streamMessage
            )
        }

        if (streamMessage.signature) {
            // Cryptographic integrity and publisher permission checks. Note that only signed messages can be validated this way.
            await StreamMessageValidator.assertSignatureIsValid(streamMessage, this.verify)
            const sender = streamMessage.getPublisherId()
            // Check that the sender of the message is a valid publisher of the stream
            const senderIsPublisher = await this.isPublisher(sender, streamMessage.getStreamId())
            if (!senderIsPublisher) {
                throw new StreamMessageError(`${sender} is not a publisher on stream ${streamMessage.getStreamId()}.`, streamMessage)
            }
        }
    }

    private async validateGroupKeyRequest(streamMessage: StreamMessage): Promise<void> {
        if (!streamMessage.signature) {
            throw new StreamMessageError(`Received unsigned group key request (the public key must be signed to avoid MitM attacks).`, streamMessage)
        }

        const groupKeyRequest = GroupKeyRequest.fromStreamMessage(streamMessage)
        const sender = streamMessage.getPublisherId()
        const streamId = streamMessage.getStreamId()
        const recipient = groupKeyRequest.recipient

        await StreamMessageValidator.assertSignatureIsValid(streamMessage, this.verify)

        // Check that the recipient of the request is a valid publisher of the stream
        const recipientIsPublisher = await this.isPublisher(recipient!, streamId)
        if (!recipientIsPublisher) {
            throw new StreamMessageError(`${recipient} is not a publisher on stream ${streamId}.`, streamMessage)
        }

        // Check that the sender of the request is a valid subscriber of the stream
        const senderIsSubscriber = await this.isSubscriber(sender, streamId)
        if (!senderIsSubscriber) {
            throw new StreamMessageError(`${sender} is not a subscriber on stream ${streamId}.`, streamMessage)
        }
    }

    private async validateGroupKeyResponse(streamMessage: StreamMessage): Promise<void> {
        if (!streamMessage.signature) {
            throw new StreamMessageError(`Received unsigned ${streamMessage.messageType} (it must be signed to avoid MitM attacks).`, streamMessage)
        }

        await StreamMessageValidator.assertSignatureIsValid(streamMessage, this.verify)

        const groupKeyMessage = GroupKeyMessage.fromStreamMessage(streamMessage) // only streamId is read
        const sender = streamMessage.getPublisherId()
        const streamId = streamMessage.getStreamId()
        const recipient = groupKeyMessage.recipient

        // Check that the sender of the request is a valid publisher of the stream
        const senderIsPublisher = await this.isPublisher(sender, streamId)
        if (!senderIsPublisher) {
            throw new StreamMessageError(
                `${sender} is not a publisher on stream ${streamId}. ${streamMessage.messageType}`,
                streamMessage
            )
        }

        // permit publishers to send error responses to invalid subscribers
        // Check that the recipient of the request is a valid subscriber of the stream
        const recipientIsSubscriber = await this.isSubscriber(recipient!, streamId)
        if (!recipientIsSubscriber) {
            throw new StreamMessageError(
                `${recipient} is not a subscriber on stream ${streamId}. ${streamMessage.messageType}`,
                streamMessage
            )
        }
    }
}
