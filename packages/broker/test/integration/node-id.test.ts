import { startTracker, Tracker } from 'streamr-network'
import { startBroker, createClient, createTestStream } from '../utils'
import { Broker } from '../../src/broker'
import { StreamrClient, Stream, StreamOperation } from 'streamr-client'
import { Wallet } from 'ethers'
import {wait, waitForCondition} from "streamr-test-utils";

const trackerPort = 12740
const broker1WsPort = 12474
const broker2WsPort = 12477

describe('node id: with generateSessionId enabled', () => {
    let sharedWallet: Wallet
    let tracker: Tracker
    let broker1: Broker
    let broker2: Broker
    let client1: StreamrClient
    let client2: StreamrClient
    let stream: Stream

    beforeEach(async () => {
        sharedWallet = Wallet.createRandom()
        tracker = await startTracker({
            host: '127.0.0.1',
            port: trackerPort,
            id: 'tracker-1'
        })
        broker1 = await startBroker({
            name: 'broker1',
            privateKey: sharedWallet.privateKey,
            generateSessionId: true,
            networkPort: 12471,
            trackerPort,
            httpPort: 12473,
            wsPort: broker1WsPort
        })
        broker2 = await startBroker({
            name: 'broker2',
            privateKey: sharedWallet.privateKey,
            generateSessionId: true,
            networkPort: 12475,
            trackerPort,
            httpPort: 12476,
            wsPort: broker2WsPort
        })

        client1 = createClient(broker1WsPort)
        client2 = createClient(broker2WsPort)

        stream = await createTestStream(client1, module)
        stream.grantPermission(StreamOperation.STREAM_GET, undefined)
        stream.grantPermission(StreamOperation.STREAM_SUBSCRIBE, undefined)

        await Promise.all([
            client1.subscribe({
                streamId: stream.id,
                streamPartition: 0
            }),
            client2.subscribe({
                streamId: stream.id,
                streamPartition: 0
            })
        ])

    })

    afterEach(async () => {
        await Promise.all([
            tracker.stop(),
            broker1.stop(),
            broker2.stop(),
            client1.disconnect(),
            client2.disconnect()
        ])
    })

    it('two brokers with same privateKey are assigned separate node ids', async () => {
        await waitForCondition(() => tracker.getNodes().length === 2)
        const actual = tracker.getNodes()
        expect(actual[0]).not.toEqual(actual[1])
        expect(actual[0].startsWith(sharedWallet.address)).toEqual(true)
        expect(actual[1].startsWith(sharedWallet.address)).toEqual(true)
    })
})
