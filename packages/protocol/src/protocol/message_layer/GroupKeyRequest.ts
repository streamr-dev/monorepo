import { validateIsArray, validateIsString } from '../../utils/validations'

import GroupKeyMessage from './GroupKeyMessage'
import StreamMessage, { StreamMessageType } from './StreamMessage'
import { EthereumAddress, toEthereumAddress } from '@streamr/utils'

interface Options {
    requestId: string
    recipient: EthereumAddress
    rsaPublicKey: string
    groupKeyIds: string[]
}

export type GroupKeyRequestSerialized = [string, string, string, string[]]

export default class GroupKeyRequest extends GroupKeyMessage {

    requestId: string
    rsaPublicKey: string
    groupKeyIds: string[]

    constructor({ requestId, recipient, rsaPublicKey, groupKeyIds }: Options) {
        super(recipient, StreamMessageType.GROUP_KEY_REQUEST)

        validateIsString('requestId', requestId)
        this.requestId = requestId

        validateIsString('rsaPublicKey', rsaPublicKey)
        this.rsaPublicKey = rsaPublicKey

        validateIsArray('groupKeyIds', groupKeyIds)
        this.groupKeyIds = groupKeyIds
    }

    toArray(): GroupKeyRequestSerialized {
        return [this.requestId, this.recipient, this.rsaPublicKey, this.groupKeyIds]
    }

    static override fromArray(args: GroupKeyRequestSerialized): GroupKeyRequest {
        const [requestId, recipient, rsaPublicKey, groupKeyIds] = args
        return new GroupKeyRequest({
            requestId,
            recipient: toEthereumAddress(recipient),
            rsaPublicKey,
            groupKeyIds,
        })
    }

    static is(streamMessage: StreamMessage): streamMessage is StreamMessage {
        return streamMessage.messageType === StreamMessageType.GROUP_KEY_REQUEST
    }
}

GroupKeyMessage.classByMessageType[StreamMessageType.GROUP_KEY_REQUEST] = GroupKeyRequest
