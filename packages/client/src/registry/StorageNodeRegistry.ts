import { Provider } from '@ethersproject/providers'
import { EthereumAddress, toEthereumAddress } from '@streamr/utils'
import { Lifecycle, inject, scoped } from 'tsyringe'
import { Authentication, AuthenticationInjectionToken } from '../Authentication'
import { ConfigInjectionToken, StrictStreamrClientConfig } from '../Config'
import { ContractFactory } from '../ContractFactory'
import { getStreamRegistryChainProviders, getEthersOverrides } from '../Ethereum'
import { StreamrClientError } from '../StreamrClientError'
import type { NodeRegistry as NodeRegistryContract } from '../ethereumArtifacts/NodeRegistry'
import NodeRegistryArtifact from '../ethereumArtifacts/NodeRegistryAbi.json'
import { queryAllReadonlyContracts, waitForTx } from '../utils/contract'

export interface StorageNodeMetadata {
    http: string
}

/**
 * Store a mapping of storage node addresses <-> storage node URLs
 */
@scoped(Lifecycle.ContainerScoped)
export class StorageNodeRegistry {

    private nodeRegistryContract?: NodeRegistryContract
    private readonly nodeRegistryContractsReadonly: NodeRegistryContract[]
    private readonly contractFactory: ContractFactory
    private readonly config: Pick<StrictStreamrClientConfig, 'contracts'>
    private readonly authentication: Authentication

    constructor(
        contractFactory: ContractFactory,
        @inject(ConfigInjectionToken) config: Pick<StrictStreamrClientConfig, 'contracts'>,
        @inject(AuthenticationInjectionToken) authentication: Authentication,
    ) {
        this.contractFactory = contractFactory
        this.config = config
        this.authentication = authentication
        this.nodeRegistryContractsReadonly = getStreamRegistryChainProviders(config).map((provider: Provider) => {
            return this.contractFactory.createReadContract(
                toEthereumAddress(this.config.contracts.storageNodeRegistryChainAddress),
                NodeRegistryArtifact,
                provider,
                'storageNodeRegistry'
            ) as NodeRegistryContract
        })
    }

    private async connectToContract() {
        if (!this.nodeRegistryContract) {
            const chainSigner = await this.authentication.getStreamRegistryChainSigner()
            this.nodeRegistryContract = this.contractFactory.createWriteContract<NodeRegistryContract>(
                toEthereumAddress(this.config.contracts.storageNodeRegistryChainAddress),
                NodeRegistryArtifact,
                chainSigner,
                'storageNodeRegistry'
            )
        }
    }

    async setStorageNodeMetadata(metadata: StorageNodeMetadata | undefined): Promise<void> {
        await this.connectToContract()
        const ethersOverrides = getEthersOverrides(this.config)
        if (metadata !== undefined) {
            await waitForTx(this.nodeRegistryContract!.createOrUpdateNodeSelf(JSON.stringify(metadata), ethersOverrides))
        } else {
            await waitForTx(this.nodeRegistryContract!.removeNodeSelf(ethersOverrides))
        }
    }

    async getStorageNodeMetadata(nodeAddress: EthereumAddress): Promise<StorageNodeMetadata> {
        const [ resultNodeAddress, metadata ] = await queryAllReadonlyContracts((contract: NodeRegistryContract) => {
            return contract.getNode(nodeAddress)
        }, this.nodeRegistryContractsReadonly)
        const NODE_NOT_FOUND = '0x0000000000000000000000000000000000000000'
        if (resultNodeAddress !== NODE_NOT_FOUND) {
            return JSON.parse(metadata)
        } else {
            throw new StreamrClientError('Node not found, id: ' + nodeAddress, 'NODE_NOT_FOUND')
        }
    }
}
