// @generated by protobuf-ts 2.8.0 with parameter server_generic,generate_dependencies
// @generated from protobuf file "packages/dht/protos/DhtRpc.proto" (syntax proto3)
// tslint:disable
import { ConnectionLocker } from "./DhtRpc";
import type { UnlockRequest } from "./DhtRpc";
import type { LockResponse } from "./DhtRpc";
import type { LockRequest } from "./DhtRpc";
import { WebRtcConnector } from "./DhtRpc";
import type { IceCandidate } from "./DhtRpc";
import type { RtcAnswer } from "./DhtRpc";
import type { RtcOffer } from "./DhtRpc";
import type { Empty } from "../../../google/protobuf/empty";
import type { WebRtcConnectionRequest } from "./DhtRpc";
import { WebSocketConnector } from "./DhtRpc";
import type { WebSocketConnectionResponse } from "./DhtRpc";
import type { WebSocketConnectionRequest } from "./DhtRpc";
import type { RpcTransport } from "@protobuf-ts/runtime-rpc";
import type { ServiceInfo } from "@protobuf-ts/runtime-rpc";
import { DhtRpc } from "./DhtRpc";
import type { RouteMessageAck } from "./DhtRpc";
import type { RouteMessageWrapper } from "./DhtRpc";
import type { PingResponse } from "./DhtRpc";
import type { PingRequest } from "./DhtRpc";
import { stackIntercept } from "@protobuf-ts/runtime-rpc";
import type { ClosestPeersResponse } from "./DhtRpc";
import type { ClosestPeersRequest } from "./DhtRpc";
import type { UnaryCall } from "@protobuf-ts/runtime-rpc";
import type { RpcOptions } from "@protobuf-ts/runtime-rpc";
/**
 * @generated from protobuf service DhtRpc
 */
export interface IDhtRpcClient {
    /**
     * @generated from protobuf rpc: getClosestPeers(ClosestPeersRequest) returns (ClosestPeersResponse);
     */
    getClosestPeers(input: ClosestPeersRequest, options?: RpcOptions): UnaryCall<ClosestPeersRequest, ClosestPeersResponse>;
    /**
     * @generated from protobuf rpc: ping(PingRequest) returns (PingResponse);
     */
    ping(input: PingRequest, options?: RpcOptions): UnaryCall<PingRequest, PingResponse>;
    /**
     * @generated from protobuf rpc: routeMessage(RouteMessageWrapper) returns (RouteMessageAck);
     */
    routeMessage(input: RouteMessageWrapper, options?: RpcOptions): UnaryCall<RouteMessageWrapper, RouteMessageAck>;
}
/**
 * @generated from protobuf service DhtRpc
 */
export class DhtRpcClient implements IDhtRpcClient, ServiceInfo {
    typeName = DhtRpc.typeName;
    methods = DhtRpc.methods;
    options = DhtRpc.options;
    constructor(private readonly _transport: RpcTransport) {
    }
    /**
     * @generated from protobuf rpc: getClosestPeers(ClosestPeersRequest) returns (ClosestPeersResponse);
     */
    getClosestPeers(input: ClosestPeersRequest, options?: RpcOptions): UnaryCall<ClosestPeersRequest, ClosestPeersResponse> {
        const method = this.methods[0], opt = this._transport.mergeOptions(options);
        return stackIntercept<ClosestPeersRequest, ClosestPeersResponse>("unary", this._transport, method, opt, input);
    }
    /**
     * @generated from protobuf rpc: ping(PingRequest) returns (PingResponse);
     */
    ping(input: PingRequest, options?: RpcOptions): UnaryCall<PingRequest, PingResponse> {
        const method = this.methods[1], opt = this._transport.mergeOptions(options);
        return stackIntercept<PingRequest, PingResponse>("unary", this._transport, method, opt, input);
    }
    /**
     * @generated from protobuf rpc: routeMessage(RouteMessageWrapper) returns (RouteMessageAck);
     */
    routeMessage(input: RouteMessageWrapper, options?: RpcOptions): UnaryCall<RouteMessageWrapper, RouteMessageAck> {
        const method = this.methods[2], opt = this._transport.mergeOptions(options);
        return stackIntercept<RouteMessageWrapper, RouteMessageAck>("unary", this._transport, method, opt, input);
    }
}
/**
 * @generated from protobuf service WebSocketConnector
 */
export interface IWebSocketConnectorClient {
    /**
     * @generated from protobuf rpc: requestConnection(WebSocketConnectionRequest) returns (WebSocketConnectionResponse);
     */
    requestConnection(input: WebSocketConnectionRequest, options?: RpcOptions): UnaryCall<WebSocketConnectionRequest, WebSocketConnectionResponse>;
}
/**
 * @generated from protobuf service WebSocketConnector
 */
export class WebSocketConnectorClient implements IWebSocketConnectorClient, ServiceInfo {
    typeName = WebSocketConnector.typeName;
    methods = WebSocketConnector.methods;
    options = WebSocketConnector.options;
    constructor(private readonly _transport: RpcTransport) {
    }
    /**
     * @generated from protobuf rpc: requestConnection(WebSocketConnectionRequest) returns (WebSocketConnectionResponse);
     */
    requestConnection(input: WebSocketConnectionRequest, options?: RpcOptions): UnaryCall<WebSocketConnectionRequest, WebSocketConnectionResponse> {
        const method = this.methods[0], opt = this._transport.mergeOptions(options);
        return stackIntercept<WebSocketConnectionRequest, WebSocketConnectionResponse>("unary", this._transport, method, opt, input);
    }
}
/**
 * @generated from protobuf service WebRtcConnector
 */
