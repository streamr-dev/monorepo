#!/usr/bin/env node
import '../src/logLevel'

import { StreamrClient, _operatorContractUtils } from '@streamr/sdk'
import { createClientCommand } from '../src/command'

createClientCommand(async (client: StreamrClient, operatorContractAddress: string, sponsorshipAddress: string, amountWei: bigint) => {
    const operatorContract = _operatorContractUtils.getOperatorContract(operatorContractAddress).connect(client.getSigner())
    await _operatorContractUtils.stake(operatorContract, sponsorshipAddress, amountWei)
})
    .arguments('<operatorContractAddress> <sponsorshipAddress> <amountWei>')
    .description('stake funds to a sponsorship')
    .parseAsync()
