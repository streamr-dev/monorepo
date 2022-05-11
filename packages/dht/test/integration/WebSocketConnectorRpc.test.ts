import { ClientTransport } from '../../src/transport/ClientTransport'
import { ServerTransport } from '../../src/transport/ServerTransport'
import { ITransport } from '../../src/transport/ITransport'
import { RpcCommunicator } from '../../src/transport/RpcCommunicator'
import { WebSocketConnectorClient } from '../../src/proto/DhtRpc.client'
import { generateId } from '../../src/dht/helpers'
import { Message, PeerDescriptor } from '../../src/proto/DhtRpc'
import { MockRegisterWebSocketConnectorRpc } from '../utils'
import { MockConnectionManager } from '../../src/connection/MockConnectionManager'

describe('WebSocketConnectorRpc', () => {
    let clientTransport1: ClientTransport,
        clientTransport2: ClientTransport,
        serverTransport1: ServerTransport,
        serverTransport2: ServerTransport,
        mockConnectionLayer1: ITransport,
        mockConnectionLayer2: ITransport,
        rpcCommunicator1: RpcCommunicator,
        rpcCommunicator2: RpcCommunicator,
        client1: WebSocketConnectorClient,
        client2: WebSocketConnectorClient

    const peerDescriptor1: PeerDescriptor = {
        peerId: generateId('peer1'),
        type: 0
    }

    const peerDescriptor2: PeerDescriptor = {
        peerId: generateId('peer2'),
        type: 0
    }

    beforeEach(() => {
        clientTransport1 = new ClientTransport()
        serverTransport1 = new ServerTransport()
        serverTransport1.registerMethod('requestConnection', MockRegisterWebSocketConnectorRpc.requestConnection)
        mockConnectionLayer1 = new MockConnectionManager()
        rpcCommunicator1 = new RpcCommunicator({
            connectionLayer: mockConnectionLayer1,
            dhtTransportClient: clientTransport1,
            dhtTransportServer: serverTransport1,
            appId: "websocket"
        })

        clientTransport2 = new ClientTransport()
        serverTransport2 = new ServerTransport()
        serverTransport2.registerMethod('requestConnection', MockRegisterWebSocketConnectorRpc.requestConnection)
        mockConnectionLayer2 = new MockConnectionManager()
        rpcCommunicator2 = new RpcCommunicator({
            connectionLayer: mockConnectionLayer2,
            dhtTransportClient: clientTransport2,
            dhtTransportServer: serverTransport2,
            appId: "websocket"
        })

        rpcCommunicator1.setSendFn((peerDescriptor: PeerDescriptor, message: Message) => {
            rpcCommunicator2.onIncomingMessage(peerDescriptor, message)
        })

        rpcCommunicator2.setSendFn((peerDescriptor: PeerDescriptor, message: Message) => {
            rpcCommunicator1.onIncomingMessage(peerDescriptor, message)
        })

        client1 = new WebSocketConnectorClient(clientTransport1)
        client2 = new WebSocketConnectorClient(clientTransport2)
    })

    afterEach(async () => {
        await rpcCommunicator1.stop()
        await rpcCommunicator2.stop()
        await serverTransport1.stop()
        await serverTransport2.stop()
        await clientTransport1.stop()
        await clientTransport2.stop()
    })

    it('Happy path', async () => {
        const response1 = client1.requestConnection({
            requester: peerDescriptor1,
            target: peerDescriptor2,
            ip: '127.0.0.1',
            port: 9099
        },
        { targetDescriptor: peerDescriptor2 },
        )
        const res1 = await response1.response
        await (expect(res1.accepted)).toEqual(true)

        const response2 = client2.requestConnection({
            requester: peerDescriptor2,
            target: peerDescriptor1,
            ip: '127.0.0.1',
            port: 9111
        },
        { targetDescriptor: peerDescriptor1 },
        )
        const res2 = await response2.response
        await (expect(res2.accepted)).toEqual(true)
    })
})