export interface IWebRtcConnectorClient {
    /**
     * @generated from protobuf rpc: requestConnection(WebRtcConnectionRequest) returns (google.protobuf.Empty);
     */
    requestConnection(input: WebRtcConnectionRequest, options?: RpcOptions): UnaryCall<WebRtcConnectionRequest, Empty>;
    /**
     * @generated from protobuf rpc: rtcOffer(RtcOffer) returns (google.protobuf.Empty);
     */
    rtcOffer(input: RtcOffer, options?: RpcOptions): UnaryCall<RtcOffer, Empty>;
    /**
     * @generated from protobuf rpc: rtcAnswer(RtcAnswer) returns (google.protobuf.Empty);
     */
    rtcAnswer(input: RtcAnswer, options?: RpcOptions): UnaryCall<RtcAnswer, Empty>;
    /**
     * @generated from protobuf rpc: iceCandidate(IceCandidate) returns (google.protobuf.Empty);
     */
    iceCandidate(input: IceCandidate, options?: RpcOptions): UnaryCall<IceCandidate, Empty>;
}
/**
 * @generated from protobuf service WebRtcConnector
 */
export class WebRtcConnectorClient implements IWebRtcConnectorClient, ServiceInfo {
    typeName = WebRtcConnector.typeName;
    methods = WebRtcConnector.methods;
    options = WebRtcConnector.options;
    constructor(private readonly _transport: RpcTransport) {
    }
    /**
     * @generated from protobuf rpc: requestConnection(WebRtcConnectionRequest) returns (google.protobuf.Empty);
     */
    requestConnection(input: WebRtcConnectionRequest, options?: RpcOptions): UnaryCall<WebRtcConnectionRequest, Empty> {
        const method = this.methods[0], opt = this._transport.mergeOptions(options);
        return stackIntercept<WebRtcConnectionRequest, Empty>("unary", this._transport, method, opt, input);
    }
    /**
     * @generated from protobuf rpc: rtcOffer(RtcOffer) returns (google.protobuf.Empty);
     */
    rtcOffer(input: RtcOffer, options?: RpcOptions): UnaryCall<RtcOffer, Empty> {
        const method = this.methods[1], opt = this._transport.mergeOptions(options);
        return stackIntercept<RtcOffer, Empty>("unary", this._transport, method, opt, input);
    }
    /**
     * @generated from protobuf rpc: rtcAnswer(RtcAnswer) returns (google.protobuf.Empty);
     */
    rtcAnswer(input: RtcAnswer, options?: RpcOptions): UnaryCall<RtcAnswer, Empty> {
        const method = this.methods[2], opt = this._transport.mergeOptions(options);
        return stackIntercept<RtcAnswer, Empty>("unary", this._transport, method, opt, input);
    }
    /**
     * @generated from protobuf rpc: iceCandidate(IceCandidate) returns (google.protobuf.Empty);
     */
    iceCandidate(input: IceCandidate, options?: RpcOptions): UnaryCall<IceCandidate, Empty> {
        const method = this.methods[3], opt = this._transport.mergeOptions(options);
        return stackIntercept<IceCandidate, Empty>("unary", this._transport, method, opt, input);
    }
}
/**
 * @generated from protobuf service ConnectionLocker
 */
export interface IConnectionLockerClient {
    /**
     * @generated from protobuf rpc: lockRequest(LockRequest) returns (LockResponse);
     */
    lockRequest(input: LockRequest, options?: RpcOptions): UnaryCall<LockRequest, LockResponse>;
    /**
     * @generated from protobuf rpc: unlockRequest(UnlockRequest) returns (google.protobuf.Empty);
     */
    unlockRequest(input: UnlockRequest, options?: RpcOptions): UnaryCall<UnlockRequest, Empty>;
}
/**
 * @generated from protobuf service ConnectionLocker
 */
export class ConnectionLockerClient implements IConnectionLockerClient, ServiceInfo {
    typeName = ConnectionLocker.typeName;
    methods = ConnectionLocker.methods;
    options = ConnectionLocker.options;
    constructor(private readonly _transport: RpcTransport) {
    }
    /**
     * @generated from protobuf rpc: lockRequest(LockRequest) returns (LockResponse);
     */
    lockRequest(input: LockRequest, options?: RpcOptions): UnaryCall<LockRequest, LockResponse> {
        const method = this.methods[0], opt = this._transport.mergeOptions(options);
        return stackIntercept<LockRequest, LockResponse>("unary", this._transport, method, opt, input);
    }
    /**
     * @generated from protobuf rpc: unlockRequest(UnlockRequest) returns (google.protobuf.Empty);
     */
    unlockRequest(input: UnlockRequest, options?: RpcOptions): UnaryCall<UnlockRequest, Empty> {
        const method = this.methods[1], opt = this._transport.mergeOptions(options);
        return stackIntercept<UnlockRequest, Empty>("unary", this._transport, method, opt, input);
    }
}
