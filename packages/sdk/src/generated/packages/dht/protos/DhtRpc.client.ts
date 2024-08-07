// @generated by protobuf-ts 2.9.4 with parameter server_generic,generate_dependencies,long_type_number
// @generated from protobuf file "packages/dht/protos/DhtRpc.proto" (package "dht", syntax proto3)
// tslint:disable
import { ExternalApiRpc } from "./DhtRpc";
import type { ExternalStoreDataResponse } from "./DhtRpc";
import type { ExternalStoreDataRequest } from "./DhtRpc";
import type { ExternalFetchDataResponse } from "./DhtRpc";
import type { ExternalFetchDataRequest } from "./DhtRpc";
import { ConnectionLockRpc } from "./DhtRpc";
import type { DisconnectNotice } from "./DhtRpc";
import type { UnlockRequest } from "./DhtRpc";
import type { LockResponse } from "./DhtRpc";
import type { LockRequest } from "./DhtRpc";
import { WebrtcConnectorRpc } from "./DhtRpc";
import type { IceCandidate } from "./DhtRpc";
import type { RtcAnswer } from "./DhtRpc";
import type { RtcOffer } from "./DhtRpc";
import type { WebrtcConnectionRequest } from "./DhtRpc";
import { WebsocketClientConnectorRpc } from "./DhtRpc";
import type { WebsocketConnectionRequest } from "./DhtRpc";
import { RecursiveOperationSessionRpc } from "./DhtRpc";
import type { RecursiveOperationResponse } from "./DhtRpc";
import { StoreRpc } from "./DhtRpc";
import type { ReplicateDataRequest } from "./DhtRpc";
import type { StoreDataResponse } from "./DhtRpc";
import type { StoreDataRequest } from "./DhtRpc";
import { RecursiveOperationRpc } from "./DhtRpc";
import { RouterRpc } from "./DhtRpc";
import type { RouteMessageAck } from "./DhtRpc";
import type { RouteMessageWrapper } from "./DhtRpc";
import type { RpcTransport } from "@protobuf-ts/runtime-rpc";
import type { ServiceInfo } from "@protobuf-ts/runtime-rpc";
import { DhtNodeRpc } from "./DhtRpc";
import type { Empty } from "../../../google/protobuf/empty";
import type { LeaveNotice } from "./DhtRpc";
import type { PingResponse } from "./DhtRpc";
import type { PingRequest } from "./DhtRpc";
import type { ClosestRingPeersResponse } from "./DhtRpc";
import type { ClosestRingPeersRequest } from "./DhtRpc";
import { stackIntercept } from "@protobuf-ts/runtime-rpc";
import type { ClosestPeersResponse } from "./DhtRpc";
import type { ClosestPeersRequest } from "./DhtRpc";
import type { UnaryCall } from "@protobuf-ts/runtime-rpc";
import type { RpcOptions } from "@protobuf-ts/runtime-rpc";
/**
 * @generated from protobuf service dht.DhtNodeRpc
 */
export interface IDhtNodeRpcClient {
    /**
     * TODO rename to getClosestNeighbors (breaking change)
     *
     * @generated from protobuf rpc: getClosestPeers(dht.ClosestPeersRequest) returns (dht.ClosestPeersResponse);
     */
    getClosestPeers(input: ClosestPeersRequest, options?: RpcOptions): UnaryCall<ClosestPeersRequest, ClosestPeersResponse>;
    /**
     * TODO rename to getClosestRingContacts (breaking change)
     *
     * @generated from protobuf rpc: getClosestRingPeers(dht.ClosestRingPeersRequest) returns (dht.ClosestRingPeersResponse);
     */
    getClosestRingPeers(input: ClosestRingPeersRequest, options?: RpcOptions): UnaryCall<ClosestRingPeersRequest, ClosestRingPeersResponse>;
    /**
     * @generated from protobuf rpc: ping(dht.PingRequest) returns (dht.PingResponse);
     */
    ping(input: PingRequest, options?: RpcOptions): UnaryCall<PingRequest, PingResponse>;
    /**
     * @generated from protobuf rpc: leaveNotice(dht.LeaveNotice) returns (google.protobuf.Empty);
     */
    leaveNotice(input: LeaveNotice, options?: RpcOptions): UnaryCall<LeaveNotice, Empty>;
}
/**
 * @generated from protobuf service dht.DhtNodeRpc
 */
