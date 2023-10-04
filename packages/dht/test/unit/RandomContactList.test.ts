import { RandomContactList } from '../../src/dht/contact/RandomContactList'
import type { ServiceInfo, MethodInfo } from '@protobuf-ts/runtime-rpc'
import { PeerID } from '../../src/helpers/PeerID'
import { toProtoRpcClient } from '@streamr/proto-rpc'
import { IDhtRpcServiceClient } from '../../src/proto/packages/dht/protos/DhtRpc.client'
import { LeaveNotice, NodeType, PeerDescriptor } from '../../src/proto/packages/dht/protos/DhtRpc'
import type { FindDataRequest, FindDataResponse, PingResponse } from '../../src/proto/packages/dht/protos/DhtRpc'
import type { PingRequest } from '../../src/proto/packages/dht/protos/DhtRpc'
import type { ClosestPeersResponse } from '../../src/proto/packages/dht/protos/DhtRpc'
import type { ClosestPeersRequest } from '../../src/proto/packages/dht/protos/DhtRpc'
import { UnaryCall } from '@protobuf-ts/runtime-rpc'
import type { RpcOptions } from '@protobuf-ts/runtime-rpc'
import { DhtPeer } from '../../src/dht/DhtPeer'
import { IMessageType } from '@protobuf-ts/runtime'
import { Empty } from '../../src/proto/google/protobuf/empty'

class MockRpcClient implements IDhtRpcServiceClient, ServiceInfo {
    typeName = 'MockRpcClient'
    methods: MethodInfo<any, any> [] = [
        { name: 'getClosestPeers', O: {} as IMessageType<ClosestPeersResponse> } as MethodInfo<any, any>,
        { name: 'ping', O: {} as IMessageType<PingResponse> } as MethodInfo<any, any>,
        { name: 'findData', O: {} as IMessageType<FindDataRequest> } as MethodInfo<any, any>,
        { name: 'leaveNotice', O: {} as IMessageType<Empty> } as MethodInfo<any, any>
    ]
    options = {}

    // eslint-disable-next-line class-methods-use-this
    getClosestPeers(_input: ClosestPeersRequest, _options?: RpcOptions): UnaryCall<ClosestPeersRequest, ClosestPeersResponse> {
        return {} as UnaryCall<ClosestPeersRequest, ClosestPeersResponse>
    }

    // eslint-disable-next-line class-methods-use-this
    ping(_input: PingRequest, _options?: RpcOptions): UnaryCall <PingRequest, PingResponse> {
        return {} as UnaryCall<PingRequest, PingResponse>
    }

    // eslint-disable-next-line class-methods-use-this
    findData(_input: FindDataRequest, _options?: RpcOptions): UnaryCall<FindDataRequest, FindDataResponse> {
        return {} as UnaryCall<FindDataRequest, FindDataResponse>
    }

    // eslint-disable-next-line class-methods-use-this
    leaveNotice(_input: LeaveNotice, _options?: RpcOptions): UnaryCall<LeaveNotice, Empty> {
        return {} as UnaryCall<LeaveNotice, Empty>
    }
}

const getId = (descriptor: PeerDescriptor): PeerID => {
    return PeerID.fromValue(descriptor.kademliaId)
}

describe('RandomContactList', () => {
    const serviceId = 'random'
    const descriptor0: PeerDescriptor = { kademliaId: new Uint8Array([0, 0, 0, 0]), type: NodeType.NODEJS }
    const descriptor1: PeerDescriptor = { kademliaId: new Uint8Array([0, 0, 0, 1]), type: NodeType.NODEJS }
    const descriptor2: PeerDescriptor = { kademliaId: new Uint8Array([0, 0, 0, 2]), type: NodeType.NODEJS }
    const descriptor3: PeerDescriptor = { kademliaId: new Uint8Array([0, 0, 0, 3]), type: NodeType.NODEJS }
    const descriptor4: PeerDescriptor = { kademliaId: new Uint8Array([0, 0, 0, 4]), type: NodeType.NODEJS }
    const peer1 = new DhtPeer(descriptor0, descriptor1, toProtoRpcClient(new MockRpcClient()), serviceId)
    const peer2 = new DhtPeer(descriptor0, descriptor2, toProtoRpcClient(new MockRpcClient()), serviceId)
    const peer3 = new DhtPeer(descriptor0, descriptor3, toProtoRpcClient(new MockRpcClient()), serviceId)
    const peer4 = new DhtPeer(descriptor0, descriptor4, toProtoRpcClient(new MockRpcClient()), serviceId)

    it('adds contacts correctly', () => {
        const list = new RandomContactList(getId(descriptor0), 5, 1)
        list.addContact(peer1)
        list.addContact(peer2)
        list.addContact(peer3)
        list.addContact(peer3)
        list.addContact(peer4)
        list.addContact(peer4)
        expect(list.getSize()).toEqual(4)
        expect(list.getContacts()).toEqual(
            [peer1, peer2, peer3, peer4]
        )
    })

    it('removes contacts correctly', () => {
        const list = new RandomContactList(getId(descriptor0), 5, 1)
        list.addContact(peer1)
        list.addContact(peer2)
        list.addContact(peer3)
        list.addContact(peer4)
        list.removeContact(getId(descriptor2))
        expect(list.getContact(getId(descriptor1))).toBeTruthy()
        expect(list.getContact(getId(descriptor3))).toBeTruthy()
        expect(list.getContact(getId(descriptor4))).toBeTruthy()
        expect(list.getContacts()).toEqual(
            [peer1, peer3, peer4]
        )
        expect(list.getSize()).toEqual(3)
    })

})
