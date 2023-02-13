/**
 * @module StreamrClientConfig
 */

import qs from 'qs'
import { ControlLayer, MessageLayer } from 'streamr-client-protocol'
import { ExternalProvider } from '@ethersproject/providers'
import { BigNumber } from '@ethersproject/bignumber'
import { getVersionString } from './utils'
import { ConnectionInfo } from '@ethersproject/web'
import { EthereumAddress, Todo } from './types'
import { BytesLike } from '@ethersproject/bytes'
import { isAddress } from '@ethersproject/address'
import has from 'lodash/has'
import get from 'lodash/get'
import { StorageNode } from './stream/StorageNode'

export type EthereumConfig = ExternalProvider

/**
 * @category Important
 */
export type StrictStreamrClientOptions = {
  /** Custom human-readable debug id for client. Used in logging. Unique id will be generated regardless. */
    id?: string,
    /**
    * Authentication: identity used by this StreamrClient instance.
    * Can contain member privateKey or (window.)ethereum
    */
    auth: {
        privateKey?: BytesLike
        ethereum?: EthereumConfig
        apiKey?: string
        username?: string
        password?: string
    }
    /** Websocket server to connect to */
    url: string
    /** Core HTTP API calls go here */
    restUrl: string
    /** joinPartAgent when using EE for join part handling */
    streamrNodeAddress: EthereumAddress
    /** Automatically connect on first subscribe */
    autoConnect: boolean
    /**  Automatically disconnect on last unsubscribe */
    autoDisconnect: boolean
    /** Attempt to order messages */
    orderMessages: boolean
    retryResendAfter: number
    gapFillTimeout: number
    maxGapRequests: number
    maxRetries: number
    maxPublishQueueSize: number
    publishWithSignature: Todo
    verifySignatures: Todo
    publisherStoreKeyHistory: boolean
    publishAutoDisconnectDelay: number,
    groupKeys: Todo
    keyRequestTimeout?: number
    keyExchange: Todo

    binanceRPC: ConnectionInfo & { chainId?: number }
    // address on sidechain
    binanceAdapterAddress: EthereumAddress
    // AMB address on BSC. used to port TXs to BSC
    binanceSmartChainAMBAddress: EthereumAddress
    withdrawServerUrl: string
    mainnet?: ConnectionInfo|string
    sidechain: ConnectionInfo & { chainId?: number }
    tokenAddress: EthereumAddress,
    tokenSidechainAddress: EthereumAddress,
    dataUnion: {
        /**
         * Threshold value set in AMB configs, smallest token amount to pass over the bridge if
         * someone else pays for the gas when transporting the withdraw tx to mainnet;
         * otherwise the client does the transport as self-service and pays the mainnet gas costs
         */
        minimumWithdrawTokenWei: BigNumber|number|string
        payForTransport: boolean
        factoryMainnetAddress: EthereumAddress
        factorySidechainAddress: EthereumAddress
        templateMainnetAddress: EthereumAddress
        templateSidechainAddress: EthereumAddress
    },
    storageNode: {
        address: EthereumAddress
        url: string
    }
    cache: {
        maxSize: number,
        maxAge: number
    }
}

export type StreamrClientOptions = Partial<Omit<StrictStreamrClientOptions, 'dataUnion'> & {
    dataUnion: Partial<StrictStreamrClientOptions['dataUnion']>
}>

const { ControlMessage } = ControlLayer
const { StreamMessage } = MessageLayer

const validateOverridedEthereumAddresses = (opts: any, propertyPaths: string[]) => {
    for (const propertyPath of propertyPaths) {
        if (has(opts, propertyPath)) {
            const value = get(opts, propertyPath)
            if (!isAddress(value)) {
                throw new Error(`${propertyPath} is not a valid Ethereum address`)
            }
        }
    }
}

/**
 * @category Important
 */
