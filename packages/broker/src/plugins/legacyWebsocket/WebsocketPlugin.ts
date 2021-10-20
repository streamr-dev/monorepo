import { MissingConfigError } from '../../errors/MissingConfigError'
import { WebsocketServer } from './WebsocketServer'
import { Plugin, PluginOptions } from '../../Plugin'
import { StreamFetcher } from '../../StreamFetcher'
import PLUGIN_CONFIG_SCHEMA from './config.schema.json'
import { Logger } from "streamr-network"
import { once } from "events"
import fs from "fs"
import http from 'http'
import https from "https"
import { Schema } from 'ajv'

const logger = new Logger(module)

export interface WebsocketPluginConfig {
    port: number
    privateKeyFileName: string|null, 
    certFileName: string|null,
    pingInterval: number
}

export class WebsocketPlugin extends Plugin<WebsocketPluginConfig> {
    private websocketServer: WebsocketServer | undefined

    constructor(options: PluginOptions) {
        super(options)
    }

    async start(): Promise<unknown> {
        if (this.pluginConfig.port === undefined) {
            throw new MissingConfigError('port')
        }
        let httpServer: http.Server | https.Server
        if (this.pluginConfig.privateKeyFileName && this.pluginConfig.certFileName) {
            const opts = {
                key: fs.readFileSync(this.pluginConfig.privateKeyFileName),
                cert: fs.readFileSync(this.pluginConfig.certFileName)
            }
            httpServer = https.createServer(opts)
        } else {
            httpServer = http.createServer()
        }
        this.websocketServer = new WebsocketServer(
            httpServer,
            this.networkNode,
            new StreamFetcher(this.brokerConfig.streamrUrl),
            this.publisher,
            this.metricsContext,
            this.subscriptionManager,
            this.storageNodeRegistry,
            this.brokerConfig.streamrUrl,
            this.pluginConfig.pingInterval,
        )
        httpServer.listen(this.pluginConfig.port)
        await once(httpServer, 'listening')
        logger.info(`started on port %s`, this.pluginConfig.port)
        return true
    }

    async stop(): Promise<unknown> {
        return this.websocketServer!.close()
    }

    getConfigSchema(): Schema {
        return PLUGIN_CONFIG_SCHEMA
    }
}
