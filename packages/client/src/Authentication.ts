import { BrowserProvider, AbstractSigner, Provider, computeAddress, Wallet } from 'ethers'
import { EthereumAddress, hexToBinary, toEthereumAddress, wait, createSignature } from '@streamr/utils'
import pMemoize from 'p-memoize'
import { PrivateKeyAuthConfig, ProviderAuthConfig, StrictStreamrClientConfig } from './Config'
import { pLimitFn } from './utils/promises'
import { RpcProviderSource } from './RpcProviderSource'

export const AuthenticationInjectionToken = Symbol('Authentication')

export type SignerWithProvider = AbstractSigner<Provider>

export interface Authentication {
    // always in lowercase
    getAddress: () => Promise<EthereumAddress>
    createMessageSignature: (payload: Uint8Array) => Promise<Uint8Array>
    getTransactionSigner: (rpcProviderSource: RpcProviderSource) => Promise<SignerWithProvider>
}

export const createPrivateKeyAuthentication = (key: string): Authentication => {
    const address = toEthereumAddress(computeAddress(key))
    return {
        getAddress: async () => address,
        createMessageSignature: async (payload: Uint8Array) => createSignature(payload, hexToBinary(key)),
        getTransactionSigner: async (rpcProviderSource: RpcProviderSource) => {
            const primaryProvider = rpcProviderSource.getProvider()
            return new Wallet(key, primaryProvider) as SignerWithProvider
        }
    }
}

export const createAuthentication = (config: Pick<StrictStreamrClientConfig, 'auth' | 'contracts' | '_timeouts'>): Authentication => {
    if ((config.auth as PrivateKeyAuthConfig)?.privateKey !== undefined) {
        const privateKey = (config.auth as PrivateKeyAuthConfig).privateKey
        const normalizedPrivateKey = !privateKey.startsWith('0x')
            ? `0x${privateKey}`
            : privateKey
        return createPrivateKeyAuthentication(normalizedPrivateKey)
    } else if ((config.auth as ProviderAuthConfig)?.ethereum !== undefined) {
        const ethereum = (config.auth as ProviderAuthConfig)?.ethereum
        const provider = new BrowserProvider(ethereum)
        const signer = provider.getSigner()
        return {
            getAddress: pMemoize(async () => {
                try {
                    if (!('request' in ethereum && typeof ethereum.request === 'function')) {
                        throw new Error(`invalid ethereum provider ${ethereum}`)
                    }
                    const accounts = await ethereum.request({ method: 'eth_requestAccounts' })
                    return toEthereumAddress(accounts[0])
                } catch {
                    throw new Error('no addresses connected and selected in the custom authentication provider')
                }
            }),
            createMessageSignature: pLimitFn(async (payload: Uint8Array) => {
                // sign one at a time & wait a moment before asking for next signature
                // otherwise MetaMask extension may not show the prompt window
                const sig = await (await signer).signMessage(payload)
                await wait(50)
                return hexToBinary(sig)
            }, 1),
            getTransactionSigner: async () => {
                if (config.contracts.ethereumNetwork.chainId === undefined) {
                    throw new Error('Streamr chainId not configuredin the StreamrClient options!')
                }
                const expectedChainId = config.contracts.ethereumNetwork.chainId
                const actualChainId = (await provider.getNetwork()).chainId
                if (actualChainId !== BigInt(expectedChainId)) {
                    throw new Error(
                        // eslint-disable-next-line max-len
                        `Please connect the custom authentication provider with chainId ${expectedChainId} (current chainId is ${actualChainId})`
                    )
                }
                return signer
                // TODO: handle events
                // ethereum.on('accountsChanged', (accounts) => { })
                // https://docs.metamask.io/guide/ethereum-provider.html#events says:
                //   "We recommend reloading the page unless you have a very good reason not to"
                //   Of course we can't and won't do that, but if we need something chain-dependent...
                // ethereum.on('chainChanged', (chainId) => { window.location.reload() });
            }
        }
    } else {
        return createPrivateKeyAuthentication(Wallet.createRandom().privateKey)
    }
}
