import { StreamID, toStreamID } from '@streamr/protocol'
import { EthereumAddress, Logger, TheGraphClient, collect, toEthereumAddress } from '@streamr/utils'
import { Contract } from 'ethers'
import min from 'lodash/min'
import { Lifecycle, delay, inject, scoped } from 'tsyringe'
import { Authentication, AuthenticationInjectionToken } from '../Authentication'
import { ConfigInjectionToken, StrictStreamrClientConfig } from '../Config'
import { ContractFactory } from '../ContractFactory'
import { RpcProviderFactory } from '../RpcProviderFactory'
import { Stream } from '../Stream'
import { StreamFactory } from '../StreamFactory'
import { StreamIDBuilder } from '../StreamIDBuilder'
import type { StreamStorageRegistryV2 as StreamStorageRegistryContract } from '../ethereumArtifacts/StreamStorageRegistryV2'
import StreamStorageRegistryArtifact from '../ethereumArtifacts/StreamStorageRegistryV2Abi.json'
import { getEthersOverrides } from '../ethereumUtils'
import { StreamrClientEventEmitter } from '../events'
import { LoggerFactory } from '../utils/LoggerFactory'
import { initContractEventGateway, waitForTx } from '../utils/contract'
import { ChainEventPoller } from './ChainEventPoller'

export interface StorageNodeAssignmentEvent {
    readonly streamId: StreamID
    readonly nodeAddress: EthereumAddress
    readonly blockNumber: number
}

interface NodeQueryResult {
    id: string
    metadata: string
    lastseen: string
}

/**
 * Stores storage node assignments (mapping of streamIds <-> storage nodes addresses)
 */
@scoped(Lifecycle.ContainerScoped)
export class StreamStorageRegistry {

    private streamStorageRegistryContract?: StreamStorageRegistryContract
    private readonly streamStorageRegistryContractsReadonly: StreamStorageRegistryContract
    private readonly streamFactory: StreamFactory
    private readonly streamIdBuilder: StreamIDBuilder
    private readonly contractFactory: ContractFactory
    private readonly rpcProviderFactory: RpcProviderFactory
    private readonly theGraphClient: TheGraphClient
    private readonly config: Pick<StrictStreamrClientConfig, 'contracts' | '_timeouts'>
    private readonly authentication: Authentication
    private readonly logger: Logger

    /* eslint-disable indent */
    constructor(
        @inject(delay(() => StreamFactory)) streamFactory: StreamFactory,
        streamIdBuilder: StreamIDBuilder,
        contractFactory: ContractFactory,
        rpcProviderFactory: RpcProviderFactory,
        theGraphClient: TheGraphClient,
        @inject(ConfigInjectionToken) config: Pick<StrictStreamrClientConfig, 'contracts' | '_timeouts'>,
        @inject(AuthenticationInjectionToken) authentication: Authentication,
        eventEmitter: StreamrClientEventEmitter,
        loggerFactory: LoggerFactory
    ) {
        this.streamFactory = streamFactory
        this.streamIdBuilder = streamIdBuilder
        this.contractFactory = contractFactory
        this.rpcProviderFactory = rpcProviderFactory
        this.theGraphClient = theGraphClient
        this.config = config
        this.authentication = authentication
        this.logger = loggerFactory.createLogger(module)
        this.streamStorageRegistryContractsReadonly = this.contractFactory.createReadContract(
            toEthereumAddress(this.config.contracts.streamStorageRegistryChainAddress),
            StreamStorageRegistryArtifact,
            rpcProviderFactory.getProvider(),
            'streamStorageRegistry'
        ) as StreamStorageRegistryContract
        const chainEventPoller = new ChainEventPoller(this.rpcProviderFactory.getEventProviders().map((p) => {
            // TODO would it make sense to use createDecoratedContract to get logging? or would it do that
            return new Contract(toEthereumAddress(this.config.contracts.streamStorageRegistryChainAddress), StreamStorageRegistryArtifact, p)
        }))
        this.initStreamAssignmentEventListeners(eventEmitter, chainEventPoller, loggerFactory)
    }

    // eslint-disable-next-line class-methods-use-this
    private initStreamAssignmentEventListeners(
        eventEmitter: StreamrClientEventEmitter,
        chainEventPoller: ChainEventPoller,
        loggerFactory: LoggerFactory
    ) {
        const transformation = (streamId: string, nodeAddress: string, blockNumber: number) => ({
            streamId: toStreamID(streamId),
            nodeAddress: toEthereumAddress(nodeAddress),
            blockNumber
        })
        initContractEventGateway({
            sourceName: 'Added', 
            sourceEmitter: chainEventPoller,
            targetName: 'addToStorageNode',
            targetEmitter: eventEmitter,
            transformation,
            loggerFactory
        })
        initContractEventGateway({
            sourceName: 'Removed', 
            sourceEmitter: chainEventPoller,
            targetName: 'removeFromStorageNode',
            targetEmitter: eventEmitter,
            transformation,
            loggerFactory
        })
    }

