import assert from 'assert'

import { SubscribeResponse, ControlMessage, toStreamID } from '../../../../src/index'

const VERSION = 2

// Message definitions
const message = new SubscribeResponse({
    version: VERSION,
    requestId: 'requestId',
    streamId: toStreamID('streamId'),
    streamPartition: 0,
})
const serializedMessage = JSON.stringify([VERSION, ControlMessage.TYPES.SubscribeResponse, 'requestId', 'streamId', 0])

describe('SubscribeResponseSerializerV2', () => {
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
