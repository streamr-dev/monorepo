import { Operator, Sponsorship, operatorABI, sponsorshipABI } from '@streamr/network-contracts-ethers6'
import { StreamID, ensureValidStreamPartitionIndex, toStreamID } from '@streamr/protocol'
import { NetworkPeerDescriptor } from '@streamr/sdk'
import {
    EthereumAddress,
    Logger,
    TheGraphClient,
    addManagedEventListener,
    collect,
    toEthereumAddress
} from '@streamr/utils'
import { Contract, Overrides, Provider } from 'ethers'
import sample from 'lodash/sample'
import { SignerWithProvider } from '../Authentication'

interface RawResult {
    operator: null | { latestHeartbeatTimestamp: string | null }
}

interface EarningsData {
    sponsorshipAddresses: EthereumAddress[]
    sumDataWei: bigint
    maxAllowedEarningsDataWei: bigint
}

export const VOTE_KICK = '0x0000000000000000000000000000000000000000000000000000000000000001'
export const VOTE_NO_KICK = '0x0000000000000000000000000000000000000000000000000000000000000000'

export class ParseError extends Error {
    public readonly reasonText: string

    constructor(reasonText: string) {
        super(`Failed to parse metadata: ${reasonText}`)
        this.reasonText = reasonText
    }
}

export function parsePartitionFromReviewRequestMetadata(metadataAsString: string | undefined): number | never {
    if (metadataAsString === undefined) {
        throw new ParseError('no metadata')
    }

    let metadata: Record<string, unknown>
    try {
        metadata = JSON.parse(metadataAsString)
    } catch {
        throw new ParseError('malformed metadata')
    }

    const partition = Number(metadata.partition)
    if (isNaN(partition)) {
        throw new ParseError('invalid or missing "partition" field')
    }

    try {
        ensureValidStreamPartitionIndex(partition)
    } catch {
        throw new ParseError('invalid partition numbering')
    }

    return partition
}

const compareBigInts = (a: bigint, b: bigint) => {
    if (a < b) {
        return -1
    } else if (a > b) {
        return 1
    } else {
        return 0
    }
}

export type ReviewRequestListener = (
    sponsorship: EthereumAddress,
    operatorContractAddress: EthereumAddress,
    partition: number,
    votingPeriodStartTime: number,
    votingPeriodEndTime: number
) => void

const logger = new Logger(module)

export interface SponsorshipResult {
    sponsorshipAddress: EthereumAddress
    streamId: StreamID
    operatorCount: number
}

export interface Flag {
    id: string
    flaggingTimestamp: number
    target: {
        id: string
    }
    sponsorship: {
        id: string
    }
}

export class OperatorContractFacade {

    private readonly operatorContract: Operator  // TODO rename to "contract"
    private readonly signer: SignerWithProvider
    private readonly theGraphClient: TheGraphClient
    private readonly getEthersOverrides: () => Promise<Overrides>

    constructor(
        contractAddress: EthereumAddress,
        signer: SignerWithProvider,
        theGraphClient: TheGraphClient,
        getEthersOverrides: () => Promise<Overrides> = async () => ({})
    ) {
        this.operatorContract = new Contract(contractAddress, operatorABI, signer) as unknown as Operator
        this.signer = signer
        this.theGraphClient = theGraphClient
        this.getEthersOverrides = getEthersOverrides
    }

    async writeHeartbeat(nodeDescriptor: NetworkPeerDescriptor): Promise<void> {
        const metadata = JSON.stringify(nodeDescriptor)
        await (await this.operatorContract.heartbeat(metadata, await this.getEthersOverrides())).wait()
    }

    async getTimestampOfLastHeartbeat(): Promise<number | undefined> {
        const result = await this.theGraphClient.queryEntity<RawResult>({
            query: `{
                operator(id: "${await this.getOperatorContractAddress()}") {
                    latestHeartbeatTimestamp
                }
            }`
        })
        if (result.operator === null || result.operator.latestHeartbeatTimestamp === null) {
            return undefined
        } else {
            const timestampInSecs = parseInt(result.operator.latestHeartbeatTimestamp)
            if (isNaN(timestampInSecs)) {
                throw new Error('Assertion failed: unexpected non-integer latestHeartbeatTimestamp') // should never happen
            }
            return timestampInSecs * 1000
        }
    }

