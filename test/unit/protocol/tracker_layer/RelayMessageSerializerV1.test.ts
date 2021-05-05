import assert from 'assert'

import { RelayMessage } from '../../../../src'
import TrackerMessage from '../../../../src/protocol/tracker_layer/TrackerMessage'

const VERSION = 1

// Message definitions
const message = new RelayMessage({
    requestId: 'requestId',
    originator: {
        peerId: 'peerId',
        peerName: 'peerName',
        peerType: 'node',
        controlLayerVersions: [2],
        messageLayerVersions: [32],
        location: null
    },
    targetNode: 'targetNode',
    subType: 'offer',
    data: {
        hello: 'world'
    }
})
const serializedMessage = JSON.stringify([
    VERSION,
    TrackerMessage.TYPES.RelayMessage,
    'requestId',
    {
        peerId: 'peerId',
        peerName: 'peerName',
        peerType: 'node',
        controlLayerVersions: [2],
        messageLayerVersions: [32],
        location: null
    },
    'targetNode',
    'offer',
    {
        hello: 'world'
    }
])

describe('RelayMessageSerializerV1', () => {
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