export class DhtNodeRpcClient implements IDhtNodeRpcClient, ServiceInfo {
    typeName = DhtNodeRpc.typeName;
    methods = DhtNodeRpc.methods;
    options = DhtNodeRpc.options;
    constructor(private readonly _transport: RpcTransport) {
    }
    /**
     * TODO rename to getClosestNeighbors (breaking change)
     *
     * @generated from protobuf rpc: getClosestPeers(dht.ClosestPeersRequest) returns (dht.ClosestPeersResponse);
     */
    getClosestPeers(input: ClosestPeersRequest, options?: RpcOptions): UnaryCall<ClosestPeersRequest, ClosestPeersResponse> {
        const method = this.methods[0], opt = this._transport.mergeOptions(options);
        return stackIntercept<ClosestPeersRequest, ClosestPeersResponse>("unary", this._transport, method, opt, input);
    }
    /**
     * TODO rename to getClosestRingContacts (breaking change)
     *
     * @generated from protobuf rpc: getClosestRingPeers(dht.ClosestRingPeersRequest) returns (dht.ClosestRingPeersResponse);
     */
    getClosestRingPeers(input: ClosestRingPeersRequest, options?: RpcOptions): UnaryCall<ClosestRingPeersRequest, ClosestRingPeersResponse> {
        const method = this.methods[1], opt = this._transport.mergeOptions(options);
        return stackIntercept<ClosestRingPeersRequest, ClosestRingPeersResponse>("unary", this._transport, method, opt, input);
    }
    /**
     * @generated from protobuf rpc: ping(dht.PingRequest) returns (dht.PingResponse);
     */
    ping(input: PingRequest, options?: RpcOptions): UnaryCall<PingRequest, PingResponse> {
        const method = this.methods[2], opt = this._transport.mergeOptions(options);
        return stackIntercept<PingRequest, PingResponse>("unary", this._transport, method, opt, input);
    }
    /**
     * @generated from protobuf rpc: leaveNotice(dht.LeaveNotice) returns (google.protobuf.Empty);
     */
    leaveNotice(input: LeaveNotice, options?: RpcOptions): UnaryCall<LeaveNotice, Empty> {
        const method = this.methods[3], opt = this._transport.mergeOptions(options);
        return stackIntercept<LeaveNotice, Empty>("unary", this._transport, method, opt, input);
    }
}
/**
 * @generated from protobuf service dht.RouterRpc
 */
export interface IRouterRpcClient {
    /**
     * @generated from protobuf rpc: routeMessage(dht.RouteMessageWrapper) returns (dht.RouteMessageAck);
     */
    routeMessage(input: RouteMessageWrapper, options?: RpcOptions): UnaryCall<RouteMessageWrapper, RouteMessageAck>;
    /**
     * @generated from protobuf rpc: forwardMessage(dht.RouteMessageWrapper) returns (dht.RouteMessageAck);
     */
    forwardMessage(input: RouteMessageWrapper, options?: RpcOptions): UnaryCall<RouteMessageWrapper, RouteMessageAck>;
}
/**
 * @generated from protobuf service dht.RouterRpc
 */
export class RouterRpcClient implements IRouterRpcClient, ServiceInfo {
    typeName = RouterRpc.typeName;
    methods = RouterRpc.methods;
    options = RouterRpc.options;
    constructor(private readonly _transport: RpcTransport) {
    }
    /**
     * @generated from protobuf rpc: routeMessage(dht.RouteMessageWrapper) returns (dht.RouteMessageAck);
     */
    routeMessage(input: RouteMessageWrapper, options?: RpcOptions): UnaryCall<RouteMessageWrapper, RouteMessageAck> {
        const method = this.methods[0], opt = this._transport.mergeOptions(options);
        return stackIntercept<RouteMessageWrapper, RouteMessageAck>("unary", this._transport, method, opt, input);
    }
    /**
     * @generated from protobuf rpc: forwardMessage(dht.RouteMessageWrapper) returns (dht.RouteMessageAck);
     */
    forwardMessage(input: RouteMessageWrapper, options?: RpcOptions): UnaryCall<RouteMessageWrapper, RouteMessageAck> {
        const method = this.methods[1], opt = this._transport.mergeOptions(options);
        return stackIntercept<RouteMessageWrapper, RouteMessageAck>("unary", this._transport, method, opt, input);
    }
}
/**
 * @generated from protobuf service dht.RecursiveOperationRpc
 */
export interface IRecursiveOperationRpcClient {
    /**
     * @generated from protobuf rpc: routeRequest(dht.RouteMessageWrapper) returns (dht.RouteMessageAck);
     */
    routeRequest(input: RouteMessageWrapper, options?: RpcOptions): UnaryCall<RouteMessageWrapper, RouteMessageAck>;
}
/**
 * @generated from protobuf service dht.RecursiveOperationRpc
 */