    async getOperatorContractAddress(): Promise<EthereumAddress> {
        return toEthereumAddress(await this.operatorContract.getAddress())
    }

    async getSponsorshipsOfOperator(operatorAddress: EthereumAddress): Promise<SponsorshipResult[]> {
        interface Stake {
            id: string
            sponsorship: {
                id: string
                operatorCount: number
                stream: {
                    id: string
                }
            }
        }
        const createQuery = (lastId: string, pageSize: number) => {
            return {
                query: `
                    {
                        operator(id: "${operatorAddress}") {
                            stakes(where: {id_gt: "${lastId}"}, first: ${pageSize}) {
                                id
                                sponsorship {
                                    id
                                    operatorCount
                                    stream {
                                        id
                                    }
                                }
                            }
                        }
                    }
                    `
            }
        }
        const parseItems = (response: { operator?: { stakes: Stake[] } }): Stake[] => {
            return response.operator?.stakes ?? []
        }
        const queryResult = this.theGraphClient.queryEntities<Stake>(createQuery, parseItems)
        const results: SponsorshipResult[] = []
        for await (const stake of queryResult) {
            results.push({
                sponsorshipAddress: toEthereumAddress(stake.sponsorship.id),
                streamId: toStreamID(stake.sponsorship.stream.id),
                operatorCount: stake.sponsorship.operatorCount
            })
        }
        return results
    }

    async getExpiredFlags(sponsorships: EthereumAddress[], maxAgeInMs: number): Promise<Flag[]> {
        const maxFlagStartTime = Math.floor((Date.now() - maxAgeInMs) / 1000)
        const createQuery = (lastId: string, pageSize: number) => {
            return {
                query: `
                {
                    flags (where : {
                        id_gt: "${lastId}",
                        flaggingTimestamp_lt: ${maxFlagStartTime},
                        result_in: ["waiting", "voting"],
                        sponsorship_in: ${JSON.stringify(sponsorships)}
                    }, first: ${pageSize}) {
                        id
                        flaggingTimestamp
                        target {
                            id
                        }
                        sponsorship {
                            id
                        }
                    }
                }`
            }
        }
        const flagEntities = this.theGraphClient.queryEntities<Flag>(createQuery)
        const flags: Flag[] = []
        for await (const flag of flagEntities) {
            flags.push(flag)
        }
        return flags
    }

    async getOperatorsInSponsorship(sponsorshipAddress: EthereumAddress): Promise<EthereumAddress[]> {
        interface Stake {
            id: string
            operator: {
                id: string
            }
        }
        const createQuery = (lastId: string, pageSize: number) => {
            return {
                query: `
                    {
                        sponsorship(id: "${sponsorshipAddress}") {
                            stakes(where: {id_gt: "${lastId}"}, first: ${pageSize}) {
                                id
                                operator {
                                    id
                                }
                            }
                        }
                    }
                    `
            }
        }
        const parseItems = (response: { sponsorship?: { stakes: Stake[] } } ): Stake[] => {
            return response.sponsorship?.stakes ?? []
        }
        const queryResult = this.theGraphClient.queryEntities<Stake>(createQuery, parseItems)
        const operatorIds: EthereumAddress[] = []
        for await (const stake of queryResult) {
            operatorIds.push(toEthereumAddress(stake.operator.id))
        }
        return operatorIds
    }

    async flag(sponsorship: EthereumAddress, operator: EthereumAddress, partition: number): Promise<void> {
        const metadata = JSON.stringify({ partition })
        await (await this.operatorContract.flag(sponsorship, operator, metadata, await this.getEthersOverrides())).wait()
    }

    async getRandomOperator(): Promise<EthereumAddress | undefined> {
        const latestBlock = await this.getProvider().getBlockNumber()
        const operators = await this.getOperatorAddresses(latestBlock)
        const excluded = await this.getOperatorContractAddress()
        const operatorAddresses = operators.filter((id) => id !== excluded)
        logger.debug(`Found ${operatorAddresses.length} operators`)
        return sample(operatorAddresses)
    }

