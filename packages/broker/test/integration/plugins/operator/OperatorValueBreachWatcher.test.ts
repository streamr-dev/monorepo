import { Wallet } from "ethers"
import { Contract } from "@ethersproject/contracts"
import { Provider, JsonRpcProvider } from "@ethersproject/providers"
import { parseEther, formatEther } from "@ethersproject/units"

import { tokenABI, TestToken, Operator, streamRegistryABI, StreamRegistry } from "@streamr/network-contracts"
import { Logger, toEthereumAddress, waitForCondition } from '@streamr/utils'
import { config } from "@streamr/config"

import { deployOperatorContract } from "./deployOperatorContract"
import { deploySponsorship } from "./deploySponsorshipContract"
import { ADMIN_WALLET_PK, generateWalletWithGasAndTokens } from "./smartContractUtils"

import { OperatorValueBreachWatcher } from "../../../../src/plugins/operator/OperatorValueBreachWatcher"
import { STREAMR_DOCKER_DEV_HOST } from '../../../utils'

const fastChainConfig = config.dev2
const theGraphUrl = `http://${STREAMR_DOCKER_DEV_HOST}:8800/subgraphs/name/streamr-dev/network-subgraphs`

const logger = new Logger(module)

async function getTotalUnwithdrawnEarnings(operatorContract: Operator): Promise<bigint> {
    const { earnings } = await operatorContract.getEarningsFromSponsorships()
    let unwithdrawnEarnings = BigInt(0)
    for (const e of earnings) {
        unwithdrawnEarnings += e.toBigInt()
    }
    logger.debug(`Total unwithdrawn earnings: ${formatEther(unwithdrawnEarnings.toString())} (t = ${Date.now()})`)
    return unwithdrawnEarnings
}

describe("OperatorValueBreachWatcher", () => {
    let provider: Provider
    let token: TestToken
    let streamId: string

    const deployNewOperator = async () => {
        const operatorWallet = await generateWalletWithGasAndTokens(provider, fastChainConfig)
        logger.debug("Deploying operator contract")
        const operatorContract = await deployOperatorContract(fastChainConfig, operatorWallet, { operatorSharePercent: 10 })
        logger.debug(`Operator deployed at ${operatorContract.address}`)
        const operatorConfig = {
            operatorContractAddress: toEthereumAddress(operatorContract.address),
            provider,
            theGraphUrl,
            signer: operatorWallet,
            maxSponsorshipsCount: 20,
            minSponsorshipEarnings: 1 // full tokens
        }
        return { operatorWallet, operatorContract, operatorConfig }
    }

    beforeAll(async () => {
        provider = new JsonRpcProvider(`http://${STREAMR_DOCKER_DEV_HOST}:8547`)
        logger.debug("Connected to: ", await provider.getNetwork())

        const adminWallet = new Wallet(ADMIN_WALLET_PK, provider)
        const streamRegistry = new Contract(fastChainConfig.contracts.StreamRegistry, streamRegistryABI, adminWallet) as unknown as StreamRegistry
        logger.debug("Creating stream for the test")
        const createStreamReceipt = await (await streamRegistry.createStream(
            `/operatorvaluewatchertest-${Date.now()}`,
            '{"partitions":1}"}')
        ).wait()
        streamId = createStreamReceipt.events?.find((e) => e.event === "StreamCreated")?.args?.id
        const streamExists = await streamRegistry.exists(streamId)
        logger.debug("Stream created:", { streamId, streamExists })
        // TODO: use createClient once configs allow it. For now I'm creating the stream directly using the contract
        // const client = createClient(ADMIN_WALLET_PK, {
        //     contracts: {
        //         streamRegistryChainAddress: contracts.streamRegistry.address,
        //     },
        // })
        // streamId = (await client.createStream(`/operatorvaluewatchertest-${Date.now()}`)).id
        // await client.destroy()

        token = new Contract(fastChainConfig.contracts.DATA, tokenABI) as unknown as TestToken
    }, 60 * 1000)

    it("can find a random operator, excluding himself", async () => {
        const { operatorContract, operatorConfig } = await deployNewOperator()
        // deploy another operator to make sure there are at least 2 operators
        await deployNewOperator()

        const operatorValueBreachWatcher = new OperatorValueBreachWatcher(operatorConfig)
        const randomOperatorAddress = operatorValueBreachWatcher.helper.getRandomOperator()
        // check it's not my operator
        expect(randomOperatorAddress).not.toEqual(operatorContract.address)
        // TODO: check it's an operator (from OperatorFactory?)
    })

    it("withdraws the other Operator's earnings when they are above the penalty limit", async () => {
        const { operatorConfig: watcherConfig } = await deployNewOperator()
        const { operatorWallet, operatorContract } = await deployNewOperator()
        
        const sponsorship1 = await deploySponsorship(fastChainConfig, operatorWallet, { streamId, earningsPerSecond: parseEther("1") })
        await (await token.connect(operatorWallet).transferAndCall(sponsorship1.address, parseEther("250"), "0x")).wait()
        await (await token.connect(operatorWallet).transferAndCall(operatorContract.address, parseEther("200"), operatorWallet.address)).wait()
        await (await operatorContract.stake(sponsorship1.address, parseEther("100"))).wait()

        const sponsorship2 = await deploySponsorship(fastChainConfig, operatorWallet, { streamId, earningsPerSecond: parseEther("2") })
        await (await token.connect(operatorWallet).transferAndCall(sponsorship2.address, parseEther("250"), "0x")).wait()
        await (await operatorContract.stake(sponsorship2.address, parseEther("100"))).wait()

        const operatorValueBreachWatcher = new OperatorValueBreachWatcher(watcherConfig)

        const poolValueBeforeWithdraw = await operatorContract.getApproximatePoolValue()
        const allowedDifference = poolValueBeforeWithdraw.div("10").toBigInt()

        // overwrite (for this test only) the getRandomOperator method to deterministically return the operator's address
        operatorValueBreachWatcher.helper.getRandomOperator = async () => {
            return toEthereumAddress(operatorContract.address)
        }

        logger.debug("Waiting until above", { allowedDifference })
        await waitForCondition(async () => await getTotalUnwithdrawnEarnings(operatorContract) > allowedDifference, 10000, 1000)
        await operatorValueBreachWatcher.start()
        logger.debug("Waiting until below", { allowedDifference })
        await waitForCondition(async () => await getTotalUnwithdrawnEarnings(operatorContract) < allowedDifference, 10000, 1000)

        const poolValueAfterWithdraw = await operatorContract.getApproximatePoolValue()
        expect(poolValueAfterWithdraw.toBigInt()).toBeGreaterThan(poolValueBeforeWithdraw.toBigInt())

        await operatorValueBreachWatcher.stop()

    }, 60 * 1000)
})
