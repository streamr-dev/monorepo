import { Plugin, PluginOptions } from '../../Plugin'
import { SslCertificateConfig } from '../../types'
import { getPayloadFormat } from '../../helpers/PayloadFormat'
import { WebsocketServer } from './WebsocketServer'
import PLUGIN_CONFIG_SCHEMA from './config.schema.json'
import { Schema } from 'ajv'

export interface WebsocketPluginConfig {
    port: number
    payloadMetadata: boolean
    sslCertificate: SslCertificateConfig|null
}

export class WebsocketPlugin extends Plugin<WebsocketPluginConfig> {

    private server?: WebsocketServer

    constructor(options: PluginOptions) {
        super(options)
        if (this.streamrClient === undefined) {
            throw new Error('StreamrClient is not available')   
        }
    }

    async start(): Promise<void> {
        this.server = new WebsocketServer(this.streamrClient!)
        await this.server.start(
            this.pluginConfig.port, 
            getPayloadFormat(this.pluginConfig.payloadMetadata),
            this.apiAuthenticator, 
            this.pluginConfig.sslCertificate ?? undefined
        )
    }

    async stop(): Promise<void> {
        await this.server!.stop()
    }

    getConfigSchema(): Schema {
        return PLUGIN_CONFIG_SCHEMA
    }
}