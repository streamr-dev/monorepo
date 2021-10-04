import { Server } from 'http'
import { once } from 'events'
import { Logger, startTracker, Tracker } from 'streamr-network'
import express, { Request, Response} from 'express'
import { Broker } from '../../../../src/broker'
import { createClient, createTestStream, fastPrivateKey, startBroker } from '../../../utils'
import { Stream, StreamOperation } from 'streamr-client'
import { waitForCondition } from '../../../../../test-utils/dist/utils'
import { Wallet } from 'ethers'
import { version as CURRENT_VERSION } from '../../../../package.json'

const logger = new Logger(module)

const TRACKER_PORT = 12461
const LEGACY_WEBSOCKET_PORT = 12462
const CLAIM_SERVER_PORT = 12463
const MOCK_REWARD_CODE = 'mock-reward-code'

const rewardPublisherPrivateKey = fastPrivateKey()

class MockClaimServer {

    server?: Server
    pingEndpointCalled = false
    claimRequestBody: any

    async start() {
        const app = express()
        app.use(express.json())
        app.post('/claim', (req: Request, res: Response) => {
            this.claimRequestBody = req.body
            res.status(200).end()
        })
        app.get('/ping', (_req: Request, res: Response) => {
            logger.info('Ping endpoint called')
            this.pingEndpointCalled = true
            res.status(200).end()
        })
        this.server = app.listen(CLAIM_SERVER_PORT)
        await once(this.server, 'listening')
        return this.server
    }

    async stop() {
        this.server!.close()
        await once(this.server!, 'close')
    }
}

const createRewardStream = async (): Promise<Stream> => {
    const client = createClient(undefined as any, rewardPublisherPrivateKey, {
        autoConnect: false
    })
    const stream = await createTestStream(client, module)
    await Promise.all(
        [StreamOperation.STREAM_GET, StreamOperation.STREAM_SUBSCRIBE].map((op) => stream.grantPermission(op, undefined))
    )
    return stream
}

const publishRewardCode = async (rewardStreamId: string) => {
    const client = createClient(LEGACY_WEBSOCKET_PORT, rewardPublisherPrivateKey)
    await client.publish(rewardStreamId, {
        rewardCode: MOCK_REWARD_CODE
    })
    await client.ensureDisconnected()
}

describe('TestnetMinerPlugin', () => {
    let brokerWallet: Wallet
    let tracker: Tracker
    let broker: Broker
    let claimServer: MockClaimServer
    let rewardStreamId: string

    beforeAll(async () => {
        const rewardStream = await createRewardStream()
        rewardStreamId = rewardStream.id
        claimServer = new MockClaimServer()
        await claimServer.start()
        tracker = await startTracker({
            id: 'tracker',
            listen: {
                hostname: '127.0.0.1',
                port: TRACKER_PORT
            },
        })
        brokerWallet = Wallet.createRandom()
        broker = await startBroker({
            name: 'broker',
            privateKey: brokerWallet.privateKey,
            trackerId: 'tracker',
            trackerPort: TRACKER_PORT,
            wsPort: LEGACY_WEBSOCKET_PORT,
            extraPlugins: {
                testnetMiner: {
                    rewardStreamIds: [rewardStreamId],
                    claimServerUrl: `http://127.0.0.1:${CLAIM_SERVER_PORT}`,
                    stunServerHost: null,
                    maxClaimDelay: 100
                }
            }
        })
    })

    afterAll(async () => {
        await Promise.allSettled([
            broker?.stop(),
            tracker?.stop(),
            claimServer?.stop()
        ])
    })

    it('happy path', async () => {
        expect(claimServer!.pingEndpointCalled).toBeTruthy()
        await publishRewardCode(rewardStreamId)
        await waitForCondition(() => claimServer.claimRequestBody !== undefined)
        expect(claimServer.claimRequestBody.rewardCode).toBe(MOCK_REWARD_CODE)
        expect(claimServer.claimRequestBody.nodeAddress).toBe(brokerWallet.address)
        expect(claimServer.claimRequestBody.clientServerLatency).toBeGreaterThanOrEqual(0)
        expect(claimServer.claimRequestBody.waitTime).toBeGreaterThanOrEqual(0)
        expect(claimServer.claimRequestBody.peers).toEqual([])
    })

    it('tracker is supplied metadata about broker version and nat type', async () => {
        expect(tracker.getAllExtraMetadatas()).toEqual({
            [brokerWallet.address]: {
                natType: null,
                brokerVersion: CURRENT_VERSION
            }
        })
    })
})