export class RecursiveOperationRpcClient implements IRecursiveOperationRpcClient, ServiceInfo {
    typeName = RecursiveOperationRpc.typeName;
    methods = RecursiveOperationRpc.methods;
    options = RecursiveOperationRpc.options;
    constructor(private readonly _transport: RpcTransport) {
    }
    /**
     * @generated from protobuf rpc: routeRequest(dht.RouteMessageWrapper) returns (dht.RouteMessageAck);
     */
    routeRequest(input: RouteMessageWrapper, options?: RpcOptions): UnaryCall<RouteMessageWrapper, RouteMessageAck> {
        const method = this.methods[0], opt = this._transport.mergeOptions(options);
        return stackIntercept<RouteMessageWrapper, RouteMessageAck>("unary", this._transport, method, opt, input);
    }
}
/**
 * @generated from protobuf service dht.StoreRpc
 */
export interface IStoreRpcClient {
    /**
     * @generated from protobuf rpc: storeData(dht.StoreDataRequest) returns (dht.StoreDataResponse);
     */
    storeData(input: StoreDataRequest, options?: RpcOptions): UnaryCall<StoreDataRequest, StoreDataResponse>;
    /**
     * @generated from protobuf rpc: replicateData(dht.ReplicateDataRequest) returns (google.protobuf.Empty);
     */
    replicateData(input: ReplicateDataRequest, options?: RpcOptions): UnaryCall<ReplicateDataRequest, Empty>;
}
/**
 * @generated from protobuf service dht.StoreRpc
 */
export class StoreRpcClient implements IStoreRpcClient, ServiceInfo {
    typeName = StoreRpc.typeName;
    methods = StoreRpc.methods;
    options = StoreRpc.options;
    constructor(private readonly _transport: RpcTransport) {
    }
    /**
     * @generated from protobuf rpc: storeData(dht.StoreDataRequest) returns (dht.StoreDataResponse);
     */
    storeData(input: StoreDataRequest, options?: RpcOptions): UnaryCall<StoreDataRequest, StoreDataResponse> {
        const method = this.methods[0], opt = this._transport.mergeOptions(options);
        return stackIntercept<StoreDataRequest, StoreDataResponse>("unary", this._transport, method, opt, input);
    }
    /**
     * @generated from protobuf rpc: replicateData(dht.ReplicateDataRequest) returns (google.protobuf.Empty);
     */
    replicateData(input: ReplicateDataRequest, options?: RpcOptions): UnaryCall<ReplicateDataRequest, Empty> {
        const method = this.methods[1], opt = this._transport.mergeOptions(options);
        return stackIntercept<ReplicateDataRequest, Empty>("unary", this._transport, method, opt, input);
    }
}
/**
 * @generated from protobuf service dht.RecursiveOperationSessionRpc
 */
export interface IRecursiveOperationSessionRpcClient {
    /**
     * @generated from protobuf rpc: sendResponse(dht.RecursiveOperationResponse) returns (google.protobuf.Empty);
     */
    sendResponse(input: RecursiveOperationResponse, options?: RpcOptions): UnaryCall<RecursiveOperationResponse, Empty>;
}
/**
 * @generated from protobuf service dht.RecursiveOperationSessionRpc
 */
export class RecursiveOperationSessionRpcClient implements IRecursiveOperationSessionRpcClient, ServiceInfo {
    typeName = RecursiveOperationSessionRpc.typeName;
    methods = RecursiveOperationSessionRpc.methods;
    options = RecursiveOperationSessionRpc.options;
    constructor(private readonly _transport: RpcTransport) {
    }
    /**
     * @generated from protobuf rpc: sendResponse(dht.RecursiveOperationResponse) returns (google.protobuf.Empty);
     */
    sendResponse(input: RecursiveOperationResponse, options?: RpcOptions): UnaryCall<RecursiveOperationResponse, Empty> {
        const method = this.methods[0], opt = this._transport.mergeOptions(options);
        return stackIntercept<RecursiveOperationResponse, Empty>("unary", this._transport, method, opt, input);
    }
}
/**
 * @generated from protobuf service dht.WebsocketClientConnectorRpc
 */
export interface IWebsocketClientConnectorRpcClient {
    /**
     * @generated from protobuf rpc: requestConnection(dht.WebsocketConnectionRequest) returns (google.protobuf.Empty);
     */
    requestConnection(input: WebsocketConnectionRequest, options?: RpcOptions): UnaryCall<WebsocketConnectionRequest, Empty>;
}
/**
 * @generated from protobuf service dht.WebsocketClientConnectorRpc
 */
