import { Schema } from 'ajv'
import { Plugin } from '../../Plugin'
import PLUGIN_CONFIG_SCHEMA from './config.schema.json'
import { Logger, MetricsReport } from '@streamr/utils'
import { omit } from 'lodash'

const logger = new Logger(module)

function formatNumber(n: number) {
    return n < 10 ? n.toFixed(1) : String(Math.round(n))
}

export interface ConsoleMetricsPluginConfig {
    interval: number
}

export class ConsoleMetricsPlugin extends Plugin<ConsoleMetricsPluginConfig> {
    async start(): Promise<void> {
        const metricsContext = (await (this.streamrClient!.getNode())).getMetricsContext()
        metricsContext.createReportProducer((report: MetricsReport) => {
            // omit timestamp info as that is printed by the logger
            const data = omit(report, 'period')
            // remove quote chars to improve readability
            const output = JSON.stringify(data, undefined, 4).replace(/"/g, '')
            logger.info(`Report\n${output}`)
        }, this.pluginConfig.interval * 1000, formatNumber, this.abortSignal)
    }
    
    // eslint-disable-next-line class-methods-use-this
    async stop(): Promise<void> {}

    // eslint-disable-next-line class-methods-use-this
    override getConfigSchema(): Schema {
        return PLUGIN_CONFIG_SCHEMA
    }
}
