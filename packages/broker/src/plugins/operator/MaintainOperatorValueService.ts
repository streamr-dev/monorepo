import { Logger, scheduleAtInterval } from '@streamr/utils'
import { MaintainOperatorValueHelper } from './MaintainOperatorValueHelper'
import { OperatorServiceConfig } from './OperatorPlugin'

const logger = new Logger(module)

const DEFAULT_CHECK_VALUE_INTERVAL_MS = 1000 * 60 * 60 * 24 // 1 day

export class MaintainOperatorValueService {
    private readonly withdrawLimitSafetyFraction: bigint
    private penaltyLimitFraction?: bigint
    private readonly helper: MaintainOperatorValueHelper
    private readonly abortController: AbortController
    private readonly checkIntervalInMs: number

    constructor(config: OperatorServiceConfig, withdrawLimitSafetyFraction = 0.5, checkValueIntervalMs = DEFAULT_CHECK_VALUE_INTERVAL_MS) {
        this.withdrawLimitSafetyFraction = BigInt(withdrawLimitSafetyFraction * 1e18)
        this.helper = new MaintainOperatorValueHelper(config)
        this.abortController = new AbortController()
        this.checkIntervalInMs = checkValueIntervalMs
    }

    async start(): Promise<void> {
        this.penaltyLimitFraction = await this.helper.getPenaltyLimitFraction()

        await scheduleAtInterval(
            () => this.checkMyUnwithdrawnEarnings().catch((err) => {
                logger.error('Encountered error while checking unwithdrawn earnings', { err })
            }),
            this.checkIntervalInMs,
            true,
            this.abortController.signal
        )
    }

    private async checkMyUnwithdrawnEarnings(): Promise<void> {
        logger.info('Check whether it is time to withdraw my earnings')
        const { fraction, sponsorshipAddresses } = await this.helper.getMyUnwithdrawnEarnings()
        const safeUnwithdrawnEarningsFraction = this.penaltyLimitFraction! * this.withdrawLimitSafetyFraction / BigInt(1e18)
        logger.info(` -> is ${fraction / BigInt(1e16)}% > ${safeUnwithdrawnEarningsFraction / BigInt(1e16)}% ?`)
        if (fraction > safeUnwithdrawnEarningsFraction) {
            logger.info('Withdrawing earnings from sponsorships', { sponsorshipAddresses })
            await this.helper.withdrawMyEarningsFromSponsorships(sponsorshipAddresses)
        }
    }

    async stop(): Promise<void> {
        this.abortController.abort()
    }
}