export class WebsocketClientConnectorRpcClient implements IWebsocketClientConnectorRpcClient, ServiceInfo {
    typeName = WebsocketClientConnectorRpc.typeName;
    methods = WebsocketClientConnectorRpc.methods;
    options = WebsocketClientConnectorRpc.options;
    constructor(private readonly _transport: RpcTransport) {
    }
    /**
     * @generated from protobuf rpc: requestConnection(dht.WebsocketConnectionRequest) returns (google.protobuf.Empty);
     */
    requestConnection(input: WebsocketConnectionRequest, options?: RpcOptions): UnaryCall<WebsocketConnectionRequest, Empty> {
        const method = this.methods[0], opt = this._transport.mergeOptions(options);
        return stackIntercept<WebsocketConnectionRequest, Empty>("unary", this._transport, method, opt, input);
    }
}
/**
 * @generated from protobuf service dht.WebrtcConnectorRpc
 */
export interface IWebrtcConnectorRpcClient {
    /**
     * @generated from protobuf rpc: requestConnection(dht.WebrtcConnectionRequest) returns (google.protobuf.Empty);
     */
    requestConnection(input: WebrtcConnectionRequest, options?: RpcOptions): UnaryCall<WebrtcConnectionRequest, Empty>;
    /**
     * @generated from protobuf rpc: rtcOffer(dht.RtcOffer) returns (google.protobuf.Empty);
     */
    rtcOffer(input: RtcOffer, options?: RpcOptions): UnaryCall<RtcOffer, Empty>;
    /**
     * @generated from protobuf rpc: rtcAnswer(dht.RtcAnswer) returns (google.protobuf.Empty);
     */
    rtcAnswer(input: RtcAnswer, options?: RpcOptions): UnaryCall<RtcAnswer, Empty>;
    /**
     * @generated from protobuf rpc: iceCandidate(dht.IceCandidate) returns (google.protobuf.Empty);
     */
    iceCandidate(input: IceCandidate, options?: RpcOptions): UnaryCall<IceCandidate, Empty>;
}
/**
 * @generated from protobuf service dht.WebrtcConnectorRpc
 */
export class WebrtcConnectorRpcClient implements IWebrtcConnectorRpcClient, ServiceInfo {
    typeName = WebrtcConnectorRpc.typeName;
    methods = WebrtcConnectorRpc.methods;
    options = WebrtcConnectorRpc.options;
    constructor(private readonly _transport: RpcTransport) {
    }
    /**
     * @generated from protobuf rpc: requestConnection(dht.WebrtcConnectionRequest) returns (google.protobuf.Empty);
     */
    requestConnection(input: WebrtcConnectionRequest, options?: RpcOptions): UnaryCall<WebrtcConnectionRequest, Empty> {
        const method = this.methods[0], opt = this._transport.mergeOptions(options);
        return stackIntercept<WebrtcConnectionRequest, Empty>("unary", this._transport, method, opt, input);
    }
    /**
     * @generated from protobuf rpc: rtcOffer(dht.RtcOffer) returns (google.protobuf.Empty);
     */
    rtcOffer(input: RtcOffer, options?: RpcOptions): UnaryCall<RtcOffer, Empty> {
        const method = this.methods[1], opt = this._transport.mergeOptions(options);
        return stackIntercept<RtcOffer, Empty>("unary", this._transport, method, opt, input);
    }
    /**
     * @generated from protobuf rpc: rtcAnswer(dht.RtcAnswer) returns (google.protobuf.Empty);
     */
    rtcAnswer(input: RtcAnswer, options?: RpcOptions): UnaryCall<RtcAnswer, Empty> {
        const method = this.methods[2], opt = this._transport.mergeOptions(options);
        return stackIntercept<RtcAnswer, Empty>("unary", this._transport, method, opt, input);
    }
    /**
     * @generated from protobuf rpc: iceCandidate(dht.IceCandidate) returns (google.protobuf.Empty);
     */
    iceCandidate(input: IceCandidate, options?: RpcOptions): UnaryCall<IceCandidate, Empty> {
        const method = this.methods[3], opt = this._transport.mergeOptions(options);
        return stackIntercept<IceCandidate, Empty>("unary", this._transport, method, opt, input);
    }
}
/**
 * @generated from protobuf service dht.ConnectionLockRpc
 */