    /**
     * Find the sum of earnings in Sponsorships (that the Operator must withdraw before the sum reaches a limit),
     * SUBJECT TO the constraints, set in the OperatorServiceConfig:
     *  - only take at most maxSponsorshipsInWithdraw addresses (those with most earnings), or all if undefined
     *  - only take sponsorships that have more than minSponsorshipEarningsInWithdraw, or all if undefined
     */
    async getEarningsOf(
        operatorContractAddress: EthereumAddress,
        minSponsorshipEarningsInWithdraw: number,
        maxSponsorshipsInWithdraw: number
    ): Promise<EarningsData> {
        const operator = new Contract(operatorContractAddress, operatorABI, this.signer) as unknown as Operator
        const minSponsorshipEarningsInWithdrawWei = BigInt(minSponsorshipEarningsInWithdraw ?? 0)
        const {
            addresses: allSponsorshipAddresses,
            earnings,
            maxAllowedEarnings,
        } = await operator.getSponsorshipsAndEarnings()

        const sponsorships = allSponsorshipAddresses
            .map((address, i) => ({ address, earnings: earnings[i] }))
            .filter((sponsorship) => sponsorship.earnings >= minSponsorshipEarningsInWithdrawWei)
            .sort((a, b) => compareBigInts(a.earnings, b.earnings)) // TODO: after Node 20, use .toSorted() instead
            .slice(0, maxSponsorshipsInWithdraw) // take all if maxSponsorshipsInWithdraw is undefined

        return {
            sponsorshipAddresses: sponsorships.map((sponsorship) => toEthereumAddress(sponsorship.address)),
            sumDataWei: sponsorships.reduce((sum, sponsorship) => sum += sponsorship.earnings, 0n),
            maxAllowedEarningsDataWei: maxAllowedEarnings
        }
    }

    async getMyEarnings(
        minSponsorshipEarningsInWithdraw: number,
        maxSponsorshipsInWithdraw: number
    ): Promise<EarningsData> {
        return this.getEarningsOf(
            await this.getOperatorContractAddress(),
            minSponsorshipEarningsInWithdraw,
            maxSponsorshipsInWithdraw
        )
    }

    async withdrawMyEarningsFromSponsorships(sponsorshipAddresses: EthereumAddress[]): Promise<void> {
        await (await this.operatorContract.withdrawEarningsFromSponsorships(
            sponsorshipAddresses,
            await this.getEthersOverrides()
        )).wait()
    }

    async triggerWithdraw(targetOperatorAddress: EthereumAddress, sponsorshipAddresses: EthereumAddress[]): Promise<void> {
        await (await this.operatorContract.triggerAnotherOperatorWithdraw(
            targetOperatorAddress,
            sponsorshipAddresses,
            await this.getEthersOverrides()
        )).wait()
    }

    private async getOperatorAddresses(requiredBlockNumber: number): Promise<EthereumAddress[]> {
        // TODO: find a clever more efficient way of selecting a random operator? (NET-1113)
        const createQuery = (lastId: string, pageSize: number) => {
            return {
                query: `
                    {
                        operators(where: {totalStakeInSponsorshipsWei_gt: "0", id_gt: "${lastId}"}, first: ${pageSize}) {
                            id
                        }
                    }
                    `
            }
        }
        this.theGraphClient.updateRequiredBlockNumber(requiredBlockNumber)
        const queryResult = this.theGraphClient.queryEntities<{ id: string }>(createQuery)

        const operatorAddresses: EthereumAddress[] = []
        for await (const operator of queryResult) {
            operatorAddresses.push(toEthereumAddress(operator.id))
        }
        return operatorAddresses
    }

