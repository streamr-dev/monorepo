import { StreamID, StreamMessage, StreamPartIDUtils } from '@streamr/protocol'
import { collect } from '@streamr/utils'
import identity from 'lodash/identity'
import { MessageStream } from '../subscribe/MessageStream'
import { unique } from './GeneratorUtils'

export function waitForAssignmentsToPropagate(
    messageStream: MessageStream,
    targetStream: {
        id: StreamID
        partitions: number
    }
): Promise<string[]> {
    return collect(
        unique<string>(
            messageStream
                .map((msg: StreamMessage) => (msg.getParsedContent() as any).streamPart)
                .filter((input: any) => {
                    try {
                        const streamPartId = StreamPartIDUtils.parse(input)
                        const [streamId, partition] = StreamPartIDUtils.getStreamIDAndPartition(streamPartId)
                        return streamId === targetStream.id && partition < targetStream.partitions
                    } catch {
                        return false
                    }
                }),
            identity
        ),
        targetStream.partitions
    )
}
