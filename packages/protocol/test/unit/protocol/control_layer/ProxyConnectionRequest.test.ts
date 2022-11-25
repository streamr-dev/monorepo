import assert from 'assert'

import ValidationError from '../../../../src/errors/ValidationError'
import { ProxyConnectionRequest, ControlMessage, toStreamID } from '../../../../src/exports'
import { ProxyDirection } from '../../../../src/utils/types'

describe('ProxyConnectionRequest', () => {
    const streamId = toStreamID('stream')
    const streamPartition = 0
    const senderId = 'node'
    const direction = ProxyDirection.PUBLISH
    const userId = 'mockUser'

    it('should create the latest version', () => {
        const msg = new ProxyConnectionRequest({
            requestId: 'requestId',
            streamId,
            streamPartition,
            direction,
            senderId,
            userId
        })
        assert(msg instanceof ProxyConnectionRequest)
        assert.strictEqual(msg.version, ControlMessage.LATEST_VERSION)
        assert.strictEqual(msg.requestId, 'requestId')
        assert.strictEqual(msg.streamId, streamId)
        assert.strictEqual(msg.streamPartition, streamPartition)
        assert.strictEqual(msg.direction, direction)
        assert.strictEqual(msg.senderId, senderId)
        assert.strictEqual(msg.userId, userId)
    })

    it('throws on null streamId', () => {
        assert.throws(() => new ProxyConnectionRequest({
            requestId: 'requestId',
            streamId: null as any,
            streamPartition,
            senderId,
            direction,
            userId
        }), ValidationError)
    })

    it('throws on null streamPartition', () => {
        assert.throws(() => new ProxyConnectionRequest({
            requestId: 'requestId',
            streamId,
            streamPartition: null as any,
            senderId,
            direction,
            userId
        }), ValidationError)
    })

    it('throws on null senderId', () => {
        assert.throws(() => new ProxyConnectionRequest({
            requestId: 'requestId',
            streamId,
            streamPartition,
            senderId: null as any,
            direction,
            userId
        }), ValidationError)
    })
})
