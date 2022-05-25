import { DhtPeer } from '../../src/dht/DhtPeer'
import { MockConnectionManager } from '../../src/connection/MockConnectionManager'
import { RpcCommunicator } from '../../src/transport/RpcCommunicator'
import { createWrappedClosestPeersRequest, getMockPeers, MockRegisterDhtRpc } from '../utils'
import { Message, MessageType, PeerDescriptor, RpcMessage } from '../../src/proto/DhtRpc'
import { DhtRpcClient } from '../../src/proto/DhtRpc.client'
import { Simulator } from '../../src/connection/Simulator'
import { generateId } from '../../src/helpers/common'

describe('DhtPeer', () => {
    let dhtPeer: DhtPeer
    let clientRpcCommunicator: RpcCommunicator
    let serverRpcCommunicator: RpcCommunicator

    const simulator = new Simulator()

    const clientPeerDescriptor: PeerDescriptor = {
        peerId: generateId('dhtPeer'),
        type: 0
    }
    const serverPeerDescriptor: PeerDescriptor = {
        peerId: generateId('server'),
        type: 0
    }

    beforeEach(() => {
        const mockConnectionLayer1 = new MockConnectionManager(clientPeerDescriptor, simulator)
        clientRpcCommunicator = new RpcCommunicator({
            connectionLayer: mockConnectionLayer1,
            appId: 'unit-test'
        })

        const mockConnectionLayer2 = new MockConnectionManager(serverPeerDescriptor, simulator)
        serverRpcCommunicator = new RpcCommunicator({
            connectionLayer: mockConnectionLayer2,
            appId: 'unit-test'
        })

        serverRpcCommunicator.registerServerMethod('getClosestPeers', MockRegisterDhtRpc.getClosestPeers)
        serverRpcCommunicator.registerServerMethod('ping', MockRegisterDhtRpc.ping)
        serverRpcCommunicator.registerServerMethod('routeMessage', MockRegisterDhtRpc.routeMessage)

        clientRpcCommunicator.setSendFn((peerDescriptor: PeerDescriptor, message: Message) => {
            serverRpcCommunicator.onIncomingMessage(peerDescriptor, message)
        })

        serverRpcCommunicator.setSendFn((peerDescriptor: PeerDescriptor, message: Message) => {
            clientRpcCommunicator.onIncomingMessage(peerDescriptor, message)
        })

        const client = new DhtRpcClient(clientRpcCommunicator.getRpcClientTransport())
        dhtPeer = new DhtPeer(serverPeerDescriptor, client)
    })

    afterEach(() => {
        clientRpcCommunicator.stop()
        serverRpcCommunicator.stop()
    })

    it('Ping happy path', async () => {
        const active = await dhtPeer.ping(clientPeerDescriptor)
        expect(active).toEqual(true)
    })

    it('getClosestPeers happy path', async () => {
        const neighbors = await dhtPeer.getClosestPeers(clientPeerDescriptor)
        expect(neighbors.length).toEqual(getMockPeers().length)
    })

    it('routeMessage happy path', async () => {
        const rpcWrapper = createWrappedClosestPeersRequest(clientPeerDescriptor, serverPeerDescriptor)
        const routed: Message = {
            messageId: 'routed',
            messageType: MessageType.RPC,
            body: RpcMessage.toBinary(rpcWrapper)
        }
        const routable = await dhtPeer.routeMessage({
            messageId: 'routed',
            message: Message.toBinary(routed),
            sourcePeer: clientPeerDescriptor,
            destinationPeer: serverPeerDescriptor,
            appId: 'unit-test'
        })
        expect(routable).toEqual(true)
    })

})