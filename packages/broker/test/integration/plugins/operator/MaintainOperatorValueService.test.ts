import { Provider } from '@ethersproject/providers'
import { config as CHAIN_CONFIG } from '@streamr/config'
import { Wallet } from '@ethersproject/wallet'
import { parseEther } from '@ethersproject/units'
import { Logger, waitForCondition } from '@streamr/utils'

import type { TestToken, Operator } from '@streamr/network-contracts'

import { tokenABI } from '@streamr/network-contracts'
import { Contract } from '@ethersproject/contracts'

import { deploySponsorship } from './deploySponsorshipContract'
import { MaintainOperatorValueService } from '../../../../src/plugins/operator/MaintainOperatorValueService'
import { OperatorServiceConfig } from '../../../../src/plugins/operator/OperatorPlugin'
import { getProvider } from './smartContractUtils'
import { createClient } from '../../../utils'
import { setupOperatorContract } from './setupOperatorContract'

const chainConfig = CHAIN_CONFIG.dev2
const theGraphUrl = `http://${process.env.STREAMR_DOCKER_DEV_HOST ?? '127.0.0.1'}:8800/subgraphs/name/streamr-dev/network-subgraphs`

const logger = new Logger(module)

const SPONSOR_AMOUNT = 250
const STAKE_AMOUNT = 100

const STREAM_CREATION_KEY = '0xb1abdb742d3924a45b0a54f780f0f21b9d9283b231a0a0b35ce5e455fa5375e7'

// test is outdated, is completely rewritten and will be merged with PR #1629 
describe.skip('MaintainOperatorValueService', () => {
    let provider: Provider
    let operatorWallet: Wallet
    let operatorContract: Operator
    let token: TestToken
    let streamId1: string
    let streamId2: string

    let operatorConfig: OperatorServiceConfig

    const getDiffBetweenApproxAndRealValues = async (): Promise<bigint> => {
        const { sponsorshipAddresses, approxValues, realValues } = await operatorContract.getApproximatePoolValuesPerSponsorship()
        let totalDiff = BigInt(0)
        for (let i = 0; i < sponsorshipAddresses.length; i++) {
            const diff = realValues[i].toBigInt() - approxValues[i].toBigInt()
            totalDiff += diff
        }
        return totalDiff
    }

    beforeAll(async () => {
        const client = createClient(STREAM_CREATION_KEY)
        streamId1 = (await client.createStream(`/operatorvalueservicetest-1-${Date.now()}`)).id
        streamId2 = (await client.createStream(`/operatorvalueservicetest-2-${Date.now()}`)).id
        await client.destroy()
    })

    beforeEach(async () => {
        provider = getProvider()
        logger.debug('Connected to: ', await provider.getNetwork())

        token = new Contract(chainConfig.contracts.DATA, tokenABI) as unknown as TestToken

        ({ operatorWallet, operatorContract } = await setupOperatorContract({
            provider,
            chainConfig,
            theGraphUrl
        }))

        await (
            await token.connect(operatorWallet).transferAndCall(operatorContract.address, parseEther(`${STAKE_AMOUNT * 2}`), operatorWallet.address)
        ).wait()
        for (const streamId of [streamId1, streamId2]) {
            const sponsorship = await deploySponsorship(chainConfig, operatorWallet, { streamId })
            await (await token.connect(operatorWallet).transferAndCall(sponsorship.address, parseEther(`${SPONSOR_AMOUNT}`), '0x')).wait()
            await (await operatorContract.stake(sponsorship.address, parseEther(`${STAKE_AMOUNT}`))).wait()
        }
    }, 60 * 1000)

    // TODO: split into two test, where one verifies that not all sponsorships are used to update
    // .each([parseEther("0.001"),]
    test('updates only some (1) of the sponsorships to get under the threshold', async () => {
        const penaltyFraction = parseEther('0.001')
        const maintainOperatorValueService = new MaintainOperatorValueService(operatorConfig, penaltyFraction.toBigInt())

        const totalValueInSponsorshipsBefore = await operatorContract.totalValueInSponsorshipsWei()

        const approxValuesBefore = (await operatorContract.getApproximatePoolValuesPerSponsorship()).approxValues
        for (const approxValue of approxValuesBefore) {
            logger.debug(`approxValue: ${approxValue.toString()}`)
        }

        await waitForCondition(async () => {
            const diff = await getDiffBetweenApproxAndRealValues()
            const poolValue = await operatorContract.totalValueInSponsorshipsWei()
            const threshold = penaltyFraction.mul(poolValue).div(parseEther('1')).toBigInt()
            logger.debug(`diff: ${diff}, threshold: ${threshold}`)
            return diff > threshold 
        }, 10000, 1000)

        await maintainOperatorValueService.start()

        await waitForCondition(async () => (await operatorContract.totalValueInSponsorshipsWei()).gt(totalValueInSponsorshipsBefore), 10000, 1000)
        
        const diff = await getDiffBetweenApproxAndRealValues()

        const poolValue = await operatorContract.totalValueInSponsorshipsWei()
        const threshold = penaltyFraction.mul(poolValue).div(parseEther('1')).toBigInt()

        expect((await operatorContract.totalValueInSponsorshipsWei()).toBigInt()).toBeGreaterThan(totalValueInSponsorshipsBefore.toBigInt())
        logger.debug(`at end diff: ${diff}, threshold: ${threshold}`)
        expect(diff).toBeLessThan(threshold)
        const approxValuesAfter = (await operatorContract.getApproximatePoolValuesPerSponsorship()).approxValues
        for (const approxValue of approxValuesAfter) {
            logger.debug(`approxValue: ${approxValue.toString()}`)
        }
        // one of the values should have increased, but not both
        expect((approxValuesAfter[0].toBigInt() > approxValuesBefore[0].toBigInt()
            || approxValuesAfter[1].toBigInt() > approxValuesBefore[1].toBigInt())
            && !((approxValuesAfter[0].toBigInt() > approxValuesBefore[0].toBigInt()
            && approxValuesAfter[1].toBigInt() > approxValuesBefore[1].toBigInt()))).toBeTruthy()

        await maintainOperatorValueService.stop()
    }, 60 * 1000)
})

