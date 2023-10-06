// @generated by protobuf-ts 2.9.1 with parameter server_generic,generate_dependencies,long_type_number
// @generated from protobuf file "packages/trackerless-network/protos/NetworkRpc.proto" (syntax proto3)
// tslint:disable
import { TemporaryConnectionRpc } from "./NetworkRpc";
import type { TemporaryConnectionResponse } from "./NetworkRpc";
import type { TemporaryConnectionRequest } from "./NetworkRpc";
import { NeighborUpdateRpc } from "./NetworkRpc";
import type { NeighborUpdate } from "./NetworkRpc";
import { HandshakeRpc } from "./NetworkRpc";
import type { InterleaveNotice } from "./NetworkRpc";
import type { StreamPartHandshakeResponse } from "./NetworkRpc";
import type { StreamPartHandshakeRequest } from "./NetworkRpc";
import { ProxyConnectionRpc } from "./NetworkRpc";
import type { ProxyConnectionResponse } from "./NetworkRpc";
import type { ProxyConnectionRequest } from "./NetworkRpc";
import type { RpcTransport } from "@protobuf-ts/runtime-rpc";
import type { ServiceInfo } from "@protobuf-ts/runtime-rpc";
import { NetworkRpc } from "./NetworkRpc";
import type { LeaveStreamNotice } from "./NetworkRpc";
import { stackIntercept } from "@protobuf-ts/runtime-rpc";
import type { Empty } from "../../../google/protobuf/empty";
import type { StreamMessage } from "./NetworkRpc";
import type { UnaryCall } from "@protobuf-ts/runtime-rpc";
import type { RpcOptions } from "@protobuf-ts/runtime-rpc";
/**
 * @generated from protobuf service NetworkRpc
 */
export interface INetworkRpcClient {
    /**
     * @generated from protobuf rpc: sendData(StreamMessage) returns (google.protobuf.Empty);
     */
    sendData(input: StreamMessage, options?: RpcOptions): UnaryCall<StreamMessage, Empty>;
    /**
     * @generated from protobuf rpc: leaveStreamNotice(LeaveStreamNotice) returns (google.protobuf.Empty);
     */
    leaveStreamNotice(input: LeaveStreamNotice, options?: RpcOptions): UnaryCall<LeaveStreamNotice, Empty>;
}
/**
 * @generated from protobuf service NetworkRpc
 */
export class NetworkRpcClient implements INetworkRpcClient, ServiceInfo {
    typeName = NetworkRpc.typeName;
    methods = NetworkRpc.methods;
    options = NetworkRpc.options;
    constructor(private readonly _transport: RpcTransport) {
    }
    /**
     * @generated from protobuf rpc: sendData(StreamMessage) returns (google.protobuf.Empty);
     */
    sendData(input: StreamMessage, options?: RpcOptions): UnaryCall<StreamMessage, Empty> {
        const method = this.methods[0], opt = this._transport.mergeOptions(options);
        return stackIntercept<StreamMessage, Empty>("unary", this._transport, method, opt, input);
    }
    /**
     * @generated from protobuf rpc: leaveStreamNotice(LeaveStreamNotice) returns (google.protobuf.Empty);
     */
    leaveStreamNotice(input: LeaveStreamNotice, options?: RpcOptions): UnaryCall<LeaveStreamNotice, Empty> {
        const method = this.methods[1], opt = this._transport.mergeOptions(options);
        return stackIntercept<LeaveStreamNotice, Empty>("unary", this._transport, method, opt, input);
    }
}
/**
 * @generated from protobuf service ProxyConnectionRpc
 */
export interface IProxyConnectionRpcClient {
    /**
     * @generated from protobuf rpc: requestConnection(ProxyConnectionRequest) returns (ProxyConnectionResponse);
     */
    requestConnection(input: ProxyConnectionRequest, options?: RpcOptions): UnaryCall<ProxyConnectionRequest, ProxyConnectionResponse>;
}
/**
 * @generated from protobuf service ProxyConnectionRpc
 */
export class ProxyConnectionRpcClient implements IProxyConnectionRpcClient, ServiceInfo {
    typeName = ProxyConnectionRpc.typeName;
    methods = ProxyConnectionRpc.methods;
    options = ProxyConnectionRpc.options;
    constructor(private readonly _transport: RpcTransport) {
    }
    /**
     * @generated from protobuf rpc: requestConnection(ProxyConnectionRequest) returns (ProxyConnectionResponse);
     */
    requestConnection(input: ProxyConnectionRequest, options?: RpcOptions): UnaryCall<ProxyConnectionRequest, ProxyConnectionResponse> {
        const method = this.methods[0], opt = this._transport.mergeOptions(options);
        return stackIntercept<ProxyConnectionRequest, ProxyConnectionResponse>("unary", this._transport, method, opt, input);
    }
}
/**
 * @generated from protobuf service HandshakeRpc
 */
