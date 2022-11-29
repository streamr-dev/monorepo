import { Tracker, startTracker } from '@streamr/network-tracker'
import { NetworkNode } from '../../src/logic/NetworkNode'
import {
    MessageID,
    MessageRef,
    StreamMessage,
    StreamPartIDUtils,
    toStreamID
} from '@streamr/protocol'
import { toEthereumAddress, waitForEvent, waitForCondition } from '@streamr/utils'

import { Event as NodeEvent } from '../../src/logic/Node'
import { createTestNetworkNode } from '../utils'

const PUBLISHER_ID = toEthereumAddress('0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')

describe('message propagation in network', () => {
    let tracker: Tracker
    let n1: NetworkNode
    let n2: NetworkNode
    let n3: NetworkNode
    let n4: NetworkNode

    beforeAll(async () => {
        tracker = await startTracker({
            listen: {
                hostname: '127.0.0.1',
                port: 33300
            }
        })
        const trackerInfo = tracker.getConfigRecord()

        n1 = createTestNetworkNode({
            id: 'node-1',
            trackers: [trackerInfo],
            disconnectionWaitTime: 200,
            webrtcDisallowPrivateAddresses: false
        })
        n2 = createTestNetworkNode({
            id: 'node-2',
            trackers: [trackerInfo],
            disconnectionWaitTime: 200,
            webrtcDisallowPrivateAddresses: false
        })
        n3 = createTestNetworkNode({
            id: 'node-3',
            trackers: [trackerInfo],
            disconnectionWaitTime: 200,
            webrtcDisallowPrivateAddresses: false
        })
        n4 = createTestNetworkNode({
            id: 'node-4',
            trackers: [trackerInfo],
            disconnectionWaitTime: 200,
            webrtcDisallowPrivateAddresses: false
        })

        ;[n1, n2, n3, n4].forEach((node) => node.start())
    })

    afterAll(async () => {
        await Promise.allSettled([
            tracker.stop(),
            n1.stop(),
            n2.stop(),
            n3.stop(),
            n4.stop()
        ])
    })

    it('messages are delivered to nodes in the network according to stream subscriptions', async () => {
        const n1Messages: any[] = []
        const n2Messages: any[] = []
        const n3Messages: any[] = []
        const n4Messages: any[] = []

        n1.addMessageListener((streamMessage) => n1Messages.push({
            streamId: streamMessage.messageId.streamId,
            streamPartition: streamMessage.messageId.streamPartition,
            payload: streamMessage.getParsedContent()
        }))
        n2.addMessageListener((streamMessage) => n2Messages.push({
            streamId: streamMessage.messageId.streamId,
            streamPartition: streamMessage.messageId.streamPartition,
            payload: streamMessage.getParsedContent()
        }))
        n3.addMessageListener((streamMessage) => n3Messages.push({
            streamId: streamMessage.messageId.streamId,
            streamPartition: streamMessage.messageId.streamPartition,
            payload: streamMessage.getParsedContent()
        }))
        n4.addMessageListener((streamMessage) => n4Messages.push({
            streamId: streamMessage.messageId.streamId,
            streamPartition: streamMessage.messageId.streamPartition,
            payload: streamMessage.getParsedContent()
        }))

        const streamPartId = StreamPartIDUtils.parse('stream-1#0')
        n2.subscribe(streamPartId)
        n3.subscribe(streamPartId)

        await Promise.all([
            waitForEvent(n2, NodeEvent.NODE_SUBSCRIBED),
            waitForEvent(n3, NodeEvent.NODE_SUBSCRIBED)
        ])

        for (let i = 1; i <= 5; ++i) {
            n1.publish(new StreamMessage({
                messageId: new MessageID(toStreamID('stream-1'), 0, i, 0, PUBLISHER_ID, 'msgChainId'),
                prevMsgRef: i === 1 ? null : new MessageRef(i - 1, 0),
                content: {
                    messageNo: i
                },
                signature: 'signature'
            }))

            n4.publish(new StreamMessage({
                messageId: new MessageID(toStreamID('stream-2'), 0, i * 100, 0, PUBLISHER_ID, 'msgChainId'),
                prevMsgRef: i === 1 ? null : new MessageRef((i - 1) * 100, 0),
                content: {
                    messageNo: i * 100
                },
                signature: 'signature'
            }))
        }

        await waitForCondition(() => n1Messages.length === 5, 8000)
        await waitForCondition(() => n2Messages.length === 5, 8000)
        await waitForCondition(() => n3Messages.length === 5, 8000)

        expect(n1Messages).toEqual([
            {
                streamId: 'stream-1',
                streamPartition: 0,
                payload: {
                    messageNo: 1
                }
            },
            {
                streamId: 'stream-1',
                streamPartition: 0,
                payload: {
                    messageNo: 2
                }
            },
            {
                streamId: 'stream-1',
                streamPartition: 0,
                payload: {
                    messageNo: 3
                }
            },
            {
                streamId: 'stream-1',
                streamPartition: 0,
                payload: {
                    messageNo: 4
                }
            },
            {
                streamId: 'stream-1',
                streamPartition: 0,
                payload: {
                    messageNo: 5
                }
            }
        ])
        expect(n2Messages).toEqual(n1Messages)
        expect(n3Messages).toEqual(n2Messages)
        expect(n4Messages).toEqual([
            {
                streamId: 'stream-2',
                streamPartition: 0,
                payload: {
                    messageNo: 100
                },
            },
            {
                streamId: 'stream-2',
                streamPartition: 0,
                payload: {
                    messageNo: 200
                },
            },
            {
                streamId: 'stream-2',
                streamPartition: 0,
                payload: {
                    messageNo: 300
                },
            },
            {
                streamId: 'stream-2',
                streamPartition: 0,
                payload: {
                    messageNo: 400
                },
            },
            {
                streamId: 'stream-2',
                streamPartition: 0,
                payload: {
                    messageNo: 500
                },
            }
        ])
    })
})
