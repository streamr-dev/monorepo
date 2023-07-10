import { Contract } from '@ethersproject/contracts'
import { Provider } from '@ethersproject/providers'
import { Signer } from '@ethersproject/abstract-signer'
import { operatorABI } from '@streamr/network-contracts'
import type { Operator } from '@streamr/network-contracts'
import { Logger } from '@streamr/utils'
import { OperatorServiceConfig } from './OperatorPlugin'

export const VOTE_KICK = '0x0000000000000000000000000000000000000000000000000000000000000001'
export const VOTE_NO_KICK = '0x0000000000000000000000000000000000000000000000000000000000000000'

const logger = new Logger(module)

export class VoteOnSuspectNodeHelper {
    provider: Provider
    address: string
    contract: Operator
    signer: Signer
    callback: (sponsorship: string, operatorContractAddress: string) => void

    constructor(config: OperatorServiceConfig,
        callback: (sponsorship: string, soperatorContractAddress: string) => void) {
        logger.trace('OperatorClient created')
        this.callback = callback
        this.address = config.operatorContractAddress
        this.provider = config.provider
        this.signer = config.signer
        this.signer.connect(this.provider)
        this.contract = new Contract(config.operatorContractAddress, operatorABI, this.signer) as unknown as Operator
    }

    async start(): Promise<void> {
        logger.info('Starting NodeInspectionHelper')
        this.contract.on('ReviewRequest', async (sponsorship: string, targetOperator: string) => {
            logger.info(`${this.contract.address} got ReviewRequest event ${sponsorship} ${targetOperator}`)
            this.callback(sponsorship, targetOperator)
        })
    }

    async flag(sponsorship: string, operator: string): Promise<void> {
        await (await this.contract.flag(sponsorship, operator)).wait()
    }

    async voteOnFlag(sponsorship: string, targetOperator: string, kick: boolean): Promise<void> {
        const voteData = kick ? VOTE_KICK : VOTE_NO_KICK
        await (await this.contract.voteOnFlag(sponsorship, targetOperator, voteData)).wait()
    }

    stop(): void {
        this.provider.removeAllListeners()
    }
}
