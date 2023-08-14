import { toEthereumAddress } from '@streamr/utils'
import { StreamrClientConfig } from './Config'
import { MIN_KEY_LENGTH } from './encryption/RSAKeyPair'
import { Chains } from '@streamr/config'

const MAIN_CHAIN_CONFIG = Chains.load()['dev0']
const SIDE_CHAIN_CONFIG = Chains.load()['dev1']

function toNumber(value: any): number | undefined {
    return (value !== undefined) ? Number(value) : undefined
}

const sideChainConfig = {
    name: 'streamr', // TODO from config?
    chainId: SIDE_CHAIN_CONFIG.id,
    rpcs: [{
        // TODO do we need "process.env.SIDECHAIN_URL || `http://${process.env.STREAMR_DOCKER_DEV_HOST" support?
        url: process.env.SIDECHAIN_URL || SIDE_CHAIN_CONFIG.rpcEndpoints[0].url,
        timeout: toNumber(process.env.TEST_TIMEOUT) ?? 30 * 1000,
    }]
}

/**
 * Streamr client constructor options that work in the test environment
 */
export const CONFIG_TEST: StreamrClientConfig = {
    network: {
        trackers: [
            {
                id: '0xb9e7cEBF7b03AE26458E32a059488386b05798e8',
                ws: `ws://${process.env.STREAMR_DOCKER_DEV_HOST || '127.0.0.1'}:30301`,
                http: `http://${process.env.STREAMR_DOCKER_DEV_HOST || '127.0.0.1'}:30301`
            }, {
                id: '0x0540A3e144cdD81F402e7772C76a5808B71d2d30',
                ws: `ws://${process.env.STREAMR_DOCKER_DEV_HOST || '127.0.0.1'}:30302`,
                http: `http://${process.env.STREAMR_DOCKER_DEV_HOST || '127.0.0.1'}:30302`
            }, {
                id: '0xf2C195bE194a2C91e93Eacb1d6d55a00552a85E2',
                ws: `ws://${process.env.STREAMR_DOCKER_DEV_HOST || '127.0.0.1'}:30303`,
                http: `http://${process.env.STREAMR_DOCKER_DEV_HOST || '127.0.0.1'}:30303`
            }
        ],
        webrtcDisallowPrivateAddresses: false,
        iceServers: []
    },
    contracts: {
        streamRegistryChainAddress: SIDE_CHAIN_CONFIG.contracts.StreamRegistry,
        streamStorageRegistryChainAddress: SIDE_CHAIN_CONFIG.contracts.StreamStorageRegistry,
        storageNodeRegistryChainAddress: SIDE_CHAIN_CONFIG.contracts.StorageNodeRegistry,
        mainChainRPCs: {
            name: 'dev_ethereum',  // TODO from config?
            chainId: MAIN_CHAIN_CONFIG.id,
            rpcs: [{
                // TODO do we need "process.env.ETHEREUM_SERVER_URL || `http://${process.env.STREAMR_DOCKER_DEV_HOST" support?
                url: process.env.ETHEREUM_SERVER_URL || MAIN_CHAIN_CONFIG.rpcEndpoints[0].url,
                timeout: toNumber(process.env.TEST_TIMEOUT) ?? 30 * 1000
            }]
        },
        streamRegistryChainRPCs: sideChainConfig,
        theGraphUrl: `http://${process.env.STREAMR_DOCKER_DEV_HOST || '127.0.0.1'}:8000/subgraphs/name/streamr-dev/network-contracts`,
    },
    encryption: {
        rsaKeyLength: MIN_KEY_LENGTH
    },
    _timeouts: {
        theGraph: {
            indexTimeout: 10 * 1000,
            indexPollInterval: 500
        },
        storageNode: {
            timeout: 30 * 1000,
            retryInterval: 500
        },
        ensStreamCreation: {
            timeout: 20 * 1000,
            retryInterval: 500
        }
    },
    metrics: false
}

export const DOCKER_DEV_STORAGE_NODE = toEthereumAddress('0xde1112f631486CfC759A50196853011528bC5FA0')
