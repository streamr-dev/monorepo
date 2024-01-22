// @generated by protobuf-ts 2.9.3 with parameter server_generic,generate_dependencies,long_type_number
// @generated from protobuf file "packages/trackerless-network/protos/NetworkRpc.proto" (syntax proto3)
// tslint:disable
import { NodeInfoRpc } from "./NetworkRpc";
import type { NodeInfoResponse } from "./NetworkRpc";
import type { NodeInfoRequest } from "./NetworkRpc";
import { TemporaryConnectionRpc } from "./NetworkRpc";
import type { TemporaryConnectionResponse } from "./NetworkRpc";
import type { TemporaryConnectionRequest } from "./NetworkRpc";
import { NeighborUpdateRpc } from "./NetworkRpc";
import type { NeighborUpdate } from "./NetworkRpc";
import { HandshakeRpc } from "./NetworkRpc";
import type { InterleaveResponse } from "./NetworkRpc";
import type { InterleaveRequest } from "./NetworkRpc";
import type { StreamPartHandshakeResponse } from "./NetworkRpc";
import type { StreamPartHandshakeRequest } from "./NetworkRpc";
import { ProxyConnectionRpc } from "./NetworkRpc";
import type { ProxyConnectionResponse } from "./NetworkRpc";
import type { ProxyConnectionRequest } from "./NetworkRpc";
import type { RpcTransport } from "@protobuf-ts/runtime-rpc";
import type { ServiceInfo } from "@protobuf-ts/runtime-rpc";
import { DeliveryRpc } from "./NetworkRpc";
import type { LeaveStreamPartNotice } from "./NetworkRpc";
import { stackIntercept } from "@protobuf-ts/runtime-rpc";
import type { Empty } from "../../../google/protobuf/empty";
import type { StreamMessage } from "./NetworkRpc";
import type { UnaryCall } from "@protobuf-ts/runtime-rpc";
import type { RpcOptions } from "@protobuf-ts/runtime-rpc";
/**
 * @generated from protobuf service DeliveryRpc
 */
export interface IDeliveryRpcClient {
    /**
     * @generated from protobuf rpc: sendStreamMessage(StreamMessage) returns (google.protobuf.Empty);
     */
    sendStreamMessage(input: StreamMessage, options?: RpcOptions): UnaryCall<StreamMessage, Empty>;
    /**
     * @generated from protobuf rpc: leaveStreamPartNotice(LeaveStreamPartNotice) returns (google.protobuf.Empty);
     */
    leaveStreamPartNotice(input: LeaveStreamPartNotice, options?: RpcOptions): UnaryCall<LeaveStreamPartNotice, Empty>;
}
/**
 * @generated from protobuf service DeliveryRpc
 */
export class DeliveryRpcClient implements IDeliveryRpcClient, ServiceInfo {
    typeName = DeliveryRpc.typeName;
    methods = DeliveryRpc.methods;
    options = DeliveryRpc.options;
    constructor(private readonly _transport: RpcTransport) {
    }
    /**
     * @generated from protobuf rpc: sendStreamMessage(StreamMessage) returns (google.protobuf.Empty);
     */
    sendStreamMessage(input: StreamMessage, options?: RpcOptions): UnaryCall<StreamMessage, Empty> {
        const method = this.methods[0], opt = this._transport.mergeOptions(options);
        return stackIntercept<StreamMessage, Empty>("unary", this._transport, method, opt, input);
    }
    /**
     * @generated from protobuf rpc: leaveStreamPartNotice(LeaveStreamPartNotice) returns (google.protobuf.Empty);
     */
    leaveStreamPartNotice(input: LeaveStreamPartNotice, options?: RpcOptions): UnaryCall<LeaveStreamPartNotice, Empty> {
        const method = this.methods[1], opt = this._transport.mergeOptions(options);
        return stackIntercept<LeaveStreamPartNotice, Empty>("unary", this._transport, method, opt, input);
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
     * @generated from protobuf rpc: interleaveRequest(InterleaveRequest) returns (InterleaveResponse);
     */
    interleaveRequest(input: InterleaveRequest, options?: RpcOptions): UnaryCall<InterleaveRequest, InterleaveResponse>;
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
     * @generated from protobuf rpc: interleaveRequest(InterleaveRequest) returns (InterleaveResponse);
     */
    interleaveRequest(input: InterleaveRequest, options?: RpcOptions): UnaryCall<InterleaveRequest, InterleaveResponse> {
        const method = this.methods[1], opt = this._transport.mergeOptions(options);
        return stackIntercept<InterleaveRequest, InterleaveResponse>("unary", this._transport, method, opt, input);
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
/**
 * @generated from protobuf service NodeInfoRpc
 */
export interface INodeInfoRpcClient {
    /**
     * @generated from protobuf rpc: getInfo(NodeInfoRequest) returns (NodeInfoResponse);
     */
    getInfo(input: NodeInfoRequest, options?: RpcOptions): UnaryCall<NodeInfoRequest, NodeInfoResponse>;
}
/**
 * @generated from protobuf service NodeInfoRpc
 */
export class NodeInfoRpcClient implements INodeInfoRpcClient, ServiceInfo {
    typeName = NodeInfoRpc.typeName;
    methods = NodeInfoRpc.methods;
    options = NodeInfoRpc.options;
    constructor(private readonly _transport: RpcTransport) {
    }
    /**
     * @generated from protobuf rpc: getInfo(NodeInfoRequest) returns (NodeInfoResponse);
     */
    getInfo(input: NodeInfoRequest, options?: RpcOptions): UnaryCall<NodeInfoRequest, NodeInfoResponse> {
        const method = this.methods[0], opt = this._transport.mergeOptions(options);
        return stackIntercept<NodeInfoRequest, NodeInfoResponse>("unary", this._transport, method, opt, input);
    }
}