export interface IHandshakeRpcClient {
    /**
     * @generated from protobuf rpc: handshake(StreamPartHandshakeRequest) returns (StreamPartHandshakeResponse);
     */
    handshake(input: StreamPartHandshakeRequest, options?: RpcOptions): UnaryCall<StreamPartHandshakeRequest, StreamPartHandshakeResponse>;
    /**
     * @generated from protobuf rpc: interleaveNotice(InterleaveNotice) returns (google.protobuf.Empty);
     */
    interleaveNotice(input: InterleaveNotice, options?: RpcOptions): UnaryCall<InterleaveNotice, Empty>;
}
/**
 * @generated from protobuf service HandshakeRpc
 */
export class HandshakeRpcClient implements IHandshakeRpcClient, ServiceInfo {
    typeName = HandshakeRpc.typeName;
    methods = HandshakeRpc.methods;
    options = HandshakeRpc.options;
    constructor(private readonly _transport: RpcTransport) {
    }
    /**
     * @generated from protobuf rpc: handshake(StreamPartHandshakeRequest) returns (StreamPartHandshakeResponse);
     */
    handshake(input: StreamPartHandshakeRequest, options?: RpcOptions): UnaryCall<StreamPartHandshakeRequest, StreamPartHandshakeResponse> {
        const method = this.methods[0], opt = this._transport.mergeOptions(options);
        return stackIntercept<StreamPartHandshakeRequest, StreamPartHandshakeResponse>("unary", this._transport, method, opt, input);
    }
    /**
     * @generated from protobuf rpc: interleaveNotice(InterleaveNotice) returns (google.protobuf.Empty);
     */
    interleaveNotice(input: InterleaveNotice, options?: RpcOptions): UnaryCall<InterleaveNotice, Empty> {
        const method = this.methods[1], opt = this._transport.mergeOptions(options);
        return stackIntercept<InterleaveNotice, Empty>("unary", this._transport, method, opt, input);
    }
}
/**
 * @generated from protobuf service NeighborUpdateRpc
 */
export interface INeighborUpdateRpcClient {
    /**
     * @generated from protobuf rpc: neighborUpdate(NeighborUpdate) returns (NeighborUpdate);
     */
    neighborUpdate(input: NeighborUpdate, options?: RpcOptions): UnaryCall<NeighborUpdate, NeighborUpdate>;
}
/**
 * @generated from protobuf service NeighborUpdateRpc
 */
export class NeighborUpdateRpcClient implements INeighborUpdateRpcClient, ServiceInfo {
    typeName = NeighborUpdateRpc.typeName;
    methods = NeighborUpdateRpc.methods;
    options = NeighborUpdateRpc.options;
    constructor(private readonly _transport: RpcTransport) {
    }
    /**
     * @generated from protobuf rpc: neighborUpdate(NeighborUpdate) returns (NeighborUpdate);
     */
    neighborUpdate(input: NeighborUpdate, options?: RpcOptions): UnaryCall<NeighborUpdate, NeighborUpdate> {
        const method = this.methods[0], opt = this._transport.mergeOptions(options);
        return stackIntercept<NeighborUpdate, NeighborUpdate>("unary", this._transport, method, opt, input);
    }
}
/**
 * @generated from protobuf service TemporaryConnectionRpc
 */
export interface ITemporaryConnectionRpcClient {
    /**
     * @generated from protobuf rpc: openConnection(TemporaryConnectionRequest) returns (TemporaryConnectionResponse);
     */
    openConnection(input: TemporaryConnectionRequest, options?: RpcOptions): UnaryCall<TemporaryConnectionRequest, TemporaryConnectionResponse>;
}
/**
 * @generated from protobuf service TemporaryConnectionRpc
 */
export class TemporaryConnectionRpcClient implements ITemporaryConnectionRpcClient, ServiceInfo {
    typeName = TemporaryConnectionRpc.typeName;
    methods = TemporaryConnectionRpc.methods;
    options = TemporaryConnectionRpc.options;
    constructor(private readonly _transport: RpcTransport) {
    }
    /**
     * @generated from protobuf rpc: openConnection(TemporaryConnectionRequest) returns (TemporaryConnectionResponse);
     */
    openConnection(input: TemporaryConnectionRequest, options?: RpcOptions): UnaryCall<TemporaryConnectionRequest, TemporaryConnectionResponse> {
        const method = this.methods[0], opt = this._transport.mergeOptions(options);
        return stackIntercept<TemporaryConnectionRequest, TemporaryConnectionResponse>("unary", this._transport, method, opt, input);
    }
}
