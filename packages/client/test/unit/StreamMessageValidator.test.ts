import assert from 'assert'

import {
    toStreamID,
    EthereumAddress,
    StreamMessage,
    MessageID,
    GroupKeyMessage,
    MessageRef,
    EncryptedGroupKey,
    GroupKeyRequest,
    GroupKeyResponse,
    ValidationError
} from 'streamr-client-protocol'
import StreamMessageValidator, { StreamMetadata } from '../../src/StreamMessageValidator'
import { sign as nonWrappedSign } from '../../src/utils/signingUtils'

const groupKeyMessageToStreamMessage = (groupKeyMessage: GroupKeyMessage, messageId: MessageID, prevMsgRef: MessageRef | null): StreamMessage => {
    return new StreamMessage({
        messageId,
        prevMsgRef,
        content: groupKeyMessage.serialize(),
        messageType: groupKeyMessage.messageType,
    })
}

describe('StreamMessageValidator', () => {
    let getStream: (streamId: string) => Promise<StreamMetadata>
    let isPublisher: (address: EthereumAddress, streamId: string) => Promise<boolean>
    let isSubscriber: (address: EthereumAddress, streamId: string) => Promise<boolean>
    let verify: ((address: EthereumAddress, payload: string, signature: string) => boolean) | undefined
    let msg: StreamMessage
    let msgWithNewGroupKey: StreamMessage
    let msgWithPrevMsgRef: StreamMessage

    const publisherPrivateKey = 'd462a6f2ccd995a346a841d110e8c6954930a1c22851c0032d3116d8ccd2296a'
    const publisher = '0x6807295093ac5da6fb2a10f7dedc5edd620804fb'
    const subscriberPrivateKey = '81fe39ed83c4ab997f64564d0c5a630e34c621ad9bbe51ad2754fac575fc0c46'
    const subscriber = '0xbe0ab87a1f5b09afe9101b09e3c86fd8f4162527'

    let groupKeyRequest: StreamMessage
    let groupKeyResponse: StreamMessage

    const defaultGetStreamResponse = {
        partitions: 10
    }

    const getValidator = (customConfig?: any) => {
        if (customConfig) {
            return new StreamMessageValidator(customConfig)
        } else {
            return new StreamMessageValidator({
                getStream, isPublisher, isSubscriber, verify
            })
        }
    }

    /* eslint-disable */
    const sign = (msgToSign: StreamMessage, privateKey: string) => {
        msgToSign.signature = nonWrappedSign(msgToSign.getPayloadToSign(StreamMessage.SIGNATURE_TYPES.ETH), privateKey)
    }
    /* eslint-enable */

    beforeEach(async () => {
        // Default stubs
        getStream = jest.fn().mockResolvedValue(defaultGetStreamResponse)
        isPublisher = async (address: EthereumAddress, streamId: string) => {
            return address === publisher && streamId === 'streamId'
        }
        isSubscriber = async (address: EthereumAddress, streamId: string) => {
            return address === subscriber && streamId === 'streamId'
        }
        verify = undefined // use default impl by default

        msg = new StreamMessage({
            messageId: new MessageID(toStreamID('streamId'), 0, 0, 0, publisher, 'msgChainId'),
            content: '{}',
        })

        sign(msg, publisherPrivateKey)

        msgWithNewGroupKey = new StreamMessage({
            messageId: new MessageID(toStreamID('streamId'), 0, 0, 0, publisher, 'msgChainId'),
            content: '{}',
            newGroupKey: new EncryptedGroupKey('groupKeyId', 'encryptedGroupKeyHex')
        })
        sign(msgWithNewGroupKey, publisherPrivateKey)
        assert.notStrictEqual(msg.signature, msgWithNewGroupKey.signature)

        msgWithPrevMsgRef = new StreamMessage({
            messageId: new MessageID(toStreamID('streamId'), 0, 2000, 0, publisher, 'msgChainId'),
            content: '{}',
            prevMsgRef: new MessageRef(1000, 0)
        })
        sign(msgWithPrevMsgRef, publisherPrivateKey)
        assert.notStrictEqual(msg.signature, msgWithPrevMsgRef.signature)

        groupKeyRequest = groupKeyMessageToStreamMessage(new GroupKeyRequest({
            requestId: 'requestId',
            streamId: toStreamID('streamId'),
            rsaPublicKey: 'rsaPublicKey',
            groupKeyIds: ['groupKeyId1', 'groupKeyId2'],
        }), new MessageID(toStreamID(`SYSTEM/keyexchange/${publisher.toLowerCase()}`), 0, 0, 0, subscriber, 'msgChainId'), null)
        sign(groupKeyRequest, subscriberPrivateKey)

        groupKeyResponse = groupKeyMessageToStreamMessage(new GroupKeyResponse({
            requestId: 'requestId',
            streamId: toStreamID('streamId'),
            encryptedGroupKeys: [
                new EncryptedGroupKey('groupKeyId1', 'encryptedKey1'),
                new EncryptedGroupKey('groupKeyId2', 'encryptedKey2')
            ],
        }), new MessageID(toStreamID(`SYSTEM/keyexchange/${subscriber.toLowerCase()}`), 0, 0, 0, publisher, 'msgChainId'), null)
        sign(groupKeyResponse, publisherPrivateKey)
    })

    describe('validate(unknown message type)', () => {
        it('throws on unknown message type', async () => {
            msg.messageType = 666
            await assert.rejects(getValidator().validate(msg), (err: Error) => {
                assert(err instanceof ValidationError, `Unexpected error thrown: ${err}`)
                return true
            })
        })
    })

    describe('validate(message)', () => {
        it('accepts valid messages', async () => {
            await getValidator().validate(msg)
        })

        it('accepts valid messages with a new group key', async () => {
            await getValidator().validate(msgWithNewGroupKey)
        })

        it('accepts valid messages with previous message reference', async () => {
            await getValidator().validate(msgWithPrevMsgRef)
        })

        it('rejects unsigned messages', async () => {
            msg.signature = null
            msg.signatureType = StreamMessage.SIGNATURE_TYPES.NONE

            await assert.rejects(getValidator().validate(msg), (err: Error) => {
                assert(err instanceof ValidationError, `Unexpected error thrown: ${err}`)
                expect(getStream).toHaveBeenCalledWith(msg.getStreamId())
                return true
            })
        })

        it('rejects invalid signatures', async () => {
            msg.signature = msg.signature!.replace('a', 'b')

            await assert.rejects(getValidator().validate(msg), (err: Error) => {
                assert(err instanceof ValidationError, `Unexpected error thrown: ${err}`)
                return true
            })
        })

        it('rejects tampered content', async () => {
            msg.serializedContent = '{"attack":true}'

            await assert.rejects(getValidator().validate(msg), (err: Error) => {
                assert(err instanceof ValidationError, `Unexpected error thrown: ${err}`)
                return true
            })
        })

        it('rejects tampered newGroupKey', async () => {
            msgWithNewGroupKey.newGroupKey!.groupKeyId = 'foo'

            await assert.rejects(getValidator().validate(msgWithNewGroupKey), (err: Error) => {
                assert(err instanceof ValidationError, `Unexpected error thrown: ${err}`)
                return true
            })
        })

        it('rejects messages from unpermitted publishers', async () => {
            isPublisher = jest.fn().mockResolvedValue(false)

            await assert.rejects(getValidator().validate(msg), (err: Error) => {
                assert(err instanceof ValidationError, `Unexpected error thrown: ${err}`)
                expect(isPublisher).toHaveBeenCalledWith(msg.getPublisherId(), msg.getStreamId())
                return true
            })
        })

        it('rejects messages with unknown signature type', async () => {
            msg.signatureType = 666
            await assert.rejects(getValidator().validate(msg))
        })

        it('rejects if getStream rejects', async () => {
            msg.signature = null
            msg.signatureType = StreamMessage.SIGNATURE_TYPES.NONE
            const testError = new Error('test error')
            getStream = jest.fn().mockRejectedValue(testError)

            await assert.rejects(getValidator().validate(msg), (err: Error) => {
                assert(err === testError)
                return true
            })
        })

        it('rejects if isPublisher rejects', async () => {
            const testError = new Error('test error')
            isPublisher = jest.fn().mockRejectedValue(testError)
            await assert.rejects(getValidator().validate(msg), (err: Error) => {
                assert(err === testError)
                return true
            })
        })

        it('rejects with ValidationError if verify throws', async () => {
            const testError = new Error('test error')
            verify = jest.fn().mockImplementation(() => {
                throw testError
            })
            await assert.rejects(getValidator().validate(msg), (err: Error) => {
                assert(err instanceof ValidationError, `Unexpected error thrown: ${err}`)
                return true
            })
        })
    })

    describe('validate(group key request)', () => {
        it('accepts valid group key requests', async () => {
            await getValidator().validate(groupKeyRequest)
        })

        it('rejects unsigned group key requests', async () => {
            groupKeyRequest.signature = null
            groupKeyRequest.signatureType = StreamMessage.SIGNATURE_TYPES.NONE

            await assert.rejects(getValidator().validate(groupKeyRequest), (err: Error) => {
                assert(err instanceof ValidationError, `Unexpected error thrown: ${err}`)
                return true
            })
        })

        it('rejects group key requests on unexpected streams', async () => {
            groupKeyRequest.getStreamId = jest.fn().mockReturnValue('foo')

            await assert.rejects(getValidator().validate(groupKeyRequest), (err: Error) => {
                assert(err instanceof ValidationError, `Unexpected error thrown: ${err}`)
                return true
            })
        })

        it('rejects invalid signatures', async () => {
            groupKeyRequest.signature = groupKeyRequest.signature!.replace('a', 'b')

            await assert.rejects(getValidator().validate(groupKeyRequest), (err: Error) => {
                assert(err instanceof ValidationError, `Unexpected error thrown: ${err}`)
                return true
            })
        })

        it('rejects messages to invalid publishers', async () => {
            isPublisher = jest.fn().mockResolvedValue(false)

            await assert.rejects(getValidator().validate(groupKeyRequest), (err: Error) => {
                assert(err instanceof ValidationError, `Unexpected error thrown: ${err}`)
                expect(isPublisher).toHaveBeenCalledWith(publisher, 'streamId')
                return true
            })
        })

        it('rejects messages from unpermitted subscribers', async () => {
            isSubscriber = jest.fn().mockResolvedValue(false)

            await assert.rejects(getValidator().validate(groupKeyRequest), (err: Error) => {
                assert(err instanceof ValidationError, `Unexpected error thrown: ${err}`)
                expect(isSubscriber).toHaveBeenCalledWith(subscriber, 'streamId')
                return true
            })
        })

        it('rejects if isPublisher rejects', async () => {
            const testError = new Error('test error')
            isPublisher = jest.fn().mockRejectedValue(testError)
            await assert.rejects(getValidator().validate(groupKeyRequest), (err: Error) => {
                assert(err === testError)
                return true
            })
        })

        it('rejects if isSubscriber rejects', async () => {
            const testError = new Error('test error')
            isSubscriber = jest.fn().mockRejectedValue(testError)
            await assert.rejects(getValidator().validate(groupKeyRequest), (err: Error) => {
                assert(err === testError)
                return true
            })
        })

        it('rejects with ValidationError if verify throws', async () => {
            const testError = new Error('test error')
            verify = jest.fn().mockImplementation(() => {
                throw testError
            })
            await assert.rejects(getValidator().validate(groupKeyRequest), (err: Error) => {
                assert(err instanceof ValidationError, `Unexpected error thrown: ${err}`)
                return true
            })
        })
    })

    describe('validate(group key response)', () => {
        it('accepts valid group key responses', async () => {
            await getValidator().validate(groupKeyResponse)
        })

        it('rejects unsigned group key responses', async () => {
            groupKeyResponse.signature = null
            groupKeyResponse.signatureType = StreamMessage.SIGNATURE_TYPES.NONE

            await assert.rejects(getValidator().validate(groupKeyResponse), (err: Error) => {
                assert(err instanceof ValidationError, `Unexpected error thrown: ${err}`)
                return true
            })
        })

        it('rejects invalid signatures', async () => {
            groupKeyResponse.signature = groupKeyResponse.signature!.replace('a', 'b')

            await assert.rejects(getValidator().validate(groupKeyResponse), (err: Error) => {
                assert(err instanceof ValidationError, `Unexpected error thrown: ${err}`)
                return true
            })
        })

        it('rejects group key responses on unexpected streams', async () => {
            groupKeyResponse.getStreamId = jest.fn().mockReturnValue('foo')

            await assert.rejects(getValidator().validate(groupKeyResponse), (err: Error) => {
                assert(err instanceof ValidationError, `Unexpected error thrown: ${err}`)
                return true
            })
        })

        it('rejects messages from invalid publishers', async () => {
            isPublisher = jest.fn().mockResolvedValue(false)

            await assert.rejects(getValidator().validate(groupKeyResponse), (err: Error) => {
                assert(err instanceof ValidationError, `Unexpected error thrown: ${err}`)
                expect(isPublisher).toHaveBeenCalledWith(publisher, 'streamId')
                return true
            })
        })

        it('rejects messages to unpermitted subscribers', async () => {
            isSubscriber = jest.fn().mockResolvedValue(false)

            await assert.rejects(getValidator().validate(groupKeyResponse), (err: Error) => {
                assert(err instanceof ValidationError, `Unexpected error thrown: ${err}`)
                expect(isSubscriber).toHaveBeenCalledWith(subscriber, 'streamId')
                return true
            })
        })

        it('rejects if isPublisher rejects', async () => {
            const testError = new Error('test error')
            isPublisher = jest.fn().mockRejectedValue(testError)
            await assert.rejects(getValidator().validate(groupKeyResponse), (err: Error) => {
                assert(err === testError)
                return true
            })
        })

        it('rejects if isSubscriber rejects', async () => {
            const testError = new Error('test error')
            isSubscriber = jest.fn().mockRejectedValue(testError)
            await assert.rejects(getValidator().validate(groupKeyResponse), (err: Error) => {
                assert(err === testError)
                return true
            })
        })

        it('rejects with ValidationError if verify throws', async () => {
            const testError = new Error('test error')
            verify = jest.fn().mockImplementation(() => {
                throw testError
            })
            await assert.rejects(getValidator().validate(groupKeyResponse), (err: Error) => {
                assert(err instanceof ValidationError, `Unexpected error thrown: ${err}`)
                return true
            })
        })
    })
})
