import assert from 'assert'

import { UnsubscribeRequest, ControlMessage, toStreamID } from '../../../../src/index'

const VERSION = 2

// Message definitions
const message = new UnsubscribeRequest({
    version: VERSION,
    requestId: 'requestId',
    streamId: toStreamID('streamId'),
    streamPartition: 0,
})
const serializedMessage = JSON.stringify([VERSION, ControlMessage.TYPES.UnsubscribeRequest, 'requestId', 'streamId', 0])

describe('UnsubscribeRequestSerializerV2', () => {
    describe('deserialize', () => {
        it('correctly parses messages', () => {
            assert.deepStrictEqual(ControlMessage.deserialize(serializedMessage), message)
        })
    })
    describe('serialize', () => {
        it('correctly serializes messages', () => {
            assert.deepStrictEqual(message.serialize(VERSION), serializedMessage)
        })
    })
})
