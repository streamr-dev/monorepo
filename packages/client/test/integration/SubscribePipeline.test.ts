import 'reflect-metadata'
import { startPublisherNode } from './../test-utils/fake/fakePublisherNode'
import { GroupKey } from './../../src/encryption/GroupKey'
import { StreamPartID } from 'streamr-client-protocol'
import { Wallet } from '@ethersproject/wallet'
import { StreamPermission } from './../../src/permission'
import { createMockMessage } from './../test-utils/utils'
import { MessageStream } from './../../src/subscribe/MessageStream'
import { fastWallet } from "streamr-test-utils"
import { SubscribePipeline } from "../../src/subscribe/SubscribePipeline"
import { FakeEnvironment } from "../test-utils/fake/FakeEnvironment"
import { mockContext } from '../test-utils/utils'
import { collect } from '../../src/utils/GeneratorUtils'
import { StreamrClient } from '../../src/StreamrClient'

const CONTENT = {
    foo: 'bar'
}

describe('SubscribePipeline', () => {

    let pipeline: MessageStream
    let input: MessageStream
    let streamPartId: StreamPartID
    let publisher: Wallet
    let subscriber: StreamrClient
    let environment: FakeEnvironment

    beforeEach(async () => {
        environment = new FakeEnvironment()
        subscriber = environment.createClient()
        const stream = await subscriber.createStream('/path')
        streamPartId = stream.getStreamParts()[0]
        publisher = fastWallet()
        await stream.grantPermissions({
            user: publisher.address,
            permissions: [StreamPermission.PUBLISH]
        })
        const context = mockContext()
        input = new MessageStream(context)
        pipeline = SubscribePipeline(
            input,
            streamPartId,
            context,
            // @ts-expect-error private
            subscriber.container
        )
    })

    it('happy path', async () => {
        await input.push(createMockMessage({
            publisher,
            streamPartId,
            content: CONTENT
        }))
        input.endWrite()
        const output = await collect(pipeline)
        expect(output).toHaveLength(1)
        expect(output[0].getParsedContent()).toEqual(CONTENT)
    })

    it('error: invalid signature', async () => {
        const msg = createMockMessage({
            publisher,
            streamPartId,
            content: CONTENT
        })
        msg.signature = 'invalid-signature'
        await input.push(msg)
        input.endWrite()
        const onError = jest.fn()
        pipeline.onError.listen(onError)
        const output = await collect(pipeline)
        expect(onError).toBeCalledTimes(1)
        const error = onError.mock.calls[0][0]
        expect(error.message).toContain('Signature validation failed')
        expect(output).toEqual([])
    })

    it('error: invalid content', async () => {
        const msg = createMockMessage({
            publisher,
            streamPartId,
            content: '{ invalid-json'
        })
        await input.push(msg)
        input.endWrite()
        const onError = jest.fn()
        pipeline.onError.listen(onError)
        const output = await collect(pipeline)
        expect(onError).toBeCalledTimes(1)
        const error = onError.mock.calls[0][0]
        expect(error.message).toContain('Invalid JSON')
        expect(output).toEqual([])
    })

    it('error: no encryption key available', async () => {
        await startPublisherNode(publisher, [], environment)
        const encryptionKey = GroupKey.generate()
        await input.push(createMockMessage({
            publisher,
            streamPartId,
            content: CONTENT,
            encryptionKey
        }))
        input.endWrite()
        const onError = jest.fn()
        pipeline.onError.listen(onError)
        const output = await collect(pipeline)
        expect(onError).toBeCalledTimes(1)
        const error = onError.mock.calls[0][0]
        expect(error.message).toContain('Unable to decrypt')
        expect(output).toEqual([])
    })

    it('error: group key request failed', async () => {
        await startPublisherNode(publisher, [], environment, async () => 'mock-error')
        const encryptionKey = GroupKey.generate()
        await input.push(createMockMessage({
            publisher,
            streamPartId,
            content: CONTENT,
            encryptionKey
        }))
        input.endWrite()
        const onError = jest.fn()
        pipeline.onError.listen(onError)
        const output = await collect(pipeline)
        expect(onError).toBeCalledTimes(1)
        const error = onError.mock.calls[0][0]
        expect(error.message).toContain('Unable to decrypt')
        expect(output).toEqual([])
    })
})
