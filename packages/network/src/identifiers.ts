import { SmartContractRecord, StreamID, TrackerLayer } from 'streamr-client-protocol'
import { MetricsContext } from './helpers/MetricsContext'


export type NodeId = string
export type TrackerId = string
export const COUNTER_UNSUBSCRIBE = -1
// Used by the tracker to signal to nodes that they are alone in the topology
export const COUNTER_LONE_NODE = -2
export const DEFAULT_MAX_NEIGHBOR_COUNT = 4


export interface Rtts {
    [key: string]: number
}

export interface Location {
    latitude?: number
    longitude?: number
    country?: string
    city?: string
}

export interface StreamPartStatus {
    id: StreamID
    partition: number,
    neighbors: NodeId[]
    counter: number
}

export interface Status {
    streamPart: StreamPartStatus
    rtts: Rtts | null
    location?: Location
    started: string
    version?: string
    extra: Record<string, unknown>
}

export enum RtcSubTypes {
    ICE_CANDIDATE = 'iceCandidate',
    RTC_OFFER = 'rtcOffer',
    RTC_ANSWER = 'rtcAnswer',
    RTC_CONNECT = 'rtcConnect',
}

export type RtcIceCandidateMessage = {
    subType: RtcSubTypes.ICE_CANDIDATE
    data: {
        connectionId: string,
        candidate: string
        mid: string
    }
}

export type RtcConnectMessage = {
    subType: RtcSubTypes.RTC_CONNECT
    data: {
        force: boolean
    }
}

export type RtcOfferMessage = {
    subType: RtcSubTypes.RTC_OFFER
    data: {
        connectionId: string,
        description: string,
    }
}

export type RtcAnswerMessage = {
    subType: RtcSubTypes.RTC_ANSWER
    data: {
        connectionId: string,
        description: string
    }
}

export type RelayMessage = (
    RtcOfferMessage
        | RtcAnswerMessage
        | RtcIceCandidateMessage
        | RtcConnectMessage
    ) & TrackerLayer.RelayMessage

export interface RtcErrorMessage {
    targetNode: NodeId
    errorCode: string
}

export type TrackerInfo = SmartContractRecord

export interface AbstractNodeOptions {
    id?: NodeId
    name?: string
    location?: Location
    metricsContext?: MetricsContext
    trackerPingInterval?: number
}
