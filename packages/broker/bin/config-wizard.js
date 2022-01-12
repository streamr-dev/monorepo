#!/usr/bin/env node

const startBrokerConfigWizard = require('../dist/src/ConfigWizard').start

const program = require('commander')

const CURRENT_VERSION = require('../package.json').version

program
    .version(CURRENT_VERSION)
    .name('broker-config-wizard')
    .description('Run the configuration wizard for the broker')
    
startBrokerConfigWizard()