import { validateIsNotEmptyString, validateIsNotNegativeInteger, validateIsString } from '../../utils/validations'

import MessageRef from './MessageRef'
import { StreamID, toStreamID } from '../../../src/utils/StreamID'
import { StreamPartID, toStreamPartID } from "../../utils/StreamPartID"
import { EthereumAddress, toEthereumAddress } from '@streamr/utils'
/** @internal */
export type MessageIDArray = [string, number, number, number, string, string]
export default class MessageID {

    streamId: StreamID
    streamPartition: number
    timestamp: number
    sequenceNumber: number
    publisherId: EthereumAddress
    msgChainId: string

    constructor(
        streamId: StreamID,
        streamPartition: number,
        timestamp: number,
        sequenceNumber: number,
        publisherId: EthereumAddress,
        msgChainId: string
    ) {
        validateIsNotEmptyString('streamId', streamId)
        validateIsNotNegativeInteger('streamPartition', streamPartition)
        validateIsNotNegativeInteger('timestamp', timestamp)
        validateIsNotNegativeInteger('sequenceNumber', sequenceNumber)
        validateIsString('publisherId', publisherId)
        validateIsString('msgChainId', msgChainId)

        this.streamId = streamId
        this.streamPartition = streamPartition
        this.timestamp = timestamp
        this.sequenceNumber = sequenceNumber
        this.publisherId = publisherId
        this.msgChainId = msgChainId
    }

    toArray(): MessageIDArray {
        return [
            this.streamId,
            this.streamPartition,
            this.timestamp,
            this.sequenceNumber,
            this.publisherId,
            this.msgChainId,
        ]
    }

    static fromArray(arr: MessageIDArray): MessageID {
        const [
            streamId,
            streamPartition,
            timestamp,
            sequenceNumber,
            publisherId,
            msgChainId,
        ] = arr

        return new MessageID(
            toStreamID(streamId),
            streamPartition,
            timestamp,
            sequenceNumber,
            toEthereumAddress(publisherId),
            msgChainId
        )
    }

    getStreamPartID(): StreamPartID {
        return toStreamPartID(this.streamId, this.streamPartition)
    }

    serialize(): string {
        return JSON.stringify(this.toArray())
    }

    toMessageRef(): MessageRef {
        return new MessageRef(this.timestamp, this.sequenceNumber)
    }

    clone(): MessageID {
        return new MessageID(...this.toArray() as [StreamID, number, number, number, EthereumAddress, string])
    }
}
