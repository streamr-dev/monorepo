import { scoped, Lifecycle, inject } from 'tsyringe'
import { StreamrClientEventEmitter } from './events'
import { DestroySignal } from './DestroySignal'
import { NetworkNodeFacade, getEthereumAddressFromNodeId } from './NetworkNodeFacade'
import { Publisher } from './publish/Publisher'
import { ConfigInjectionToken, StrictStreamrClientConfig } from './Config'
import { pOnce } from './utils/promises'
import { MetricsReport, wait } from '@streamr/utils'

@scoped(Lifecycle.ContainerScoped)
export class MetricsPublisher {

    private publisher: Publisher
    private node: NetworkNodeFacade
    private eventEmitter: StreamrClientEventEmitter
    private destroySignal: DestroySignal
    private config: Pick<StrictStreamrClientConfig, 'metrics'>
    private producers: { stop: () => void }[] = []

    constructor(
        @inject(Publisher) publisher: Publisher,
        @inject(NetworkNodeFacade) node: NetworkNodeFacade,
        @inject(StreamrClientEventEmitter) eventEmitter: StreamrClientEventEmitter,
        @inject(DestroySignal) destroySignal: DestroySignal,
        @inject(ConfigInjectionToken) config: Pick<StrictStreamrClientConfig, 'metrics'>
    ) {
        this.publisher = publisher
        this.node = node
        this.eventEmitter = eventEmitter
        this.destroySignal = destroySignal
        this.config = config
        const ensureStarted = pOnce(async () => {
            const node = await this.node.getNode()
            const metricsContext = node.getMetricsContext()
            const partitionKey = getEthereumAddressFromNodeId(node.getNodeId()).toLowerCase()
            this.producers = this.config.metrics.periods.map((config) => {
                return metricsContext.createReportProducer(async (report: MetricsReport) => {
                    await this.publish(report, config.streamId, partitionKey)
                }, config.duration)
            })
        })
        if (this.config.metrics.periods.length > 0) {
            this.eventEmitter.on('publish', () => ensureStarted())
            this.eventEmitter.on('subscribe', () => ensureStarted())
            this.destroySignal.onDestroy.listen(() => this.destroy())
        }
    }

    private async publish(report: MetricsReport, streamId: string, partitionKey: string): Promise<void> {
        await wait(Math.random() * this.config.metrics.maxPublishDelay)
        try {
            await this.publisher.publish(streamId, report, {
                timestamp: report.period.end,
                partitionKey
            })
        } catch (e: any) {
            console.warn(`Unable to publish metrics: ${e.message}`)
        }
    }

    private destroy(): void {
        this.producers.forEach((producer) => producer.stop())
    }
}
