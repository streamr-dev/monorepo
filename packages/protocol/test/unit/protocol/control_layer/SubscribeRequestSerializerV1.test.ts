import assert from 'assert'

import { SubscribeRequest, ControlMessage, toStreamID } from '../../../../src/index'
import { PLACEHOLDER_REQUEST_ID_PROTOCOL_V1 } from '../../../../src/protocol/control_layer/ControlMessage'

const VERSION = 1

// Message definitions
const message = new SubscribeRequest({
    version: VERSION,
    streamId: toStreamID('streamId'),
    streamPartition: 0,
    sessionToken: 'sessionToken',
    requestId: PLACEHOLDER_REQUEST_ID_PROTOCOL_V1
})
const serializedMessage = JSON.stringify([VERSION, ControlMessage.TYPES.SubscribeRequest, 'streamId', 0, 'sessionToken'])

describe('SubscribeRequestSerializerV1', () => {
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