export const STREAM_CLIENT_DEFAULTS: StrictStreamrClientOptions = {
    auth: {},

    // Streamr Core options
    url: 'wss://streamr.network/api/v1/ws',
    restUrl: 'https://streamr.network/api/v1',
    streamrNodeAddress: '0xf3E5A65851C3779f468c9EcB32E6f25D9D68601a',

    // P2P Streamr Network options
    autoConnect: true,
    autoDisconnect: true,
    orderMessages: true,
    retryResendAfter: 5000,
    gapFillTimeout: 5000,
    maxGapRequests: 5,
    maxRetries: 5,
    maxPublishQueueSize: 10000,
    publishAutoDisconnectDelay: 5000,

    // Encryption options
    publishWithSignature: 'auto',
    verifySignatures: 'auto',
    publisherStoreKeyHistory: true,
    groupKeys: {}, // {streamId: groupKey}
    keyRequestTimeout: 30 * 1000,
    keyExchange: {},

    // Ethereum and Data Union related options
    // TODO: get these from data-union-config / streamr-config packages!
    // For ethers.js provider params, see https://docs.ethers.io/ethers.js/v5-beta/api-providers.html#provider
    mainnet: undefined, // Default to ethers.js default provider settings
    sidechain: {
        url: 'https://rpc.xdaichain.com/',
        chainId: 100
    },
    binanceRPC: {
        url: 'https://bsc-dataseed.binance.org/',
        chainId: 56
    },
    tokenAddress: '0x8f693ca8D21b157107184d29D398A8D082b38b76',
    tokenSidechainAddress: '0x256eb8a51f382650B2A1e946b8811953640ee47D',
    binanceAdapterAddress: '0x193888692673b5dD46e6BC90bA8cBFeDa515c8C1',
    binanceSmartChainAMBAddress: '0x05185872898b6f94aa600177ef41b9334b1fa48b',
    withdrawServerUrl: 'https://streamr.com:3000',
    dataUnion: {
        minimumWithdrawTokenWei: '1000000',
        payForTransport: true,
        factoryMainnetAddress: '0xE41439BF434F9CfBF0153f5231C205d4ae0C22e3',
        factorySidechainAddress: '0xFCE1FBFAaE61861B011B379442c8eE1DC868ABd0',
        templateMainnetAddress: '0x67352e3F7dBA907aF877020aE7E9450C0029C70c',
        templateSidechainAddress: '0xaCF9e8134047eDc671162D9404BF63a587435bAa',
    },
    storageNode: {
        address: StorageNode.STREAMR_GERMANY.getAddress(),
        url: 'https://corea1.streamr.network:8001'
    },
    cache: {
        maxSize: 10000,
        maxAge: 30 * 60 * 1000, // 30 minutes
    }
}

/** @internal */
export default function ClientConfig(opts: StreamrClientOptions = {}) {

    // validate all Ethereum addresses which are required in StrictStreamrClientOptions: if user
    // overrides a setting, which has a default value, it must be a non-null valid Ethereum address
    // TODO could also validate
    // - other optional Ethereum address (if there will be some)
    // - other overriden options (e.g. regexp check that "restUrl" is a valid url)
    validateOverridedEthereumAddresses(opts, [
        'streamrNodeAddress',
        'tokenAddress',
        'tokenSidechainAddress',
        'dataUnion.factoryMainnetAddress',
        'dataUnion.factorySidechainAddress',
        'dataUnion.templateMainnetAddress',
        'dataUnion.templateSidechainAddress',
        'storageNode.address'
    ])

    const options: StrictStreamrClientOptions = {
        ...STREAM_CLIENT_DEFAULTS,
        ...opts,
        dataUnion: {
            ...STREAM_CLIENT_DEFAULTS.dataUnion,
            ...opts.dataUnion
        },
        cache: {
            ...STREAM_CLIENT_DEFAULTS.cache,
            ...opts.cache,
        }
        // NOTE: sidechain and storageNode settings are not merged with the defaults
    }

    const parts = options.url!.split('?')
    if (parts.length === 1) { // there is no query string
        const controlLayer = `controlLayerVersion=${ControlMessage.LATEST_VERSION}`
        const messageLayer = `messageLayerVersion=${StreamMessage.LATEST_VERSION}`
        options.url = `${options.url}?${controlLayer}&${messageLayer}`
    } else {
        const queryObj = qs.parse(parts[1])
        if (!queryObj.controlLayerVersion) {
            options.url = `${options.url}&controlLayerVersion=1`
        }

        if (!queryObj.messageLayerVersion) {
            options.url = `${options.url}&messageLayerVersion=31`
        }
    }

    // always add streamrClient version
    options.url = `${options.url}&streamrClient=${getVersionString()}`

    // Backwards compatibility for option 'authKey' => 'apiKey'
    // @ts-expect-error
    if (options.authKey && !options.apiKey) {
        // @ts-expect-error
        options.apiKey = options.authKey
    }

    // @ts-expect-error
    if (options.apiKey) {
        // @ts-expect-error
        options.auth.apiKey = options.apiKey
    }

    options.auth = options.auth || {}

    if ('privateKey' in options.auth) {
        const { privateKey } = options.auth
        if (typeof privateKey === 'string' && !privateKey.startsWith('0x')) {
            options.auth.privateKey = `0x${options.auth!.privateKey}`
        }
    }

    return options
}
