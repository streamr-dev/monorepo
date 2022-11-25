import assert from 'assert'
import { ErrorMessage } from '../../../../src/protocol/tracker_layer/exports'

import TrackerMessage from '../../../../src/protocol/tracker_layer/TrackerMessage'

const VERSION = 2

// Message definitions
const message = new ErrorMessage({
    version: VERSION,
    requestId: 'requestId',
    errorCode: ErrorMessage.ERROR_CODES.UNKNOWN_PEER,
    targetNode: 'targetNode'
})
const serializedMessage = JSON.stringify([
    VERSION,
    TrackerMessage.TYPES.ErrorMessage,
    'requestId',
    ErrorMessage.ERROR_CODES.UNKNOWN_PEER,
    'targetNode'
])

describe('ErrorMessageSerializerV2', () => {
    describe('deserialize', () => {
        it('correctly parses messages', () => {
            assert.deepStrictEqual(TrackerMessage.deserialize(serializedMessage), message)
        })
    })
    describe('serialize', () => {
        it('correctly serializes messages', () => {
            assert.deepStrictEqual(message.serialize(VERSION), serializedMessage)
        })
    })
})
