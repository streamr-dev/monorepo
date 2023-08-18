import StreamMessage from './StreamMessage'
import MessageRef from './MessageRef'
import MessageID from './MessageID'
import EncryptedGroupKey from './EncryptedGroupKey'

import ValidationError from '../../errors/ValidationError'

const VERSION = 32
export const SIGNATURE_TYPE_ETH = 2

export function toArray(streamMessage: StreamMessage): any[] {
    return [
        VERSION,
        streamMessage.messageId.toArray(),
        streamMessage.prevMsgRef ? streamMessage.prevMsgRef.toArray() : null,
        streamMessage.messageType,
        streamMessage.contentType,
        streamMessage.encryptionType,
        streamMessage.groupKeyId,
        streamMessage.serializedContent,
        streamMessage.newGroupKey ? streamMessage.newGroupKey.serialize() : null,
        SIGNATURE_TYPE_ETH,
        streamMessage.signature,
    ]
}

export function fromArray(arr: any[]): StreamMessage<any> {
    const [
        _version,
        messageIdArr,
        prevMsgRefArr,
        messageType,
        contentType,
        encryptionType,
        groupKeyId,
        serializedContent,
        serializedNewGroupKey,
        signatureType,
        signature
    ] = arr

    if (signatureType !== SIGNATURE_TYPE_ETH) {
        throw new ValidationError(`Unsupported signature type: ${signatureType}`)
    }

    return new StreamMessage({
        messageId: MessageID.fromArray(messageIdArr),
        prevMsgRef: prevMsgRefArr ? MessageRef.fromArray(prevMsgRefArr) : null,
        content: serializedContent,
        messageType,
        contentType,
        encryptionType,
        groupKeyId,
        newGroupKey: serializedNewGroupKey ? EncryptedGroupKey.deserialize(serializedNewGroupKey) : null,
        signature
    })
}
