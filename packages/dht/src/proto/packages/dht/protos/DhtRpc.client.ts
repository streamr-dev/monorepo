// @generated by protobuf-ts 2.9.1 with parameter server_generic,generate_dependencies,long_type_number
// @generated from protobuf file "packages/dht/protos/DhtRpc.proto" (package "dht", syntax proto3)
// tslint:disable
import { ExternalApiRpc } from "./DhtRpc";
import type { ExternalStoreDataResponse } from "./DhtRpc";
import type { ExternalStoreDataRequest } from "./DhtRpc";
import type { FindDataResponse } from "./DhtRpc";
import type { FindDataRequest } from "./DhtRpc";
import { ConnectionLockRpc } from "./DhtRpc";
import type { DisconnectNoticeResponse } from "./DhtRpc";
import type { DisconnectNotice } from "./DhtRpc";
import type { UnlockRequest } from "./DhtRpc";
import type { LockResponse } from "./DhtRpc";
import type { LockRequest } from "./DhtRpc";
import { WebRtcConnectorRpc } from "./DhtRpc";
import type { IceCandidate } from "./DhtRpc";
import type { RtcAnswer } from "./DhtRpc";
import type { RtcOffer } from "./DhtRpc";
import type { WebRtcConnectionRequest } from "./DhtRpc";
import { WebSocketConnectorRpc } from "./DhtRpc";
import type { WebSocketConnectionResponse } from "./DhtRpc";
import type { WebSocketConnectionRequest } from "./DhtRpc";
import { RecursiveFindSessionService } from "./DhtRpc";
import type { FindResponse } from "./DhtRpc";
import { StoreRpc } from "./DhtRpc";
import type { DeleteDataResponse } from "./DhtRpc";
import type { DeleteDataRequest } from "./DhtRpc";
import type { MigrateDataResponse } from "./DhtRpc";
import type { MigrateDataRequest } from "./DhtRpc";
import type { StoreDataResponse } from "./DhtRpc";
import type { StoreDataRequest } from "./DhtRpc";
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
     * @generated from protobuf rpc: getClosestPeers(dht.ClosestPeersRequest) returns (dht.ClosestPeersResponse);
     */
    getClosestPeers(input: ClosestPeersRequest, options?: RpcOptions): UnaryCall<ClosestPeersRequest, ClosestPeersResponse>;
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
     * @generated from protobuf rpc: getClosestPeers(dht.ClosestPeersRequest) returns (dht.ClosestPeersResponse);
     */
    getClosestPeers(input: ClosestPeersRequest, options?: RpcOptions): UnaryCall<ClosestPeersRequest, ClosestPeersResponse> {
        const method = this.methods[0], opt = this._transport.mergeOptions(options);
        return stackIntercept<ClosestPeersRequest, ClosestPeersResponse>("unary", this._transport, method, opt, input);
    }
    /**
     * @generated from protobuf rpc: ping(dht.PingRequest) returns (dht.PingResponse);
     */
    ping(input: PingRequest, options?: RpcOptions): UnaryCall<PingRequest, PingResponse> {
        const method = this.methods[1], opt = this._transport.mergeOptions(options);
        return stackIntercept<PingRequest, PingResponse>("unary", this._transport, method, opt, input);
    }
    /**
     * @generated from protobuf rpc: leaveNotice(dht.LeaveNotice) returns (google.protobuf.Empty);
     */
    leaveNotice(input: LeaveNotice, options?: RpcOptions): UnaryCall<LeaveNotice, Empty> {
        const method = this.methods[2], opt = this._transport.mergeOptions(options);
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
    /**
     * @generated from protobuf rpc: findRecursively(dht.RouteMessageWrapper) returns (dht.RouteMessageAck);
     */
    findRecursively(input: RouteMessageWrapper, options?: RpcOptions): UnaryCall<RouteMessageWrapper, RouteMessageAck>;
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
    /**
     * @generated from protobuf rpc: findRecursively(dht.RouteMessageWrapper) returns (dht.RouteMessageAck);
     */
    findRecursively(input: RouteMessageWrapper, options?: RpcOptions): UnaryCall<RouteMessageWrapper, RouteMessageAck> {
        const method = this.methods[2], opt = this._transport.mergeOptions(options);
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
     * @generated from protobuf rpc: migrateData(dht.MigrateDataRequest) returns (dht.MigrateDataResponse);
     */
    migrateData(input: MigrateDataRequest, options?: RpcOptions): UnaryCall<MigrateDataRequest, MigrateDataResponse>;
    /**
     * @generated from protobuf rpc: deleteData(dht.DeleteDataRequest) returns (dht.DeleteDataResponse);
     */
    deleteData(input: DeleteDataRequest, options?: RpcOptions): UnaryCall<DeleteDataRequest, DeleteDataResponse>;
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
     * @generated from protobuf rpc: migrateData(dht.MigrateDataRequest) returns (dht.MigrateDataResponse);
     */
    migrateData(input: MigrateDataRequest, options?: RpcOptions): UnaryCall<MigrateDataRequest, MigrateDataResponse> {
        const method = this.methods[1], opt = this._transport.mergeOptions(options);
        return stackIntercept<MigrateDataRequest, MigrateDataResponse>("unary", this._transport, method, opt, input);
    }
    /**
     * @generated from protobuf rpc: deleteData(dht.DeleteDataRequest) returns (dht.DeleteDataResponse);
     */
    deleteData(input: DeleteDataRequest, options?: RpcOptions): UnaryCall<DeleteDataRequest, DeleteDataResponse> {
        const method = this.methods[2], opt = this._transport.mergeOptions(options);
        return stackIntercept<DeleteDataRequest, DeleteDataResponse>("unary", this._transport, method, opt, input);
    }
}
/**
 * @generated from protobuf service dht.RecursiveFindSessionService
 */
export interface IRecursiveFindSessionServiceClient {
    /**
     * @generated from protobuf rpc: sendFindResponse(dht.FindResponse) returns (google.protobuf.Empty);
     */
    sendFindResponse(input: FindResponse, options?: RpcOptions): UnaryCall<FindResponse, Empty>;
}
/**
 * @generated from protobuf service dht.RecursiveFindSessionService
 */
export class RecursiveFindSessionServiceClient implements IRecursiveFindSessionServiceClient, ServiceInfo {
    typeName = RecursiveFindSessionService.typeName;
    methods = RecursiveFindSessionService.methods;
    options = RecursiveFindSessionService.options;
    constructor(private readonly _transport: RpcTransport) {
    }
    /**
     * @generated from protobuf rpc: sendFindResponse(dht.FindResponse) returns (google.protobuf.Empty);
     */
    sendFindResponse(input: FindResponse, options?: RpcOptions): UnaryCall<FindResponse, Empty> {
        const method = this.methods[0], opt = this._transport.mergeOptions(options);
        return stackIntercept<FindResponse, Empty>("unary", this._transport, method, opt, input);
    }
}
/**
 * @generated from protobuf service dht.WebSocketConnectorRpc
 */
export interface IWebSocketConnectorRpcClient {
    /**
     * @generated from protobuf rpc: requestConnection(dht.WebSocketConnectionRequest) returns (dht.WebSocketConnectionResponse);
     */
    requestConnection(input: WebSocketConnectionRequest, options?: RpcOptions): UnaryCall<WebSocketConnectionRequest, WebSocketConnectionResponse>;
}
/**
 * @generated from protobuf service dht.WebSocketConnectorRpc
 */
export class WebSocketConnectorRpcClient implements IWebSocketConnectorRpcClient, ServiceInfo {
    typeName = WebSocketConnectorRpc.typeName;
    methods = WebSocketConnectorRpc.methods;
    options = WebSocketConnectorRpc.options;
    constructor(private readonly _transport: RpcTransport) {
    }
    /**
     * @generated from protobuf rpc: requestConnection(dht.WebSocketConnectionRequest) returns (dht.WebSocketConnectionResponse);
     */
    requestConnection(input: WebSocketConnectionRequest, options?: RpcOptions): UnaryCall<WebSocketConnectionRequest, WebSocketConnectionResponse> {
        const method = this.methods[0], opt = this._transport.mergeOptions(options);
        return stackIntercept<WebSocketConnectionRequest, WebSocketConnectionResponse>("unary", this._transport, method, opt, input);
    }
}
/**
 * @generated from protobuf service dht.WebRtcConnectorRpc
 */
export interface IWebRtcConnectorRpcClient {
    /**
     * @generated from protobuf rpc: requestConnection(dht.WebRtcConnectionRequest) returns (google.protobuf.Empty);
     */
    requestConnection(input: WebRtcConnectionRequest, options?: RpcOptions): UnaryCall<WebRtcConnectionRequest, Empty>;
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
 * @generated from protobuf service dht.WebRtcConnectorRpc
 */
export class WebRtcConnectorRpcClient implements IWebRtcConnectorRpcClient, ServiceInfo {
    typeName = WebRtcConnectorRpc.typeName;
    methods = WebRtcConnectorRpc.methods;
    options = WebRtcConnectorRpc.options;
    constructor(private readonly _transport: RpcTransport) {
    }
    /**
     * @generated from protobuf rpc: requestConnection(dht.WebRtcConnectionRequest) returns (google.protobuf.Empty);
     */
    requestConnection(input: WebRtcConnectionRequest, options?: RpcOptions): UnaryCall<WebRtcConnectionRequest, Empty> {
        const method = this.methods[0], opt = this._transport.mergeOptions(options);
        return stackIntercept<WebRtcConnectionRequest, Empty>("unary", this._transport, method, opt, input);
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
     * @generated from protobuf rpc: gracefulDisconnect(dht.DisconnectNotice) returns (dht.DisconnectNoticeResponse);
     */
    gracefulDisconnect(input: DisconnectNotice, options?: RpcOptions): UnaryCall<DisconnectNotice, DisconnectNoticeResponse>;
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
     * @generated from protobuf rpc: gracefulDisconnect(dht.DisconnectNotice) returns (dht.DisconnectNoticeResponse);
     */
    gracefulDisconnect(input: DisconnectNotice, options?: RpcOptions): UnaryCall<DisconnectNotice, DisconnectNoticeResponse> {
        const method = this.methods[2], opt = this._transport.mergeOptions(options);
        return stackIntercept<DisconnectNotice, DisconnectNoticeResponse>("unary", this._transport, method, opt, input);
    }
}
/**
 * @generated from protobuf service dht.ExternalApiRpc
 */
export interface IExternalApiRpcClient {
    /**
     * @generated from protobuf rpc: findData(dht.FindDataRequest) returns (dht.FindDataResponse);
     */
    findData(input: FindDataRequest, options?: RpcOptions): UnaryCall<FindDataRequest, FindDataResponse>;
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
     * @generated from protobuf rpc: findData(dht.FindDataRequest) returns (dht.FindDataResponse);
     */
    findData(input: FindDataRequest, options?: RpcOptions): UnaryCall<FindDataRequest, FindDataResponse> {
        const method = this.methods[0], opt = this._transport.mergeOptions(options);
        return stackIntercept<FindDataRequest, FindDataResponse>("unary", this._transport, method, opt, input);
    }
    /**
     * @generated from protobuf rpc: externalStoreData(dht.ExternalStoreDataRequest) returns (dht.ExternalStoreDataResponse);
     */
    externalStoreData(input: ExternalStoreDataRequest, options?: RpcOptions): UnaryCall<ExternalStoreDataRequest, ExternalStoreDataResponse> {
        const method = this.methods[1], opt = this._transport.mergeOptions(options);
        return stackIntercept<ExternalStoreDataRequest, ExternalStoreDataResponse>("unary", this._transport, method, opt, input);
    }
}
