import {
    ContentType,
    deserializeGroupKeyRequest,
    EncryptedGroupKey,
    EncryptionType,
    GroupKeyRequest,
    GroupKeyResponse,
    MessageID,
    serializeGroupKeyResponse,
    SignatureType,
    StreamMessage,
    StreamMessageType,
    StreamPartID,
    StreamPartIDUtils
} from '@streamr/protocol'
import { EthereumAddress, Logger } from '@streamr/utils'
import without from 'lodash/without'
import { Lifecycle, inject, scoped } from 'tsyringe'
import { Authentication, AuthenticationInjectionToken } from '../Authentication'
import { NetworkNodeFacade } from '../NetworkNodeFacade'
import { createSignedMessage } from '../publish/MessageFactory'
import { createRandomMsgChainId } from '../publish/messageChain'
import { StreamRegistry } from '../registry/StreamRegistry'
import { LoggerFactory } from '../utils/LoggerFactory'
import { validateStreamMessage } from '../utils/validateStreamMessage'
import { EncryptionUtil } from './EncryptionUtil'
import { GroupKey } from './GroupKey'
import { LocalGroupKeyStore } from './LocalGroupKeyStore'

/*
 * Sends group key responses
 */

@scoped(Lifecycle.ContainerScoped)
export class PublisherKeyExchange {

    private readonly networkNodeFacade: NetworkNodeFacade
    private readonly streamRegistry: StreamRegistry
    private readonly store: LocalGroupKeyStore
    private readonly authentication: Authentication
    private readonly logger: Logger

    constructor(
        networkNodeFacade: NetworkNodeFacade,
        streamRegistry: StreamRegistry,
        store: LocalGroupKeyStore,
        @inject(AuthenticationInjectionToken) authentication: Authentication,
        loggerFactory: LoggerFactory
    ) {
        this.networkNodeFacade = networkNodeFacade
        this.streamRegistry = streamRegistry
        this.store = store
        this.authentication = authentication
        this.logger = loggerFactory.createLogger(module)
        networkNodeFacade.once('start', async () => {
            const node = await networkNodeFacade.getNode()
            node.addMessageListener((msg: StreamMessage) => this.onMessage(msg))
            this.logger.debug('Started')
        })
    }

    private async onMessage(request: StreamMessage): Promise<void> {
        if (GroupKeyRequest.is(request)) {
            try {
                const authenticatedUser = await this.authentication.getAddress()
                const { recipient, requestId, rsaPublicKey, groupKeyIds } = deserializeGroupKeyRequest(request.content)
                if (recipient === authenticatedUser) {
                    this.logger.debug('Handling group key request', { requestId })
                    await validateStreamMessage(request, this.streamRegistry)
                    const keys = without(
                        await Promise.all(groupKeyIds.map((id: string) => this.store.get(id, authenticatedUser))),
                        undefined) as GroupKey[]
                    if (keys.length > 0) {
                        const response = await this.createResponse(
                            keys,
                            request.getStreamPartID(),
                            rsaPublicKey,
                            request.getPublisherId(),
                            requestId)
                        const node = await this.networkNodeFacade.getNode()
                        await node.broadcast(response)
                        this.logger.debug('Handled group key request (found keys)', {
                            groupKeyIds: keys.map((k) => k.id).join(),
                            recipient: request.getPublisherId()
                        })
                    } else {
                        this.logger.debug('Handled group key request (no keys found)', {
                            requestId,
                            recipient: request.getPublisherId()
                        })
                    }
                }
            } catch (err: any) {
                this.logger.debug('Failed to handle group key request', err)
            }
        }
    }

    private async createResponse(
        keys: GroupKey[],
        streamPartId: StreamPartID,
        rsaPublicKey: string,
        recipient: EthereumAddress,
        requestId: string
    ): Promise<StreamMessage> {
        const encryptedGroupKeys = await Promise.all(keys.map((key) => {
            const encryptedGroupKey = EncryptionUtil.encryptWithRSAPublicKey(key.data, rsaPublicKey)
            return new EncryptedGroupKey(key.id, encryptedGroupKey)
        }))
        const responseContent = new GroupKeyResponse({
            recipient,
            requestId,
            encryptedGroupKeys
        })
        const response = createSignedMessage({
            messageId: new MessageID(
                StreamPartIDUtils.getStreamID(streamPartId),
                StreamPartIDUtils.getStreamPartition(streamPartId),
                Date.now(),
                0,
                await this.authentication.getAddress(),
                createRandomMsgChainId()
            ),
            content: serializeGroupKeyResponse(responseContent),
            messageType: StreamMessageType.GROUP_KEY_RESPONSE,
            encryptionType: EncryptionType.NONE,
            authentication: this.authentication,
            contentType: ContentType.JSON,
            signatureType: SignatureType.SECP256K1,
        })
        return response
    }
}
