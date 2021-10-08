import fetchNatType from 'nat-type-identifier'
import { Logger } from 'streamr-network'
import { wait } from 'streamr-test-utils'
import { Metrics } from 'streamr-network/dist/helpers/MetricsContext'
import { Plugin, PluginOptions } from '../../Plugin'
import PLUGIN_CONFIG_SCHEMA from './config.schema.json'
import { scheduleAtInterval } from '../../helpers/scheduler'
import { withTimeout } from '../../helpers/withTimeout'
import { fetchOrThrow } from '../../helpers/fetch'
import { version as CURRENT_VERSION } from '../../../package.json'

const REWARD_STREAM_PARTITION = 0
const LATENCY_POLL_INTERVAL = 30 * 60 * 1000
const NAT_ANALYSIS_SAMPLE_COUNT = 5
const NAT_ANALYSIS_TIMEOUT = {
    maxWaitTime: 60 * 1000,
    errorCode: 'NAT_ANALYSIS_TIMEOUT'
}
const NAT_TYPE_UNKNOWN = 'Unknown'
const METRIC_CONTEXT_NAME = 'broker/plugin/testnetMiner'
const METRIC_LATEST_CODE = 'latestCode'

const logger = new Logger(module)

export interface TestnetMinerPluginConfig {
    rewardStreamIds: string
    claimServerUrl: string
    maxClaimDelay: number
    stunServerHost: string|null
}

interface Peer {
    id: string
    rtt: number|undefined
}

export class TestnetMinerPlugin extends Plugin<TestnetMinerPluginConfig> {

    latestLatency?: number
    latencyPoller?: { stop: () => void }
    natType?: string
    metrics: Metrics
    dummyMessagesReceived: number
    rewardSubscriptionRetryRef: NodeJS.Timeout | null
    subscriptionRetryInterval: number
    streamId: string

    constructor(options: PluginOptions) {
        super(options)
        if (this.streamrClient === undefined) {
            throw new Error('StreamrClient is not available')
        }
        this.metrics = this.metricsContext.create(METRIC_CONTEXT_NAME).addFixedMetric(METRIC_LATEST_CODE)
        this.dummyMessagesReceived = 0
        this.rewardSubscriptionRetryRef = null
        this.subscriptionRetryInterval = 3 * 60 * 1000
        this.streamId = this.pluginConfig.rewardStreamIds[Math.floor(Math.random()*this.pluginConfig.rewardStreamIds.length)]
    }

    async start() {
        this.latencyPoller = await scheduleAtInterval(async () => {
            this.latestLatency = await this.getLatency()
        }, LATENCY_POLL_INTERVAL, true)
        if (this.pluginConfig.stunServerHost !== null) {
            this.natType = await this.getNatType()
        }
        this.networkNode.setExtraMetadata({
            natType: this.natType || null,
            brokerVersion: CURRENT_VERSION,
        })

        await this.subscribe()

        this.rewardSubscriptionRetryRef = setTimeout(() => this.subscriptionIntervalFn(), this.subscriptionRetryInterval)

        logger.info('Testnet miner plugin started')
    }

    private async onRewardCodeReceived(rewardCode: string): Promise<void> {
        logger.info(`Reward code received: ${rewardCode}`)
        this.metrics.set(METRIC_LATEST_CODE, Date.now())
        const peers = this.getPeers()
        const delay = Math.floor(Math.random() * this.pluginConfig.maxClaimDelay)
        await wait(delay) 
        await this.claimRewardCode(rewardCode, peers, delay)
    }

    private async subscriptionIntervalFn(): Promise<void> {
        if (this.streamrClient && this.streamrClient.getSubscriptions(this.streamId).length === 0) {
            try {
                await this.subscribe()
            } catch (err) {
                logger.warn(`Subscription retry failed, retrying in ${this.subscriptionRetryInterval / 1000} seconds`)
            }
        }
        this.rewardSubscriptionRetryRef = setTimeout(() => this.subscriptionIntervalFn(), this.subscriptionRetryInterval)
    }

    private async subscribe(): Promise<void> {
        await this.streamrClient!.subscribe(this.streamId, (message: any) => {
            if (message.rewardCode) {
                this.onRewardCodeReceived(message.rewardCode)
            } if (message.info) {
                logger.info(message.info)
            } else {
                logger.trace(`Dummy message (#${this.dummyMessagesReceived}) received: ${message}`)
                this.dummyMessagesReceived += 1
            }
        })
    }

    private getPeers(): Peer[] {
        const neighbors = this.networkNode.getNeighborsForStream(this.streamId, REWARD_STREAM_PARTITION)
        return neighbors.map((nodeId: string) => ({
            id: nodeId,
            rtt: this.networkNode.getRtt(nodeId)
        }))
    }

    private async claimRewardCode(rewardCode: string, peers: Peer[], delay: number): Promise<void> {
        const body = {
            rewardCode,
            nodeAddress: this.nodeId,
            streamId: this.streamId,
            clientServerLatency: this.latestLatency,
            waitTime: delay,
            natType: this.natType,
            peers
        }
        try {
            await fetchOrThrow(`${this.pluginConfig.claimServerUrl}/claim`, {
                body: JSON.stringify(body),
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            logger.info('Reward claimed successfully')
        } catch (e) {
            logger.error(`Unable to claim reward: code=${rewardCode}`, e)
        }
    }

    private async getLatency(): Promise<number|undefined> {
        const startTime = Date.now()
        try {
            await fetchOrThrow(`${this.pluginConfig.claimServerUrl}/ping`)
            return Date.now() - startTime
        } catch (e) {
            logger.info('Unable to analyze latency')
            return undefined
        }
    }

    private async getNatType(): Promise<string> {
        logger.info('Analyzing NAT type')
        try {
            const result = await withTimeout(fetchNatType({ 
                logsEnabled: false,
                sampleCount: NAT_ANALYSIS_SAMPLE_COUNT,
                stunHost: this.pluginConfig.stunServerHost!
            }), NAT_ANALYSIS_TIMEOUT.maxWaitTime, NAT_ANALYSIS_TIMEOUT.errorCode)
            logger.info(`NAT type: ${result}`)
            return result
        } catch (e) {
            logger.warn(`Unable to analyze NAT type: ${e.message}`)
            return NAT_TYPE_UNKNOWN
        }
    }

    async stop() {
        this.latencyPoller?.stop()
        if (this.rewardSubscriptionRetryRef) {
            clearTimeout(this.rewardSubscriptionRetryRef)
            this.rewardSubscriptionRetryRef = null
        }
    }

    getConfigSchema() {
        return PLUGIN_CONFIG_SCHEMA
    }
}