export interface IConnectionLockRpcClient {
    /**
     * @generated from protobuf rpc: lockRequest(dht.LockRequest) returns (dht.LockResponse);
     */
    lockRequest(input: LockRequest, options?: RpcOptions): UnaryCall<LockRequest, LockResponse>;
    /**
     * @generated from protobuf rpc: unlockRequest(dht.UnlockRequest) returns (google.protobuf.Empty);
     */
    unlockRequest(input: UnlockRequest, options?: RpcOptions): UnaryCall<UnlockRequest, Empty>;
    /**
     * @generated from protobuf rpc: gracefulDisconnect(dht.DisconnectNotice) returns (google.protobuf.Empty);
     */
    gracefulDisconnect(input: DisconnectNotice, options?: RpcOptions): UnaryCall<DisconnectNotice, Empty>;
}
/**
 * @generated from protobuf service dht.ConnectionLockRpc
 */
export class ConnectionLockRpcClient implements IConnectionLockRpcClient, ServiceInfo {
    typeName = ConnectionLockRpc.typeName;
    methods = ConnectionLockRpc.methods;
    options = ConnectionLockRpc.options;
    constructor(private readonly _transport: RpcTransport) {
    }
    /**
     * @generated from protobuf rpc: lockRequest(dht.LockRequest) returns (dht.LockResponse);
     */
    lockRequest(input: LockRequest, options?: RpcOptions): UnaryCall<LockRequest, LockResponse> {
        const method = this.methods[0], opt = this._transport.mergeOptions(options);
        return stackIntercept<LockRequest, LockResponse>("unary", this._transport, method, opt, input);
    }
    /**
     * @generated from protobuf rpc: unlockRequest(dht.UnlockRequest) returns (google.protobuf.Empty);
     */
    unlockRequest(input: UnlockRequest, options?: RpcOptions): UnaryCall<UnlockRequest, Empty> {
        const method = this.methods[1], opt = this._transport.mergeOptions(options);
        return stackIntercept<UnlockRequest, Empty>("unary", this._transport, method, opt, input);
    }
    /**
     * @generated from protobuf rpc: gracefulDisconnect(dht.DisconnectNotice) returns (google.protobuf.Empty);
     */
    gracefulDisconnect(input: DisconnectNotice, options?: RpcOptions): UnaryCall<DisconnectNotice, Empty> {
        const method = this.methods[2], opt = this._transport.mergeOptions(options);
        return stackIntercept<DisconnectNotice, Empty>("unary", this._transport, method, opt, input);
    }
}
/**
 * @generated from protobuf service dht.ExternalApiRpc
 */
export interface IExternalApiRpcClient {
    /**
     * @generated from protobuf rpc: externalFetchData(dht.ExternalFetchDataRequest) returns (dht.ExternalFetchDataResponse);
     */
    externalFetchData(input: ExternalFetchDataRequest, options?: RpcOptions): UnaryCall<ExternalFetchDataRequest, ExternalFetchDataResponse>;
    /**
     * @generated from protobuf rpc: externalStoreData(dht.ExternalStoreDataRequest) returns (dht.ExternalStoreDataResponse);
     */
    externalStoreData(input: ExternalStoreDataRequest, options?: RpcOptions): UnaryCall<ExternalStoreDataRequest, ExternalStoreDataResponse>;
}
/**
 * @generated from protobuf service dht.ExternalApiRpc
 */
export class ExternalApiRpcClient implements IExternalApiRpcClient, ServiceInfo {
    typeName = ExternalApiRpc.typeName;
    methods = ExternalApiRpc.methods;
    options = ExternalApiRpc.options;
    constructor(private readonly _transport: RpcTransport) {
    }
    /**
     * @generated from protobuf rpc: externalFetchData(dht.ExternalFetchDataRequest) returns (dht.ExternalFetchDataResponse);
     */
    externalFetchData(input: ExternalFetchDataRequest, options?: RpcOptions): UnaryCall<ExternalFetchDataRequest, ExternalFetchDataResponse> {
        const method = this.methods[0], opt = this._transport.mergeOptions(options);
        return stackIntercept<ExternalFetchDataRequest, ExternalFetchDataResponse>("unary", this._transport, method, opt, input);
    }
    /**
     * @generated from protobuf rpc: externalStoreData(dht.ExternalStoreDataRequest) returns (dht.ExternalStoreDataResponse);
     */
    externalStoreData(input: ExternalStoreDataRequest, options?: RpcOptions): UnaryCall<ExternalStoreDataRequest, ExternalStoreDataResponse> {
        const method = this.methods[1], opt = this._transport.mergeOptions(options);
        return stackIntercept<ExternalStoreDataRequest, ExternalStoreDataResponse>("unary", this._transport, method, opt, input);
    }
}