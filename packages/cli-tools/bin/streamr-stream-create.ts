#!/usr/bin/env node
import { Command } from 'commander'
import { create } from '../src/create'
import {
    envOptions,
    authOptions,
    exitWithHelpIfArgsNotBetween,
    createFnParseInt
} from './common'
import pkg from '../package.json'
import { createClient } from '../src/client'

const program = new Command()
program
    .arguments('<streamId>')
    .description('create a new stream')
    .option('-d, --description <description>', 'define a description')
    .option('-c, --config <config>', 'define a configuration as JSON', (s: string) => JSON.parse(s))
    .option('-p, --partitions <count>', 'define a partition count',
        createFnParseInt('--partitions'))
authOptions(program)
envOptions(program)
    .version(pkg.version)
    .action((streamIdOrPath: string, options: any) => {
        const body: any = {
            id: streamIdOrPath,
            description: options.description,
            config: options.config,
            partitions: options.partitions
        }
        const client = createClient(options)
        create(body, client)
    })
    .parse(process.argv)

exitWithHelpIfArgsNotBetween(program, 1, 1)