    async* pullStakedStreams(
        requiredBlockNumber: number
    ): AsyncGenerator<{ sponsorship: { id: string, stream: { id: string } } }, undefined, undefined> {
        const contractAddress = await this.getOperatorContractAddress()
        const createQuery = (lastId: string, pageSize: number) => {
            return {
                query: `
                    {
                        operator(id: "${contractAddress}") {
                            stakes(where: {id_gt: "${lastId}"}, first: ${pageSize}) {
                                sponsorship {
                                    id
                                    stream {
                                        id
                                    }
                                }
                            }
                        }
                        _meta {
                            block {
                            number
                            }
                        }
                    }
                    `
            }
        }
        const parseItems = (response: any) => {
            if (!response.operator) {
                logger.error('Unable to find operator in The Graph', { operatorContractAddress: contractAddress })
                return []
            }
            return response.operator.stakes
        }
        this.theGraphClient.updateRequiredBlockNumber(requiredBlockNumber)
        yield* this.theGraphClient.queryEntities<{ id: string, sponsorship: { id: string, stream: { id: string } } }>(createQuery, parseItems)
    }

    async hasOpenFlag(operatorAddress: EthereumAddress, sponsorshipAddress: EthereumAddress): Promise<boolean> {
        const createQuery = () => {
            return {
                query: `
                    {
                        flags(where: {
                            sponsorship: "${sponsorshipAddress}",
                            target: "${operatorAddress}",
                            result_in: ["waiting", "voting"]
                        }) {
                            id
                        }
                    }
                    `
            }
        }
        const queryResult = this.theGraphClient.queryEntities<{ id: string }>(createQuery)

        const flags = await collect(queryResult, 1)
        if (flags.length > 0) {
            logger.debug('Found open flag', { flag: flags[0] })
            return true
        } else {
            return false
        }
    }

    addReviewRequestListener(listener: ReviewRequestListener, abortSignal: AbortSignal): void {
        addManagedEventListener<any, any>(
            this.operatorContract as any,
            'ReviewRequest',
            async (
                sponsorship: string,
                targetOperator: string,
                voteStartTimestampInSecs: number,
                voteEndTimestampInSecs: number,
                metadataAsString?: string
            ) => {
                let partition: number
                try {
                    partition = parsePartitionFromReviewRequestMetadata(metadataAsString)
                } catch (err) {
                    if (err instanceof ParseError) {
                        logger.warn(`Skip review request (${err.reasonText})`, {
                            address: await this.operatorContract.getAddress(),
                            sponsorship,
                            targetOperator,
                        })
                    } else {
                        logger.warn('Encountered unexpected error', { err })
                    }
                    return
                }
                logger.debug('Receive review request', {
                    address: await this.operatorContract.getAddress(),
                    sponsorship,
                    targetOperator,
                    partition
                })
                listener(
                    toEthereumAddress(sponsorship),
                    toEthereumAddress(targetOperator),
                    partition,
                    voteStartTimestampInSecs * 1000,
                    voteEndTimestampInSecs * 1000
                )
            },
            abortSignal
        )
    }

    async getStreamId(sponsorshipAddress: string): Promise<StreamID> {
        const sponsorship = new Contract(sponsorshipAddress, sponsorshipABI, this.signer) as unknown as Sponsorship
        return toStreamID(await sponsorship.streamId())
    }

    async voteOnFlag(sponsorship: string, targetOperator: string, kick: boolean): Promise<void> {
        const voteData = kick ? VOTE_KICK : VOTE_NO_KICK
        // typical gas cost 99336, but this has shown insufficient sometimes
        // TODO should we set gasLimit only here, or also for other transactions made by ContractFacade?
        await (await this.operatorContract.voteOnFlag(
            sponsorship,
            targetOperator,
            voteData,
            { ...this.getEthersOverrides(), gasLimit: '1300000' }
        )).wait()
    }

    async closeFlag(sponsorship: string, targetOperator: string): Promise<void> {
        // voteOnFlag is not used to vote here but to close the expired flag. The vote data gets ignored.
        // Anyone can call this function at this point.
        await this.voteOnFlag(sponsorship, targetOperator, false)
    }

    addOperatorContractStakeEventListener(eventName: 'Staked' | 'Unstaked', listener: (sponsorship: string) => unknown): void {
        this.operatorContract.on(eventName as any, listener)  // TODO better type
    }

    removeOperatorContractStakeEventListener(eventName: 'Staked' | 'Unstaked', listener: (sponsorship: string) => unknown): void {
        this.operatorContract.off(eventName, listener)
    }

    getProvider(): Provider {
        return this.signer.provider
    }
}