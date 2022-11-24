#!/usr/bin/env node
import { createCommand } from '../src/command'
import { getClientConfig } from '../src/client'
import snapshot from '@snapshot-labs/snapshot.js'
import { Wallet } from '@ethersproject/wallet'
import { PrivateKeyAuthConfig } from 'streamr-client'

const hub = 'https://hub.snapshot.org'
const snapshotClient = new snapshot.Client712(hub)

const vote = async (privateKey: string, proposal: string, choice: number) => {
    const wallet = new Wallet(privateKey)
    try {
        console.log(`Wallet ${wallet.address} voting for choice ${choice} on proposal ${proposal}...`)
        await snapshotClient.vote(wallet, wallet.address, {
            space: 'streamr.eth',
            proposal,
            type: 'single-choice', // support only this type for now
            choice,
            app: 'cli-tool'
        })
        console.log(`Wallet ${wallet.address} successfully voted for choice ${choice} on proposal ${proposal}`)
    } catch (err) {
        console.error(err)
        process.exit(1)
    }
}

createCommand()
    .description('vote on a Streamr governance proposal')
    .arguments('<proposalId> <choiceId>')
    .option('--private-key <key>', 'use an Ethereum private key to authenticate')
    .option('--config <file>', 'read connection and authentication settings from a config file')
    .action(async (proposalId: string, choiceId: string, options, command) => {
        const config = getClientConfig(options)
        if (!config.auth || !(config.auth as PrivateKeyAuthConfig).privateKey) {
            console.error('You must pass a private key either via --private-key or via a config file using --config')
            command.help()
            process.exit(1)
        } 

        const choiceIdAsNumber = parseInt(choiceId)
        if (Number.isNaN(choiceIdAsNumber) || choiceIdAsNumber <= 0) {
            console.error(`Invalid choice number: ${choiceId}. The first choice is 1, second is 2, and so on.`)
            command.help()
            process.exit(1)
        }

        await vote((config.auth as PrivateKeyAuthConfig).privateKey, proposalId, choiceIdAsNumber)
    })
    .parseAsync()
