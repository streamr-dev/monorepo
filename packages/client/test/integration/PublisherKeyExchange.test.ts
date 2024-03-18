import 'reflect-metadata'

import { EthereumAddress, toEthereumAddress } from '@streamr/utils'
import { Wallet } from '@ethersproject/wallet'
import {
    ContentType,
    EncryptionType,
    SignatureType,
    StreamMessage,
    StreamMessageType,
    StreamPartID,
    StreamPartIDUtils
} from '@streamr/protocol'
import { fastWallet, randomEthereumAddress } from '@streamr/test-utils'
import { GroupKey } from '../../src/encryption/GroupKey'
import { StreamPermission } from '../../src/permission'
import { StreamrClient } from '../../src/StreamrClient'
import { FakeEnvironment } from '../test-utils/fake/FakeEnvironment'
import { createRelativeTestStreamId, startPublisherKeyExchangeSubscription } from '../test-utils/utils'
import { convertBytesToGroupKeyResponse } from '@streamr/trackerless-network'

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

    const triggerGroupKeyRequest = async (eip1271Contract?: string): Promise<void> => {
        const subscriberClient = environment.createClient({
            auth: {
                privateKey: subscriberWallet.privateKey
            }
        })
        await subscriberClient.subscribe(streamPartId)
        await publisherClient.publish(streamPartId, {}, { eip1271Contract })
    }

    const assertValidResponse = async (
        actualResponse: StreamMessage,
        expectedGroupKey: GroupKey,
        expectedPublisherId: EthereumAddress,
        signatureType: SignatureType
    ): Promise<void> => {
        expect(actualResponse).toMatchObject({
            messageId: {
                streamId: StreamPartIDUtils.getStreamID(streamPartId),
                streamPartition: StreamPartIDUtils.getStreamPartition(streamPartId),
                publisherId: expectedPublisherId,
            },
            messageType: StreamMessageType.GROUP_KEY_RESPONSE,
            contentType: ContentType.BINARY,
            encryptionType: EncryptionType.NONE,
            signature: expect.any(Uint8Array),
            signatureType
        })
        const encryptedGroupKeys = convertBytesToGroupKeyResponse(actualResponse.content).encryptedGroupKeys
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
            await assertValidResponse(response, key, toEthereumAddress(publisherWallet.address), SignatureType.SECP256K1)
        })
    })

    it('happy path: ERC-1271', async () => {
        const erc1271ContractAddress = randomEthereumAddress()
        await publisherClient.grantPermissions(StreamPartIDUtils.getStreamID(streamPartId), {
            permissions: [StreamPermission.PUBLISH],
            user: erc1271ContractAddress
        })
        environment.getEip1271ContractFacade().addAllowedAddress(erc1271ContractAddress, toEthereumAddress(publisherWallet.address))

        const key = GroupKey.generate()
        await publisherClient.updateEncryptionKey({
            key,
            distributionMethod: 'rekey',
            streamId: StreamPartIDUtils.getStreamID(streamPartId)
        })

        await triggerGroupKeyRequest(erc1271ContractAddress)

        const response = await environment.getNetwork().waitForSentMessage({
            messageType: StreamMessageType.GROUP_KEY_RESPONSE
        })
        await assertValidResponse(response, key, erc1271ContractAddress, SignatureType.EIP_1271)
    })
})
