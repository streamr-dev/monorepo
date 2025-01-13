import { IMessageType } from '@protobuf-ts/runtime'
import {
    ClosestPeersRequest,
    ClosestPeersResponse,
    ConnectivityMethod,
    ConnectivityRequest,
    ConnectivityResponse,
    DisconnectNotice,
    HandshakeRequest,
    HandshakeResponse,
    LeaveNotice,
    Message,
    PeerDescriptor,
    PingRequest,
    PingResponse,
    RecursiveOperationResponse,
    RecursiveOperationRequest,
    RouteMessageAck,
    RouteMessageWrapper,
    WebsocketConnectionRequest,
    WebrtcConnectionRequest,
    RtcOffer,
    RtcAnswer,
    IceCandidate,
    LockRequest,
    UnlockRequest,
    LockResponse
} from '../../generated/packages/dht/protos/DhtRpc'

export const protoClasses: IMessageType<any>[] = [
    ClosestPeersRequest,
    ClosestPeersResponse,
    RecursiveOperationRequest,
    RecursiveOperationResponse,
    PingRequest,
    PingResponse,
    LeaveNotice,
    PeerDescriptor,
    ConnectivityMethod,
    DisconnectNotice,
    RouteMessageWrapper,
    RouteMessageAck,
    ConnectivityRequest,
    ConnectivityResponse,
    HandshakeRequest,
    HandshakeResponse,
    Message,
    WebsocketConnectionRequest,
    WebrtcConnectionRequest,
    RtcOffer,
    RtcAnswer,
    IceCandidate,
    LockRequest,
    UnlockRequest,
    LockResponse
]
