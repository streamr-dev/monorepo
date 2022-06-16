import 'reflect-metadata'
import { DependencyContainer } from 'tsyringe'
import { Wallet } from '@ethersproject/wallet'
import { Stream } from '../../src/Stream'
import { StreamRegistry } from '../../src/registry/StreamRegistry'
import { Subscriber } from '../../src/subscribe/Subscriber'
import { addFakeNode, createFakeContainer } from '../test-utils/fake/fakeEnvironment'
import { addFakePublisherNode } from '../test-utils/fake/fakePublisherNode'
import { StreamPermission } from '../../src'
import { createMockMessage } from '../test-utils/utils'
import { GroupKey } from '../../src/encryption/GroupKey'
import { nextValue } from '../../src/utils/iterators'
import { fastWallet, waitForCondition } from 'streamr-test-utils'

const MOCK_CONTENT = { foo: 'bar' }

describe('Subscriber', () => {

    let stream: Stream
    let subscriberWallet: Wallet
    let publisherWallet: Wallet
    let dependencyContainer: DependencyContainer

    beforeEach(async () => {
        subscriberWallet = fastWallet()
        publisherWallet = fastWallet()
        dependencyContainer = createFakeContainer({
            auth: {
                privateKey: subscriberWallet.privateKey
            }
        })
        const streamRegistry = dependencyContainer.resolve(StreamRegistry)
        stream = await streamRegistry.createStream('/path')
    })

    it('without encryption', async () => {
        await stream.grantPermissions({
            permissions: [StreamPermission.PUBLISH],
            public: true
        })

        const subscriber = dependencyContainer.resolve(Subscriber)
        const sub = await subscriber.subscribe(stream.id)

        const publisherNode = addFakeNode(publisherWallet.address, dependencyContainer)
        publisherNode.publishToNode(createMockMessage({
            stream,
            publisher: publisherWallet,
            content: MOCK_CONTENT
        }))

        const receivedMessage = await nextValue(sub)
        expect(receivedMessage!.getParsedContent()).toEqual(MOCK_CONTENT)
    })

    it('with encryption', async () => {
        await stream.grantPermissions({
            permissions: [StreamPermission.PUBLISH],
            user: publisherWallet.address
        })

        const groupKey = GroupKey.generate()
        const publisherNode = await addFakePublisherNode(publisherWallet, [groupKey], dependencyContainer)

        const subscriber = dependencyContainer.resolve(Subscriber)
        const sub = await subscriber.subscribe(stream.id)

        publisherNode.publishToNode(createMockMessage({
            stream,
            publisher: publisherWallet,
            content: MOCK_CONTENT,
            encryptionKey: groupKey
        }))

        const receivedMessage = await nextValue(sub)
        expect(receivedMessage!.getParsedContent()).toEqual(MOCK_CONTENT)
    })

    it('group key response error', async () => {
        await stream.grantPermissions({
            permissions: [StreamPermission.PUBLISH],
            user: publisherWallet.address
        })
        const publisherNode = await addFakePublisherNode(
            publisherWallet,
            [],
            dependencyContainer,
            () => 'mock-error-code'
        )

        const subscriber = dependencyContainer.resolve(Subscriber)
        const sub = await subscriber.subscribe(stream.id)
        const onError = jest.fn()
        sub.on('error', onError)

        publisherNode.publishToNode(createMockMessage({
            stream,
            publisher: publisherWallet,
            content: MOCK_CONTENT,
            encryptionKey: GroupKey.generate()
        }))

        await waitForCondition(() => onError.mock.calls.length > 0)
        expect(onError.mock.calls[0][0].message).toInclude('GroupKeyErrorResponse')
    })
})
