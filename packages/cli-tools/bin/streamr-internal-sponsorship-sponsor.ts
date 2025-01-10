#!/usr/bin/env node
import '../src/logLevel'

import { StreamrClient, _operatorContractUtils } from '@streamr/sdk'
import { createClientCommand } from '../src/command'

createClientCommand(async (client: StreamrClient, sponsorshipAddress: string, amountWei: bigint) => {
    await _operatorContractUtils.sponsor(await client.getSigner(), sponsorshipAddress, amountWei, _operatorContractUtils.getTestTokenContract())
})
    .arguments('<sponsorshipAddress> <amountWei>')
    .description('sponsor a stream')
    .parseAsync()
