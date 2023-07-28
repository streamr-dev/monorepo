import { utils, Wallet, Contract, ContractReceipt } from "ethers"

import { Chain } from "@streamr/config"
import { Logger } from "@streamr/utils"

import { sponsorshipABI, sponsorshipFactoryABI, streamRegistryABI } from "@streamr/network-contracts"
import type { Sponsorship, SponsorshipFactory, StreamRegistry } from "@streamr/network-contracts"

const { parseEther } = utils

const logger = new Logger(module)

export async function deploySponsorship(
    chainConfig: Chain,
    deployer: Wallet, {
        streamId = `Stream-${Date.now()}`,
        metadata = "{}",
        minimumStakeWei = parseEther("60"),
        minHorizonSeconds = 0,
        minOperatorCount = 1,
        earningsPerSecond = parseEther("0.01"),
    } = {},
): Promise<Sponsorship> {
    const { contracts } = chainConfig
    logger.debug("deploySponsorship", { contracts, deployerBalance: await deployer.getBalance() })

    const sponsorshipFactory = new Contract(contracts.SponsorshipFactory, sponsorshipFactoryABI, deployer) as unknown as SponsorshipFactory
    const streamRegistry = new Contract(contracts.StreamRegistry, streamRegistryABI, deployer) as unknown as StreamRegistry

    const streamExists = await streamRegistry.exists(streamId)
    logger.debug("Stream to be sponsored", { streamId, streamExists })

    if (!streamExists) { throw new Error(`Can't deploy Sponsorship contract for non-existent stream: ${streamId}`) }

    const sponsorshipDeployTx = await sponsorshipFactory.deploySponsorship(
        minimumStakeWei.toString(),
        minHorizonSeconds.toString(),
        minOperatorCount.toString(),
        streamId,
        metadata,
        [
            contracts.SponsorshipStakeWeightedAllocationPolicy,
            contracts.SponsorshipDefaultLeavePolicy,
            contracts.SponsorshipVoteKickPolicy,
        ], [
            earningsPerSecond,
            "0",
            "0"
        ]
    )
    const sponsorshipDeployReceipt = await sponsorshipDeployTx.wait() as ContractReceipt
    const newSponsorshipEvent = sponsorshipDeployReceipt.events?.find((e) => e.event === "NewSponsorship")
    const newSponsorshipAddress = newSponsorshipEvent?.args?.sponsorshipContract
    const newSponsorship = new Contract(newSponsorshipAddress, sponsorshipABI, deployer) as unknown as Sponsorship

    return newSponsorship
}
