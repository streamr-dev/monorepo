import { Operator, StreamrConfig, streamrConfigABI } from '@streamr/network-contracts-ethers6'
import {
    SetupOperatorContractOpts,
    _operatorContractUtils,
} from '@streamr/sdk'
import { Logger, toEthereumAddress, waitForCondition } from '@streamr/utils'
import { Contract } from 'ethers'
import { checkOperatorValueBreach } from '../../../../src/plugins/operator/checkOperatorValueBreach'
import { createClient, createTestStream } from '../../../utils'

const {
    delegate,
    deploySponsorshipContract,
    generateWalletWithGasAndTokens,
    getProvider,
    setupOperatorContract,
    sponsor,
    stake
} = _operatorContractUtils

const logger = new Logger(module)

const STREAM_CREATION_KEY = '0xb1abdb742d3924a45b0a54f780f0f21b9d9283b231a0a0b35ce5e455fa5375e7'
const ONE_ETHER = BigInt(1e18)

const getEarnings = async (operatorContract: Operator): Promise<bigint> => {
    const { earnings } = await operatorContract.getSponsorshipsAndEarnings()
    return earnings[0]
}

describe('checkOperatorValueBreach', () => {

    let streamId: string
    let deployConfig: SetupOperatorContractOpts

    beforeAll(async () => {
        const client = createClient(STREAM_CREATION_KEY)
        streamId = (await createTestStream(client, module)).id
        await client.destroy()
        deployConfig = {
            operatorConfig: {
                operatorsCutPercent: 10
            }
        }
    }, 60 * 1000)

    it('withdraws the other Operators earnings when they are above the limit', async () => {
        // eslint-disable-next-line max-len
        const { operatorContract: watcherOperatorContract, nodeWallets: watcherWallets } = await setupOperatorContract({ nodeCount: 1, ...deployConfig })
        const { operatorWallet, operatorContract } = await setupOperatorContract(deployConfig)
        const sponsorer = await generateWalletWithGasAndTokens()
        await delegate(operatorWallet, await operatorContract.getAddress(), 20000)
        const sponsorship1 = await deploySponsorshipContract({ earningsPerSecond: 100, streamId, deployer: operatorWallet })
        await sponsor(sponsorer, await sponsorship1.getAddress(), 25000)
        await stake(operatorContract, await sponsorship1.getAddress(), 10000)
        const sponsorship2 = await deploySponsorshipContract({ earningsPerSecond: 200, streamId, deployer: operatorWallet })
        await sponsor(sponsorer, await sponsorship2.getAddress(), 25000)
        await stake(operatorContract, await sponsorship2.getAddress(), 10000)
        const valueBeforeWithdraw = await operatorContract.valueWithoutEarnings()
        const streamrConfigAddress = await operatorContract.streamrConfig()
        const streamrConfig = new Contract(streamrConfigAddress, streamrConfigABI, getProvider()) as unknown as StreamrConfig
        const allowedDifference = valueBeforeWithdraw * (await streamrConfig.maxAllowedEarningsFraction()) / ONE_ETHER
        const contractFacade = await createClient(watcherWallets[0].privateKey)
            .getOperatorContractFacade(toEthereumAddress(await watcherOperatorContract.getAddress()))

        // overwrite (for this test only) the getRandomOperator method to deterministically return the operator's address
        contractFacade.getRandomOperator = async () => {
            return toEthereumAddress(await operatorContract.getAddress())
        }

        logger.debug('Waiting until above', { allowedDifference })
        await waitForCondition(async () => await getEarnings(operatorContract) > allowedDifference, 10000, 1000)
        await checkOperatorValueBreach(contractFacade, 1, 20)

        const earnings = await getEarnings(operatorContract)
        expect(earnings).toBeLessThan(allowedDifference)
        const valueAfterWithdraw = await operatorContract.valueWithoutEarnings()
        expect(valueAfterWithdraw).toBeGreaterThan(valueBeforeWithdraw)

    }, 60 * 1000)
})
