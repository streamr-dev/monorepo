import {
    ContentType,
    deserializeGroupKeyResponse,
    EncryptionType,
    GroupKeyRequest,
    GroupKeyResponse,
    MessageID,
    serializeGroupKeyRequest,
    StreamMessage,
    StreamMessageType,
    StreamPartID,
    StreamPartIDUtils
} from '@streamr/protocol'
import { EthereumAddress, Logger } from '@streamr/utils'
import { Lifecycle, inject, scoped } from 'tsyringe'
import { v4 as uuidv4 } from 'uuid'
import { Authentication, AuthenticationInjectionToken } from '../Authentication'
import { ConfigInjectionToken, StrictStreamrClientConfig } from '../Config'
import { NetworkNodeFacade } from '../NetworkNodeFacade'
import { createSignedMessage } from '../publish/MessageFactory'
import { createRandomMsgChainId } from '../publish/messageChain'
import { StreamRegistry } from '../registry/StreamRegistry'
import { LoggerFactory } from '../utils/LoggerFactory'
import { pOnce, withThrottling } from '../utils/promises'
import { MaxSizedSet } from '../utils/utils'
import { validateStreamMessage } from '../utils/validateStreamMessage'
import { GroupKey } from './GroupKey'
import { LocalGroupKeyStore } from './LocalGroupKeyStore'
import { RSAKeyPair } from './RSAKeyPair'

const MAX_PENDING_REQUEST_COUNT = 50000 // just some limit, we can tweak the number if needed

/*
 * Sends group key requests and receives group key responses
 */

@scoped(Lifecycle.ContainerScoped)
export class SubscriberKeyExchange {

    private rsaKeyPair?: RSAKeyPair
    private readonly pendingRequests: MaxSizedSet<string> = new MaxSizedSet(MAX_PENDING_REQUEST_COUNT)
    private readonly networkNodeFacade: NetworkNodeFacade
    private readonly streamRegistry: StreamRegistry
    private readonly store: LocalGroupKeyStore
    private readonly authentication: Authentication
    private readonly logger: Logger
    private readonly ensureStarted: () => Promise<void>
    requestGroupKey: (groupKeyId: string, publisherId: EthereumAddress, streamPartId: StreamPartID) => Promise<void>

    constructor(
        networkNodeFacade: NetworkNodeFacade,
        streamRegistry: StreamRegistry,
        store: LocalGroupKeyStore,
        @inject(ConfigInjectionToken) config: Pick<StrictStreamrClientConfig, 'encryption'>,
        @inject(AuthenticationInjectionToken) authentication: Authentication,
        loggerFactory: LoggerFactory
    ) {
        this.networkNodeFacade = networkNodeFacade
        this.streamRegistry = streamRegistry
        this.store = store
        this.authentication = authentication
        this.logger = loggerFactory.createLogger(module)
        this.ensureStarted = pOnce(async () => {
            // eslint-disable-next-line no-underscore-dangle
            this.rsaKeyPair = await RSAKeyPair.create(config.encryption.rsaKeyLength)
            const node = await networkNodeFacade.getNode()
            node.addMessageListener((msg: StreamMessage) => this.onMessage(msg))
            this.logger.debug('Started')
        })
        this.requestGroupKey = withThrottling((groupKeyId: string, publisherId: EthereumAddress, streamPartId: StreamPartID) => {
            return this.doRequestGroupKey(groupKeyId, publisherId, streamPartId)
        }, config.encryption.maxKeyRequestsPerSecond)
    }

    private async doRequestGroupKey(groupKeyId: string, publisherId: EthereumAddress, streamPartId: StreamPartID): Promise<void> {
        await this.ensureStarted()
        const requestId = uuidv4()
        const request = await this.createRequest(
            groupKeyId,
            streamPartId,
            publisherId,
            this.rsaKeyPair!.getPublicKey(),
            requestId)
        const node = await this.networkNodeFacade.getNode()
        await node.broadcast(request)
        this.pendingRequests.add(requestId)
        this.logger.debug('Sent group key request (waiting for response)', {
            groupKeyId,
            requestId,
            publisherId
        })
    }

    private async createRequest(
        groupKeyId: string,
        streamPartId: StreamPartID,
        publisherId: EthereumAddress,
        rsaPublicKey: string,
        requestId: string
    ): Promise<StreamMessage> {
        const requestContent = new GroupKeyRequest({
            recipient: publisherId,
            requestId,
            rsaPublicKey,
            groupKeyIds: [groupKeyId],
        })
        return createSignedMessage({
            messageId: new MessageID(
                StreamPartIDUtils.getStreamID(streamPartId),
                StreamPartIDUtils.getStreamPartition(streamPartId),
                Date.now(),
                0,
                await this.authentication.getAddress(),
                createRandomMsgChainId()
            ),
            serializedContent: serializeGroupKeyRequest(requestContent),
            messageType: StreamMessageType.GROUP_KEY_REQUEST,
            contentType: ContentType.JSON,
            encryptionType: EncryptionType.NONE,
            authentication: this.authentication
        })
    }

    private async onMessage(msg: StreamMessage): Promise<void> {
        if (GroupKeyResponse.is(msg)) {
            try {
                const authenticatedUser = await this.authentication.getAddress()
                const { requestId, recipient, encryptedGroupKeys } = deserializeGroupKeyResponse(msg.serializedContent) as GroupKeyResponse
                if ((recipient === authenticatedUser) && (this.pendingRequests.has(requestId))) {
                    this.logger.debug('Handle group key response', { requestId })
                    this.pendingRequests.delete(requestId)
                    await validateStreamMessage(msg, this.streamRegistry)
                    await Promise.all(encryptedGroupKeys.map(async (encryptedKey) => {
                        const key = GroupKey.decryptRSAEncrypted(encryptedKey, this.rsaKeyPair!.getPrivateKey())
                        await this.store.set(key.id, msg.getPublisherId(), key.data)
                    }))
                }
            } catch (err: any) {
                this.logger.debug('Failed to handle group key response', { err })
            }
        }
    }
}
