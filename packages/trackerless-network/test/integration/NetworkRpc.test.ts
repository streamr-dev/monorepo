import {
    RpcCommunicator,
    ProtoCallContext,
    ProtoRpcClient,
    toProtoRpcClient
} from '@streamr/proto-rpc'
import { NetworkRpcClient } from '../../src/proto/packages/trackerless-network/protos/NetworkRpc.client'
import { StreamMessage } from '../../src/proto/packages/trackerless-network/protos/NetworkRpc'
import { waitForCondition } from '@streamr/utils'
import { Empty } from '../../src/proto/google/protobuf/empty'
import { ServerCallContext } from '@protobuf-ts/runtime-rpc'
import { createStreamMessage } from '../utils/utils'
import { RpcMessage } from '../../src/proto/packages/proto-rpc/protos/ProtoRpc'
import { Simulator } from '@streamr/dht'
import { StreamPartIDUtils } from '@streamr/protocol'
import { randomEthereumAddress } from '@streamr/test-utils'

describe('Network RPC', () => {
    let rpcCommunicator1: RpcCommunicator
    let rpcCommunicator2: RpcCommunicator
    let client: ProtoRpcClient<NetworkRpcClient>
    let recvCounter = 0

    beforeEach(() => {
        Simulator.useFakeTimers()
        rpcCommunicator1 = new RpcCommunicator()
        rpcCommunicator2 = new RpcCommunicator()
        rpcCommunicator1.on('outgoingMessage', (message: RpcMessage, _requestId: string, _ucallContext?: ProtoCallContext) => {
            rpcCommunicator2.handleIncomingMessage(message)
        })
        client = toProtoRpcClient(new NetworkRpcClient(rpcCommunicator1.getRpcClientTransport()))
        rpcCommunicator2.registerRpcNotification(
            StreamMessage,
            'sendData',
            async (_msg: StreamMessage, _context: ServerCallContext): Promise<Empty> => {
                recvCounter += 1
                return {}
            }
        )
    })

    afterEach(() => {
        rpcCommunicator1.stop()
        rpcCommunicator2.stop()
        Simulator.useFakeTimers(false)
    })

    it('sends Data', async () => {
        const msg = createStreamMessage(
            JSON.stringify({ hello: 'WORLD' }),
            StreamPartIDUtils.parse('testStream#0'),
            randomEthereumAddress()
        )
        await client.sendData(msg)
        await waitForCondition(() => recvCounter === 1)
    })
})
