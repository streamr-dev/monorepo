import { Plugin } from '../../Plugin'
import { getPayloadFormat } from '../../helpers/PayloadFormat'
import PLUGIN_CONFIG_SCHEMA from './config.schema.json'
import { MqttServer } from './MqttServer'
import { Bridge } from './Bridge'
import { Schema } from 'ajv'

export interface MqttPluginConfig {
    port: number
    streamIdDomain: string | null
    payloadMetadata: boolean
}

export class MqttPlugin extends Plugin<MqttPluginConfig> {
    private server?: MqttServer

    async start(): Promise<void> {
        this.server = new MqttServer(this.pluginConfig.port, this.apiAuthenticator)
        const bridge = new Bridge(
            this.streamrClient!, 
            this.server, 
            getPayloadFormat(this.pluginConfig.payloadMetadata),
            this.pluginConfig.streamIdDomain ?? undefined
        )
        this.server.setListener(bridge)
        return this.server.start()
    }

    // eslint-disable-next-line class-methods-use-this
    async stop(): Promise<void> {
        await this.server!.stop()
    }

    // eslint-disable-next-line class-methods-use-this
    override getConfigSchema(): Schema {
        return PLUGIN_CONFIG_SCHEMA
    }
}
