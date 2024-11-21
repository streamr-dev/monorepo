import { DestroySignal } from '../DestroySignal'
import { createDecryptError, EncryptionUtil } from '../encryption/EncryptionUtil'
import { GroupKey } from '../encryption/GroupKey'
import { GroupKeyManager } from '../encryption/GroupKeyManager'
import { EncryptionType, StreamMessage, StreamMessageAESEncrypted } from '../protocol/StreamMessage'

// TODO if this.destroySignal.isDestroyed() is true, would it make sense to reject the promise
// and not to return the original encrypted message?
// - e.g. StoppedError, which is not visible to end-user
export const decrypt = async (
    streamMessage: StreamMessageAESEncrypted,
    groupKeyManager: GroupKeyManager,
    destroySignal: DestroySignal,
): Promise<StreamMessage> => {
    if (destroySignal.isDestroyed()) {
        return streamMessage
    }
    let groupKey: GroupKey | undefined
    try {
        groupKey = await groupKeyManager.fetchKey(
            streamMessage.getStreamPartID(),
            streamMessage.groupKeyId,
            streamMessage.getPublisherId()
        )
    } catch (e: any) {
        if (destroySignal.isDestroyed()) {
            return streamMessage
        }
        throw createDecryptError(`Could not get encryption key ${streamMessage.groupKeyId}`, streamMessage, e)
    }
    if (destroySignal.isDestroyed()) {
        return streamMessage
    }
    const [content, newGroupKey] = EncryptionUtil.decryptStreamMessage(streamMessage, groupKey)
    if (newGroupKey !== undefined) {
        await groupKeyManager.addKeyToLocalStore(newGroupKey, streamMessage.getPublisherId())
    }

    return new StreamMessage({
        ...streamMessage,
        content,
        encryptionType: EncryptionType.NONE
    })
}
