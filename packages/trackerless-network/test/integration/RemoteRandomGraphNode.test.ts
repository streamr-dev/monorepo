import {
    ListeningRpcCommunicator,
    Simulator,
    PeerDescriptor,
    SimulatorTransport,
    peerIdFromPeerDescriptor
} from '@streamr/dht'
import { RemoteRandomGraphNode } from '../../src/logic/RemoteRandomGraphNode'
import { NetworkRpcClient } from '../../src/proto/packages/trackerless-network/protos/NetworkRpc.client'
import {
    LeaveStreamNotice,
    StreamMessage
} from '../../src/proto/packages/trackerless-network/protos/NetworkRpc'
import { Empty } from '../../src/proto/google/protobuf/empty'
import { ServerCallContext } from '@protobuf-ts/runtime-rpc'
import { waitForCondition } from '@streamr/utils'
import { toProtoRpcClient } from '@streamr/proto-rpc'
import { createStreamMessage } from '../utils/utils'
import { StreamPartIDUtils } from '@streamr/protocol'

describe('RemoteRandomGraphNode', () => {
    let mockServerRpc: ListeningRpcCommunicator
    let clientRpc: ListeningRpcCommunicator
    let remoteRandomGraphNode: RemoteRandomGraphNode

    const clientPeer: PeerDescriptor = {
        kademliaId: new Uint8Array([1, 1, 1]),
        type: 1
    }
    const serverPeer: PeerDescriptor = {
        kademliaId: new Uint8Array([2, 2, 2]),
        type: 1
    }

    let recvCounter: number

    let simulator: Simulator
    let mockConnectionManager1: SimulatorTransport
    let mockConnectionManager2: SimulatorTransport

    beforeEach(() => {
        recvCounter = 0
        simulator = new Simulator()
        mockConnectionManager1 = new SimulatorTransport(serverPeer, simulator)
        mockConnectionManager2 = new SimulatorTransport(clientPeer, simulator)
        
        mockServerRpc = new ListeningRpcCommunicator('test', mockConnectionManager1)
        clientRpc = new ListeningRpcCommunicator('test', mockConnectionManager2)

        mockServerRpc.registerRpcNotification(
            StreamMessage,
            'sendData',
            async (_msg: StreamMessage, _context: ServerCallContext): Promise<Empty> => {
                recvCounter += 1
                return Empty
            }
        )

        mockServerRpc.registerRpcNotification(
            LeaveStreamNotice,
            'leaveStreamNotice',
            async (_msg: LeaveStreamNotice, _context: ServerCallContext): Promise<Empty> => {
                recvCounter += 1
                return Empty
            }
        )

        remoteRandomGraphNode = new RemoteRandomGraphNode(
            serverPeer,
            'test-stream',
            toProtoRpcClient(new NetworkRpcClient(clientRpc.getRpcClientTransport()))
        )
    })

    afterEach(async () => {
        clientRpc.stop()
        mockServerRpc.stop()
        await mockConnectionManager1.stop()
        await mockConnectionManager2.stop()
        simulator.stop()
    })

    it('sendData', async () => {
        const msg = createStreamMessage(
            JSON.stringify({ hello: 'WORLD' }),
            StreamPartIDUtils.parse('test-stream#0'),
            peerIdFromPeerDescriptor(clientPeer).value
        )

        await remoteRandomGraphNode.sendData(clientPeer, msg)
        await waitForCondition(() => recvCounter === 1)
    })

    it('leaveNotice', async () => {
        await remoteRandomGraphNode.leaveStreamNotice(clientPeer)
        await waitForCondition(() => recvCounter === 1)
    })

})
