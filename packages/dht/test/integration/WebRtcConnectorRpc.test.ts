import { RpcCommunicator } from '../../src/transport/RpcCommunicator'
import { Event as RpcIoEvent } from '../../src/transport/IRpcIo'
import { WebRtcConnectorClient } from '../../src/proto/DhtRpc.client'
import {
    IceCandidate,
    NotificationResponse,
    PeerDescriptor,
    RtcAnswer,
    RtcOffer,
    WebRtcConnectionRequest
} from '../../src/proto/DhtRpc'
import { generateId } from '../../src/helpers/common'
import { waitForCondition } from 'streamr-test-utils'
import { IWebRtcConnector } from '../../src/proto/DhtRpc.server'
import { ServerCallContext } from '@protobuf-ts/runtime-rpc'
import { CallContext } from '../../src/rpc-protocol/ServerTransport'

describe('WebRTC rpc messages', () => {
    let rpcCommunicator1: RpcCommunicator
    let rpcCommunicator2: RpcCommunicator
    let client: WebRtcConnectorClient

    let requestConnectionCounter: number
    let rtcOfferCounter: number
    let rtcAnswerCounter: number
    let iceCandidateCounter: number

    const peerDescriptor1: PeerDescriptor = {
        peerId: generateId('peer1'),
        type: 0
    }

    const peerDescriptor2: PeerDescriptor = {
        peerId: generateId('peer2'),
        type: 0
    }

    beforeEach(() => {
        requestConnectionCounter = 0
        rtcOfferCounter = 0
        rtcAnswerCounter = 0
        iceCandidateCounter = 0

        rpcCommunicator1 = new RpcCommunicator()
        const serverFunctions: IWebRtcConnector = {

            requestConnection: async (_urequest: WebRtcConnectionRequest, _context: ServerCallContext): Promise<NotificationResponse> => {
                requestConnectionCounter += 1
                const res: NotificationResponse = {
                    sent: true
                }
                return res
            },

            rtcOffer: async (_urequest: RtcOffer, _context: ServerCallContext): Promise<NotificationResponse> => {
                rtcOfferCounter += 1
                const res: NotificationResponse = {
                    sent: true
                }
                return res
            },

            rtcAnswer: async (_urequest: RtcAnswer, _context: ServerCallContext): Promise<NotificationResponse> => {
                rtcAnswerCounter += 1
                const res: NotificationResponse = {
                    sent: true
                }
                return res
            },

            iceCandidate: async (_urequest: IceCandidate, _context: ServerCallContext): Promise<NotificationResponse> => {
                iceCandidateCounter += 1
                const res: NotificationResponse = {
                    sent: true
                }
                return res
            }
        }

        rpcCommunicator2 = new RpcCommunicator()
        rpcCommunicator2.registerRpcNotification(RtcOffer, 'rtcOffer', serverFunctions.rtcOffer)
        rpcCommunicator2.registerRpcNotification(RtcAnswer, 'rtcAnswer', serverFunctions.rtcAnswer)
        rpcCommunicator2.registerRpcNotification(IceCandidate, 'iceCandidate', serverFunctions.iceCandidate)
        rpcCommunicator2.registerRpcNotification(WebRtcConnectionRequest, 'requestConnection', serverFunctions.requestConnection)

        rpcCommunicator1.on(RpcIoEvent.OUTGOING_MESSAGE, (message: Uint8Array, _ucallContext?: CallContext) => {
            rpcCommunicator2.handleIncomingMessage(message)
        })

        rpcCommunicator2.on(RpcIoEvent.OUTGOING_MESSAGE, (message: Uint8Array, _ucallContext?: CallContext) => {
            rpcCommunicator1.handleIncomingMessage(message)
        })

        client = new WebRtcConnectorClient(rpcCommunicator1.getRpcClientTransport())
    })

    afterEach(async () => {
        await rpcCommunicator1.stop()
        await rpcCommunicator2.stop()
    })

    it('send connectionRequest', async () => {
        const response = client.requestConnection({
            requester: peerDescriptor1,
            target: peerDescriptor2,
            connectionId: 'connectionRequest'
        },
        { targetDescriptor: peerDescriptor2, notification: true }
        )
        const res = await response.response
        await (expect(res.sent)).toEqual(true)
        await waitForCondition(() => requestConnectionCounter === 1)
    })

    it('send rtcOffer', async () => {
        const response = client.rtcOffer({
            requester: peerDescriptor1,
            target: peerDescriptor2,
            connectionId: 'rtcOffer',
            description: 'aaaaaa'
        },
        { targetDescriptor: peerDescriptor2, notification: true }
        )
        const res = await response.response
        await (expect(res.sent)).toEqual(true)
        await waitForCondition(() => rtcOfferCounter === 1)
    })

    it('send rtcAnswer', async () => {
        const response = client.rtcAnswer({
            requester: peerDescriptor1,
            target: peerDescriptor2,
            connectionId: 'rtcOffer',
            description: 'aaaaaa'
        },
        { targetDescriptor: peerDescriptor2, notification: true }
        )
        const res = await response.response
        await (expect(res.sent)).toEqual(true)
        await waitForCondition(() => rtcAnswerCounter === 1)
    })

    it('send iceCandidate', async () => {
        const response = client.iceCandidate({
            requester: peerDescriptor1,
            target: peerDescriptor2,
            connectionId: 'rtcOffer',
            candidate: 'aaaaaa',
            mid: 'asdasdasdasdasd'
        },
        { targetDescriptor: peerDescriptor2, notification: true }
        )
        const res = await response.response
        await (expect(res.sent)).toEqual(true)
        await waitForCondition(() => iceCandidateCounter === 1)
    })
})