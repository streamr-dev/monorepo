import TrackerMessage from '../TrackerMessage'

import InstructionMessage from './InstructionMessage'

import { Serializer } from '../../../Serializer'
import { toStreamID } from '../../../utils/StreamID'

const VERSION = 2

/* eslint-disable class-methods-use-this */
export default class InstructionMessageSerializerV2 extends Serializer<InstructionMessage> {
    toArray(instructionMessage: InstructionMessage): any[] {
        return [
            VERSION,
            TrackerMessage.TYPES.InstructionMessage,
            instructionMessage.requestId,
            instructionMessage.streamId,
            instructionMessage.streamPartition,
            instructionMessage.nodeIds,
            instructionMessage.counter
        ]
    }

    fromArray(arr: any[]): InstructionMessage {
        const [
            version,
            _type,
            requestId,
            streamId,
            streamPartition,
            nodeIds,
            counter
        ] = arr

        return new InstructionMessage({
            version,
            requestId,
            streamId: toStreamID(streamId),
            streamPartition,
            nodeIds,
            counter
        })
    }
}

TrackerMessage.registerSerializer(VERSION, TrackerMessage.TYPES.InstructionMessage, new InstructionMessageSerializerV2())
