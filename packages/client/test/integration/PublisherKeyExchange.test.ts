import 'reflect-metadata'

import { toEthereumAddress } from '@streamr/utils'
import { Wallet } from '@ethersproject/wallet'
import {
    ContentType,
    deserializeGroupKeyResponse,
    EncryptionType,
    StreamMessage,
    StreamMessageType,
    StreamPartID,
    StreamPartIDUtils
} from '@streamr/protocol'
import { fastWallet } from '@streamr/test-utils'
import { GroupKey } from '../../src/encryption/GroupKey'
import { StreamPermission } from '../../src/permission'
import { StreamrClient } from '../../src/StreamrClient'
import { FakeEnvironment } from '../test-utils/fake/FakeEnvironment'
import {
    createRelativeTestStreamId,
    startPublisherKeyExchangeSubscription
} from '../test-utils/utils'

describe('PublisherKeyExchange', () => {

    let publisherWallet: Wallet
    let publisherClient: StreamrClient
    let subscriberWallet: Wallet
    let streamPartId: StreamPartID
    let environment: FakeEnvironment

    const createStream = async () => {
        const stream = await publisherClient.createStream(createRelativeTestStreamId(module))
        await publisherClient.grantPermissions(stream.id, {
            permissions: [StreamPermission.SUBSCRIBE],
            user: subscriberWallet.address
        })
        return stream
    }

    const triggerGroupKeyRequest = async (): Promise<void> => {
        const subscriberClient = environment.createClient({
            auth: {
                privateKey: subscriberWallet.privateKey
            }
        })
        await subscriberClient.subscribe(streamPartId)
        await publisherClient.publish(streamPartId, {})
    }

    const assertValidResponse = async (actualResponse: StreamMessage, expectedGroupKey: GroupKey): Promise<void> => {
        expect(actualResponse).toMatchObject({
            messageId: {
                streamId: StreamPartIDUtils.getStreamID(streamPartId),
                streamPartition: StreamPartIDUtils.getStreamPartition(streamPartId),
                publisherId: toEthereumAddress(publisherWallet.address),
            },
            messageType: StreamMessageType.GROUP_KEY_RESPONSE,
            contentType: ContentType.JSON,
            encryptionType: EncryptionType.RSA,
            signature: expect.any(Uint8Array)
        })
        const encryptedGroupKeys = deserializeGroupKeyResponse(actualResponse.content).encryptedGroupKeys
        expect(encryptedGroupKeys).toMatchObject([{
            id: expectedGroupKey.id,
            data: expect.any(Uint8Array)
        }])
    }

    beforeEach(async () => {
        publisherWallet = fastWallet()
        subscriberWallet = fastWallet()
        environment = new FakeEnvironment()
        publisherClient = environment.createClient({
            auth: {
                privateKey: publisherWallet.privateKey
            }
        })
        const stream = await createStream()
        streamPartId = stream.getStreamParts()[0]
        await startPublisherKeyExchangeSubscription(publisherClient, streamPartId)
    })

    afterEach(async () => {
        await environment.destroy()
    })

    describe('responds to a group key request', () => {

        /*
         * A publisher node starts a subscription to receive group key requests
         * - tests that a correct kind of response message is sent to a subscriber node
         */
        it('happy path', async () => {
            const key = GroupKey.generate()
            await publisherClient.updateEncryptionKey({
                key,
                distributionMethod: 'rekey',
                streamId: StreamPartIDUtils.getStreamID(streamPartId)
            })

            await triggerGroupKeyRequest()

            const response = await environment.getNetwork().waitForSentMessage({
                messageType: StreamMessageType.GROUP_KEY_RESPONSE
            })
            await assertValidResponse(response, key)
        })
    })
})
