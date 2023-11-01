// @generated by protobuf-ts 2.9.1 with parameter server_generic,generate_dependencies,long_type_number
// @generated from protobuf file "packages/dht/protos/DhtRpc.proto" (package "dht", syntax proto3)
// tslint:disable
import { ExternalApiService } from "./DhtRpc";
import type { ExternalStoreDataResponse } from "./DhtRpc";
import type { ExternalStoreDataRequest } from "./DhtRpc";
import type { FindDataResponse } from "./DhtRpc";
import type { FindDataRequest } from "./DhtRpc";
import { ConnectionLocker } from "./DhtRpc";
import type { DisconnectNoticeResponse } from "./DhtRpc";
import type { DisconnectNotice } from "./DhtRpc";
import type { UnlockRequest } from "./DhtRpc";
import type { LockResponse } from "./DhtRpc";
import type { LockRequest } from "./DhtRpc";
import { WebRtcConnectorService } from "./DhtRpc";
import type { IceCandidate } from "./DhtRpc";
import type { RtcAnswer } from "./DhtRpc";
import type { RtcOffer } from "./DhtRpc";
import type { WebRtcConnectionRequest } from "./DhtRpc";
import { WebSocketConnectorService } from "./DhtRpc";
import type { WebSocketConnectionResponse } from "./DhtRpc";
import type { WebSocketConnectionRequest } from "./DhtRpc";
import { RecursiveFindSessionService } from "./DhtRpc";
import type { FindResponse } from "./DhtRpc";
import { StoreService } from "./DhtRpc";
import type { DeleteDataResponse } from "./DhtRpc";
import type { DeleteDataRequest } from "./DhtRpc";
import type { MigrateDataResponse } from "./DhtRpc";
import type { MigrateDataRequest } from "./DhtRpc";
import type { StoreDataResponse } from "./DhtRpc";
import type { StoreDataRequest } from "./DhtRpc";
import { RoutingService } from "./DhtRpc";
import type { RouteMessageAck } from "./DhtRpc";
import type { RouteMessageWrapper } from "./DhtRpc";
import type { RpcTransport } from "@protobuf-ts/runtime-rpc";
import type { ServiceInfo } from "@protobuf-ts/runtime-rpc";
import { DhtRpcService } from "./DhtRpc";
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
 * @generated from protobuf service dht.DhtRpcService
 */
export interface IDhtRpcServiceClient {
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
 * @generated from protobuf service dht.DhtRpcService
 */
export class DhtRpcServiceClient implements IDhtRpcServiceClient, ServiceInfo {
    typeName = DhtRpcService.typeName;
    methods = DhtRpcService.methods;
    options = DhtRpcService.options;
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
 * @generated from protobuf service dht.RoutingService
 */
export interface IRoutingServiceClient {
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
 * @generated from protobuf service dht.RoutingService
 */
export class RoutingServiceClient implements IRoutingServiceClient, ServiceInfo {
    typeName = RoutingService.typeName;
    methods = RoutingService.methods;
    options = RoutingService.options;
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
 * @generated from protobuf service dht.StoreService
 */
export interface IStoreServiceClient {
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
 * @generated from protobuf service dht.StoreService
 */
export class StoreServiceClient implements IStoreServiceClient, ServiceInfo {
    typeName = StoreService.typeName;
    methods = StoreService.methods;
    options = StoreService.options;
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
 * @generated from protobuf service dht.WebSocketConnectorService
 */
export interface IWebSocketConnectorServiceClient {
    /**
     * @generated from protobuf rpc: requestConnection(dht.WebSocketConnectionRequest) returns (dht.WebSocketConnectionResponse);
     */
    requestConnection(input: WebSocketConnectionRequest, options?: RpcOptions): UnaryCall<WebSocketConnectionRequest, WebSocketConnectionResponse>;
}
/**
 * @generated from protobuf service dht.WebSocketConnectorService
 */
export class WebSocketConnectorServiceClient implements IWebSocketConnectorServiceClient, ServiceInfo {
    typeName = WebSocketConnectorService.typeName;
    methods = WebSocketConnectorService.methods;
    options = WebSocketConnectorService.options;
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
 * @generated from protobuf service dht.WebRtcConnectorService
 */
export interface IWebRtcConnectorServiceClient {
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
 * @generated from protobuf service dht.WebRtcConnectorService
 */
export class WebRtcConnectorServiceClient implements IWebRtcConnectorServiceClient, ServiceInfo {
    typeName = WebRtcConnectorService.typeName;
    methods = WebRtcConnectorService.methods;
    options = WebRtcConnectorService.options;
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
 * @generated from protobuf service dht.ConnectionLocker
 */
export interface IConnectionLockerClient {
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
 * @generated from protobuf service dht.ConnectionLocker
 */
export class ConnectionLockerClient implements IConnectionLockerClient, ServiceInfo {
    typeName = ConnectionLocker.typeName;
    methods = ConnectionLocker.methods;
    options = ConnectionLocker.options;
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
 * @generated from protobuf service dht.ExternalApiService
 */
export interface IExternalApiServiceClient {
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
 * @generated from protobuf service dht.ExternalApiService
 */
export class ExternalApiServiceClient implements IExternalApiServiceClient, ServiceInfo {
    typeName = ExternalApiService.typeName;
    methods = ExternalApiService.methods;
    options = ExternalApiService.options;
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
