#!/usr/bin/env node
import '../src/logLevel'

import { StreamrClient, _operatorContractUtils } from '@streamr/sdk'
import { createClientCommand } from '../src/command'

createClientCommand(async (client: StreamrClient, operatorAddress: string, amountWei: bigint) => {
    await _operatorContractUtils.delegate(await client.getSigner(), operatorAddress, amountWei, _operatorContractUtils.getTestTokenContract())
})
    .arguments('<operatorAddress> <amountWei>')
    .description('delegate funds to an operator')
    .parseAsync()