    private async connectToContract() {
        if (!this.streamStorageRegistryContract) {
            const chainSigner = await this.authentication.getStreamRegistryChainSigner(this.rpcProviderFactory)
            this.streamStorageRegistryContract = this.contractFactory.createWriteContract<StreamStorageRegistryContract>(
                toEthereumAddress(this.config.contracts.streamStorageRegistryChainAddress),
                StreamStorageRegistryArtifact,
                chainSigner,
                'streamStorageRegistry'
            )
        }
    }

    async addStreamToStorageNode(streamIdOrPath: string, nodeAddress: EthereumAddress): Promise<void> {
        const streamId = await this.streamIdBuilder.toStreamID(streamIdOrPath)
        this.logger.debug('Add stream to storage node', { streamId, nodeAddress })
        await this.connectToContract()
        const ethersOverrides = await getEthersOverrides(this.rpcProviderFactory, this.config)
        await waitForTx(this.streamStorageRegistryContract!.addStorageNode(streamId, nodeAddress, ethersOverrides))
    }

    async removeStreamFromStorageNode(streamIdOrPath: string, nodeAddress: EthereumAddress): Promise<void> {
        const streamId = await this.streamIdBuilder.toStreamID(streamIdOrPath)
        this.logger.debug('Remove stream from storage node', { streamId, nodeAddress })
        await this.connectToContract()
        const ethersOverrides = await getEthersOverrides(this.rpcProviderFactory, this.config)
        await waitForTx(this.streamStorageRegistryContract!.removeStorageNode(streamId, nodeAddress, ethersOverrides))
    }

    async isStoredStream(streamIdOrPath: string, nodeAddress: EthereumAddress): Promise<boolean> {
        const streamId = await this.streamIdBuilder.toStreamID(streamIdOrPath)
        this.logger.debug('Check if stream is stored in storage node', { streamId, nodeAddress })
        return await this.streamStorageRegistryContractsReadonly.isStorageNodeOf(streamId, nodeAddress)
    }

    async getStoredStreams(nodeAddress: EthereumAddress): Promise<{ streams: Stream[], blockNumber: number }> {
        this.logger.debug('Get stored streams of storage node', { nodeAddress })
        const blockNumbers: number[] = []
        const res = await collect(this.theGraphClient.queryEntities(
            (lastId: string, pageSize: number) => {
                const query = `{
                    node (id: "${nodeAddress}") {
                        id
                        metadata
                        lastSeen
                        storedStreams (first: ${pageSize} orderBy: "id" where: { id_gt: "${lastId}"}) {
                            id,
                            metadata
                        }
                    }
                    _meta {
                        block {
                            number
                        }
                    }
                }`
                return { query }
            },
            (response: any) => {
                // eslint-disable-next-line no-underscore-dangle
                blockNumbers.push(response._meta.block.number)
                return (response.node !== null) ? response.node.storedStreams : []
            }
        ))
        const streams = res.map((stream: any) => {
            const props = Stream.parseMetadata(stream.metadata)
            return this.streamFactory.createStream(toStreamID(stream.id), props) // toStreamID() not strictly necessary
        })
        return {
            streams,
            blockNumber: min(blockNumbers)!
        }
    }

    async getStorageNodes(streamIdOrPath?: string): Promise<EthereumAddress[]> {
        let queryResults: NodeQueryResult[]
        if (streamIdOrPath !== undefined) {
            const streamId = await this.streamIdBuilder.toStreamID(streamIdOrPath)
            this.logger.debug('Get storage nodes of stream', { streamId })
            queryResults = await collect(this.theGraphClient.queryEntities<NodeQueryResult>(
                (lastId: string, pageSize: number) => {
                    const query = `{
                        stream (id: "${streamId}") {
                            id
                            metadata
                            storageNodes (first: ${pageSize} orderBy: "id" where: { id_gt: "${lastId}"}) {
                                id
                                metadata
                                lastSeen
                            }
                        }
                    }`
                    return { query }
                },
                (response: any) => {
                    return (response.stream !== null) ? response.stream.storageNodes : []
                }
            ))
        } else {
            this.logger.debug('Get all storage nodes')
            queryResults = await collect(this.theGraphClient.queryEntities<NodeQueryResult>(
                (lastId: string, pageSize: number) => {
                    const query = `{
                        nodes (first: ${pageSize} orderBy: "id" where: { id_gt: "${lastId}"}) {
                            id
                            metadata
                            lastSeen
                        }
                    }`
                    return { query }
                }
            ))
        }
        return queryResults.map((node) => toEthereumAddress(node.id))
    }
}
