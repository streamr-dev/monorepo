import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'fs'
import os from 'os'
import path from 'path'
import { getNodeMnemonic, start } from '../../src/config/ConfigWizard'
import { render } from '@inquirer/testing'
import {
    checkbox as checkboxMock,
    confirm as confirmMock,
    input as inputMock,
    password as passwordMock,
    select as selectMock,
} from '@inquirer/prompts'
import chalk from 'chalk'
import { Wallet } from 'ethers'

const checkbox = checkboxMock as jest.MockedFunction<any>

const confirm = confirmMock as jest.MockedFunction<any>

const input = inputMock as jest.MockedFunction<any>

const password = passwordMock as jest.MockedFunction<any>

const select = selectMock as jest.MockedFunction<any>

jest.mock('@inquirer/prompts', () => {
    const inquirer = jest.requireActual('@inquirer/prompts')

    return {
        ...inquirer,
        checkbox: jest.fn(inquirer.checkbox),
        confirm: jest.fn(inquirer.confirm),
        input: jest.fn(inquirer.input),
        password: jest.fn(inquirer.password),
        select: jest.fn(inquirer.select),
    }
})

type AnswerMock = {
    prompt: jest.MockedFunction<any>
    question: RegExp
    action: (r: Awaited<ReturnType<typeof render>>) => Promise<void>
    validate?: (screen: string) => void
}

const GeneratedPrivateKey =
    '0x9a2f3b058b9b457f9f954e62ea9fd2cefe2978736ffb3ef2c1782ccfad9c411d'

const ImportedPrivateKey =
    '0xb269c55ff525eac7633e80c01732d499015d5c22ce952e68272023c1d6c7f92f'

const OperatorAddress = '0x54d68882d5329397928787ec496da3ba8e45c48c'

describe('Config wizard', () => {
    let logs: string[] = []

    let tempDir = mkdtempSync(path.join(os.tmpdir(), 'test-config-wizard'))

    let storagePath = path.join(tempDir, 'config.json')

    beforeEach(() => {
        jest.clearAllMocks()

        tempDir = mkdtempSync(path.join(os.tmpdir(), 'test-config-wizard'))

        storagePath = path.join(tempDir, 'config.json')

        logs = []

        jest.spyOn(console, 'info').mockImplementation((...args: unknown[]) => {
            const log = args
                .join('')
                .replace(/\x1B\[\d+m/g, '')
                .trim()

            if (log) {
                logs.push(log)
            }
        })

        jest.spyOn(Wallet, 'createRandom').mockImplementation(
            () => new Wallet(GeneratedPrivateKey)
        )
    })

    afterAll(() => {
        jest.clearAllMocks()
    })

    it('creates a config file with a generates private key', async () => {
        await expect([
            Step.privateKeySource('enter'),
            Step.revealPrivateKey('enter'),
            Step.network('enter'),
            Step.rewards({ type: 'n' }, 'enter'),
            Step.pubsub({ type: 'n' }, 'enter'),
            Step.storage({ type: storagePath }, 'enter'),
        ]).toMatchAnswers(
            'Generate',
            false,
            'polygon',
            false,
            false,
            storagePath
        )

        const config = JSON.parse(readFileSync(storagePath).toString('utf-8'))

        expect(config).toMatchObject({
            client: {
                auth: {
                    privateKey: GeneratedPrivateKey,
                },
            },
        })

        expect(config.plugins).toBeEmptyObject()

        expect('httpServer' in config).toBe(false)

        expect(config).not.toMatchObject({
            client: {
                contracts: expect.anything(),
                network: expect.anything(),
            },
        })

        const summary = logs.join('\n')

        expect(summary).toMatch(/congratulations/i)

        expect(summary).toInclude(
            `node address is 0x909DC59FF7A3b23126bc6F86ad44dD808fd424Dc\n`
        )

        expect(summary).toInclude(`generated name is Mountain Until Gun\n`)

        expect(summary).toInclude(`streamr-broker ${storagePath}\n`)
    })

    it('prints out the generated private key onto the screen', async () => {
        await expect([
            Step.privateKeySource('enter'),
            Step.revealPrivateKey({ type: 'Y' }, 'enter', {
                find: GeneratedPrivateKey,
            }),
            Step.network('enter'),
            Step.rewards('abort'),
        ]).toMatchAnswers('Generate', true, 'polygon')
    })

    it('creates a config file with an imported private key', async () => {
        await expect([
            Step.privateKeySource({ keypress: 'down' }, 'enter'),
            Step.providePrivateKey({ type: ImportedPrivateKey }, 'enter'),
            Step.network('enter'),
            Step.rewards({ type: 'n' }, 'enter'),
            Step.pubsub({ type: 'n' }, 'enter'),
            Step.storage({ type: storagePath }, 'enter'),
        ]).toMatchAnswers(
            'Import',
            ImportedPrivateKey,
            'polygon',
            false,
            false,
            storagePath
        )

        const config = JSON.parse(readFileSync(storagePath).toString('utf-8'))

        expect(config).toMatchObject({
            client: {
                auth: {
                    privateKey: ImportedPrivateKey,
                },
            },
        })

        expect(config.plugins).toBeEmptyObject()

        expect('httpServer' in config).toBe(false)

        expect(config).not.toMatchObject({
            client: {
                contracts: expect.anything(),
                network: expect.anything(),
            },
        })

        const summary = logs.join('\n')

        expect(summary).toMatch(/congratulations/i)

        expect(summary).toInclude(
            `node address is 0x58cf5F58A722C544b7c39868c78D571519bB08b0\n`
        )

        expect(summary).toInclude(`generated name is Flee Kit Stomach\n`)

        expect(summary).toInclude(`streamr-broker ${storagePath}\n`)
    })

    it('validates given private key', async () => {
        await expect([
            Step.privateKeySource({ keypress: 'down' }, 'enter'),
            Step.providePrivateKey(
                { type: 'zzz' },
                'enter',
                { find: /invalid private key/i },
                { keypress: 'backspace' },
                { keypress: 'backspace' },
                { keypress: 'backspace' },
                { type: ImportedPrivateKey },
                'enter'
            ),
            Step.network('abort'),
        ]).toMatchAnswers('Import', ImportedPrivateKey)

        expect(existsSync(storagePath)).toBe(false)
    })

    it('enables rewards (operator plugin)', async () => {
        await expect([
            Step.privateKeySource('enter'),
            Step.revealPrivateKey('enter'),
            Step.network('enter'),
            Step.rewards('enter'),
            Step.operator({ type: OperatorAddress }, 'enter'),
            Step.pubsub({ type: 'n' }, 'enter'),
            Step.storage({ type: storagePath }, 'enter'),
        ]).toMatchAnswers(
            'Generate',
            false,
            'polygon',
            true,
            OperatorAddress,
            false,
            storagePath
        )

        const config = JSON.parse(readFileSync(storagePath).toString('utf-8'))

        expect(config).toMatchObject({
            client: {
                auth: {
                    privateKey: GeneratedPrivateKey,
                },
            },
        })

        const { operator, ...otherPlugins } = config.plugins

        expect(operator).toMatchObject({
            operatorContractAddress: OperatorAddress,
        })

        expect(otherPlugins).toBeEmptyObject()

        expect('httpServer' in config).toBe(false)

        expect(config).not.toMatchObject({
            client: {
                contracts: expect.anything(),
                network: expect.anything(),
            },
        })

        const summary = logs.join('\n')

        expect(summary).toMatch(/congratulations/i)

        expect(summary).toInclude(
            `node address is 0x909DC59FF7A3b23126bc6F86ad44dD808fd424Dc\n`
        )

        expect(summary).toInclude(`generated name is Mountain Until Gun\n`)

        expect(summary).toInclude(`streamr-broker ${storagePath}\n`)
    })

    it('validates the operator address', async () => {
        await expect([
            Step.privateKeySource('enter'),
            Step.revealPrivateKey('enter'),
            Step.network('enter'),
            Step.rewards('enter'),
            Step.operator(
                { type: 'zzz' },
                'enter',
                { find: /invalid ethereum address/i },
                { keypress: 'backspace' },
                { keypress: 'backspace' },
                { keypress: 'backspace' },
                { type: OperatorAddress },
                'enter'
            ),
            Step.pubsub('abort'),
        ]).toMatchAnswers('Generate', false, 'polygon', true, OperatorAddress)

        expect(existsSync(storagePath)).toBe(false)
    })

    it('enables WebSocket plugin on the default port', async () => {
        await expect([
            Step.privateKeySource('enter'),
            Step.revealPrivateKey('enter'),
            Step.network('enter'),
            Step.rewards({ type: 'n' }, 'enter'),
            Step.pubsub('enter'),
            Step.pubsubPlugins({ keypress: 'space' }, 'enter'),
            Step.pubsubPort('enter'),
            Step.storage({ type: storagePath }, 'enter'),
        ]).toMatchAnswers(
            'Generate',
            false,
            'polygon',
            false,
            true,
            'websocket',
            '7170',
            storagePath
        )

        const config = JSON.parse(readFileSync(storagePath).toString('utf-8'))

        expect(config).toMatchObject({
            client: {
                auth: {
                    privateKey: GeneratedPrivateKey,
                },
            },
        })

        const { websocket, ...otherPlugins } = config.plugins

        expect(websocket).toBeEmptyObject()

        expect(otherPlugins).toBeEmptyObject()

        expect('httpServer' in config).toBe(false)

        expect(config).not.toMatchObject({
            client: {
                contracts: expect.anything(),
                network: expect.anything(),
            },
        })

        const summary = logs.join('\n')

        expect(summary).toMatch(/congratulations/i)

        expect(summary).toInclude(
            `node address is 0x909DC59FF7A3b23126bc6F86ad44dD808fd424Dc\n`
        )

        expect(summary).toInclude(`generated name is Mountain Until Gun\n`)

        expect(summary).toInclude(`streamr-broker ${storagePath}\n`)
    })

    it('enables WebSocket plugin on a custom port', async () => {
        await expect([
            Step.privateKeySource('enter'),
            Step.revealPrivateKey('enter'),
            Step.network('enter'),
            Step.rewards({ type: 'n' }, 'enter'),
            Step.pubsub('enter'),
            Step.pubsubPlugins({ keypress: 'space' }, 'enter'),
            Step.pubsubPort({ type: '2000' }, 'enter'),
            Step.storage({ type: storagePath }, 'enter'),
        ]).toMatchAnswers(
            'Generate',
            false,
            'polygon',
            false,
            true,
            'websocket',
            '2000',
            storagePath
        )

        const config = JSON.parse(readFileSync(storagePath).toString('utf-8'))

        expect(config).toMatchObject({
            client: {
                auth: {
                    privateKey: GeneratedPrivateKey,
                },
            },
        })

        const { websocket, ...otherPlugins } = config.plugins

        expect(websocket.port).toEqual(2000)

        expect(otherPlugins).toBeEmptyObject()

        expect('httpServer' in config).toBe(false)

        expect(config).not.toMatchObject({
            client: {
                contracts: expect.anything(),
                network: expect.anything(),
            },
        })

        const summary = logs.join('\n')

        expect(summary).toMatch(/congratulations/i)

        expect(summary).toInclude(
            `node address is 0x909DC59FF7A3b23126bc6F86ad44dD808fd424Dc\n`
        )

        expect(summary).toInclude(`generated name is Mountain Until Gun\n`)

        expect(summary).toInclude(`streamr-broker ${storagePath}\n`)
    })

    it('enables MQTT plugin on the default port', async () => {
        await expect([
            Step.privateKeySource('enter'),
            Step.revealPrivateKey('enter'),
            Step.network('enter'),
            Step.rewards({ type: 'n' }, 'enter'),
            Step.pubsub('enter'),
            Step.pubsubPlugins(
                { keypress: 'down' },
                { keypress: 'space' },
                'enter'
            ),
            Step.pubsubPort('enter'),
            Step.storage({ type: storagePath }, 'enter'),
        ]).toMatchAnswers(
            'Generate',
            false,
            'polygon',
            false,
            true,
            'mqtt',
            '1883',
            storagePath
        )

        const config = JSON.parse(readFileSync(storagePath).toString('utf-8'))

        expect(config).toMatchObject({
            client: {
                auth: {
                    privateKey: GeneratedPrivateKey,
                },
            },
        })

        const { mqtt, ...otherPlugins } = config.plugins

        expect(mqtt).toBeEmptyObject()

        expect(otherPlugins).toBeEmptyObject()

        expect('httpServer' in config).toBe(false)

        expect(config).not.toMatchObject({
            client: {
                contracts: expect.anything(),
                network: expect.anything(),
            },
        })

        const summary = logs.join('\n')

        expect(summary).toMatch(/congratulations/i)

        expect(summary).toInclude(
            `node address is 0x909DC59FF7A3b23126bc6F86ad44dD808fd424Dc\n`
        )

        expect(summary).toInclude(`generated name is Mountain Until Gun\n`)

        expect(summary).toInclude(`streamr-broker ${storagePath}\n`)
    })

    it('enables MQTT plugin on a custom port', async () => {
        await expect([
            Step.privateKeySource('enter'),
            Step.revealPrivateKey('enter'),
            Step.network('enter'),
            Step.rewards({ type: 'n' }, 'enter'),
            Step.pubsub('enter'),
            Step.pubsubPlugins(
                { keypress: 'down' },
                { keypress: 'space' },
                'enter'
            ),
            Step.pubsubPort({ type: '3000' }, 'enter'),
            Step.storage({ type: storagePath }, 'enter'),
        ]).toMatchAnswers(
            'Generate',
            false,
            'polygon',
            false,
            true,
            'mqtt',
            '3000',
            storagePath
        )

        const config = JSON.parse(readFileSync(storagePath).toString('utf-8'))

        expect(config).toMatchObject({
            client: {
                auth: {
                    privateKey: GeneratedPrivateKey,
                },
            },
        })

        const { mqtt, ...otherPlugins } = config.plugins

        expect(mqtt.port).toEqual(3000)

        expect(otherPlugins).toBeEmptyObject()

        expect('httpServer' in config).toBe(false)

        expect(config).not.toMatchObject({
            client: {
                contracts: expect.anything(),
                network: expect.anything(),
            },
        })

        const summary = logs.join('\n')

        expect(summary).toMatch(/congratulations/i)

        expect(summary).toInclude(
            `node address is 0x909DC59FF7A3b23126bc6F86ad44dD808fd424Dc\n`
        )

        expect(summary).toInclude(`generated name is Mountain Until Gun\n`)

        expect(summary).toInclude(`streamr-broker ${storagePath}\n`)
    })

    it('enables HTTP plugin on the default port', async () => {
        await expect([
            Step.privateKeySource('enter'),
            Step.revealPrivateKey('enter'),
            Step.network('enter'),
            Step.rewards({ type: 'n' }, 'enter'),
            Step.pubsub('enter'),
            Step.pubsubPlugins(
                { keypress: 'down' },
                { keypress: 'down' },
                { keypress: 'space' },
                'enter'
            ),
            Step.pubsubPort('enter'),
            Step.storage({ type: storagePath }, 'enter'),
        ]).toMatchAnswers(
            'Generate',
            false,
            'polygon',
            false,
            true,
            'http',
            '7171',
            storagePath
        )

        const config = JSON.parse(readFileSync(storagePath).toString('utf-8'))

        expect(config).toMatchObject({
            client: {
                auth: {
                    privateKey: GeneratedPrivateKey,
                },
            },
        })

        const { http, ...otherPlugins } = config.plugins

        expect(http).toBeEmptyObject()

        expect(otherPlugins).toBeEmptyObject()

        expect('httpServer' in config).toBe(false)

        expect(config).not.toMatchObject({
            client: {
                contracts: expect.anything(),
                network: expect.anything(),
            },
        })

        const summary = logs.join('\n')

        expect(summary).toMatch(/congratulations/i)

        expect(summary).toInclude(
            `node address is 0x909DC59FF7A3b23126bc6F86ad44dD808fd424Dc\n`
        )

        expect(summary).toInclude(`generated name is Mountain Until Gun\n`)

        expect(summary).toInclude(`streamr-broker ${storagePath}\n`)
    })

    it('enables HTTP plugin on a custom port', async () => {
        await expect([
            Step.privateKeySource('enter'),
            Step.revealPrivateKey('enter'),
            Step.network('enter'),
            Step.rewards({ type: 'n' }, 'enter'),
            Step.pubsub('enter'),
            Step.pubsubPlugins(
                { keypress: 'down' },
                { keypress: 'down' },
                { keypress: 'space' },
                'enter'
            ),
            Step.pubsubPort({ type: '4000' }, 'enter'),
            Step.storage({ type: storagePath }, 'enter'),
        ]).toMatchAnswers(
            'Generate',
            false,
            'polygon',
            false,
            true,
            'http',
            '4000',
            storagePath
        )

        const config = JSON.parse(readFileSync(storagePath).toString('utf-8'))

        expect(config).toMatchObject({
            client: {
                auth: {
                    privateKey: GeneratedPrivateKey,
                },
            },
        })

        const { http, ...otherPlugins } = config.plugins

        expect(http).toBeEmptyObject()

        expect(otherPlugins).toBeEmptyObject()

        expect(config.httpServer.port).toEqual(4000)

        expect(config).not.toMatchObject({
            client: {
                contracts: expect.anything(),
                network: expect.anything(),
            },
        })

        const summary = logs.join('\n')

        expect(summary).toMatch(/congratulations/i)

        expect(summary).toInclude(
            `node address is 0x909DC59FF7A3b23126bc6F86ad44dD808fd424Dc\n`
        )

        expect(summary).toInclude(`generated name is Mountain Until Gun\n`)

        expect(summary).toInclude(`streamr-broker ${storagePath}\n`)
    })

    it('enables all pubsub plugins on default ports', async () => {
        await expect([
            Step.privateKeySource('enter'),
            Step.revealPrivateKey('enter'),
            Step.network('enter'),
            Step.rewards({ type: 'n' }, 'enter'),
            Step.pubsub('enter'),
            Step.pubsubPlugins(
                { keypress: 'space' },
                { keypress: 'down' },
                { keypress: 'space' },
                { keypress: 'down' },
                { keypress: 'space' },
                'enter'
            ),
            Step.pubsubPort('enter'),
            Step.pubsubPort('enter'),
            Step.pubsubPort('enter'),
            Step.storage({ type: storagePath }, 'enter'),
        ]).toMatchAnswers(
            'Generate',
            false,
            'polygon',
            false,
            true,
            'websocket,mqtt,http',
            '7170',
            '1883',
            '7171',
            storagePath
        )

        const config = JSON.parse(readFileSync(storagePath).toString('utf-8'))

        expect(config).toMatchObject({
            client: {
                auth: {
                    privateKey: GeneratedPrivateKey,
                },
            },
        })

        const { websocket, mqtt, http, ...otherPlugins } = config.plugins

        expect(websocket).toBeEmptyObject()

        expect(mqtt).toBeEmptyObject()

        expect(http).toBeEmptyObject()

        expect(otherPlugins).toBeEmptyObject()

        expect('httpServer' in config).toBe(false)

        expect(config).not.toMatchObject({
            client: {
                contracts: expect.anything(),
                network: expect.anything(),
            },
        })

        const summary = logs.join('\n')

        expect(summary).toMatch(/congratulations/i)

        expect(summary).toInclude(
            `node address is 0x909DC59FF7A3b23126bc6F86ad44dD808fd424Dc\n`
        )

        expect(summary).toInclude(`generated name is Mountain Until Gun\n`)

        expect(summary).toInclude(`streamr-broker ${storagePath}\n`)
    })

    it('enables all pubsub plugins on custom ports', async () => {
        await expect([
            Step.privateKeySource('enter'),
            Step.revealPrivateKey('enter'),
            Step.network('enter'),
            Step.rewards({ type: 'n' }, 'enter'),
            Step.pubsub('enter'),
            Step.pubsubPlugins(
                { keypress: 'space' },
                { keypress: 'down' },
                { keypress: 'space' },
                { keypress: 'down' },
                { keypress: 'space' },
                'enter'
            ),
            Step.pubsubPort({ type: '2000' }, 'enter'),
            Step.pubsubPort({ type: '3000' }, 'enter'),
            Step.pubsubPort({ type: '4000' }, 'enter'),
            Step.storage({ type: storagePath }, 'enter'),
        ]).toMatchAnswers(
            'Generate',
            false,
            'polygon',
            false,
            true,
            'websocket,mqtt,http',
            '2000',
            '3000',
            '4000',
            storagePath
        )

        const config = JSON.parse(readFileSync(storagePath).toString('utf-8'))

        expect(config).toMatchObject({
            client: {
                auth: {
                    privateKey: GeneratedPrivateKey,
                },
            },
        })

        const { websocket, mqtt, http, ...otherPlugins } = config.plugins

        expect(websocket.port).toEqual(2000)

        expect(mqtt.port).toEqual(3000)

        expect(http).toBeEmptyObject()

        expect(otherPlugins).toBeEmptyObject()

        expect(config.httpServer.port).toEqual(4000)

        expect(config).not.toMatchObject({
            client: {
                contracts: expect.anything(),
                network: expect.anything(),
            },
        })

        const summary = logs.join('\n')

        expect(summary).toMatch(/congratulations/i)

        expect(summary).toInclude(
            `node address is 0x909DC59FF7A3b23126bc6F86ad44dD808fd424Dc\n`
        )

        expect(summary).toInclude(`generated name is Mountain Until Gun\n`)

        expect(summary).toInclude(`streamr-broker ${storagePath}\n`)
    })

    it('validates port number values', async () => {
        await expect([
            Step.privateKeySource('enter'),
            Step.revealPrivateKey('enter'),
            Step.network('enter'),
            Step.rewards({ type: 'n' }, 'enter'),
            Step.pubsub('enter'),
            Step.pubsubPlugins({ keypress: 'space' }, 'enter'),
            Step.pubsubPort(
                { type: '12' },
                'enter',
                { find: /greater than or equal to 1024/i },
                { keypress: 'backspace' },
                { keypress: 'backspace' },
                { type: '128000' },
                'enter',
                { find: /less than or equal to 49151/i },
                'abort'
            ),
        ]).toMatchAnswers(
            'Generate',
            false,
            'polygon',
            false,
            true,
            'websocket'
        )

        expect(existsSync(storagePath)).toBe(false)
    })

    it('disallows duplicated ports', async () => {
        await expect([
            Step.privateKeySource('enter'),
            Step.revealPrivateKey('enter'),
            Step.network('enter'),
            Step.rewards({ type: 'n' }, 'enter'),
            Step.pubsub('enter'),
            Step.pubsubPlugins(
                { keypress: 'space' },
                { keypress: 'down' },
                { keypress: 'space' },
                { keypress: 'down' },
                'enter'
            ),
            Step.pubsubPort({ type: '2000' }, 'enter'),
            Step.pubsubPort(
                { type: '2000' },
                'enter',
                {
                    find: /port 2000 is taken by websocket/i,
                },
                { keypress: 'backspace' },
                { type: '1' },
                'enter'
            ),
            Step.storage({ type: storagePath }, 'enter'),
        ]).toMatchAnswers(
            'Generate',
            false,
            'polygon',
            false,
            true,
            'websocket,mqtt',
            '2000',
            '2001',
            storagePath
        )

        const config = JSON.parse(readFileSync(storagePath).toString('utf-8'))

        expect(config).toMatchObject({
            client: {
                auth: {
                    privateKey: GeneratedPrivateKey,
                },
            },
        })

        const { websocket, mqtt, ...otherPlugins } = config.plugins

        expect(websocket.port).toEqual(2000)

        expect(mqtt.port).toEqual(2001)

        expect(otherPlugins).toBeEmptyObject()

        expect('httpServer' in config).toBe(false)

        expect(config).not.toMatchObject({
            client: {
                contracts: expect.anything(),
                network: expect.anything(),
            },
        })

        const summary = logs.join('\n')

        expect(summary).toMatch(/congratulations/i)

        expect(summary).toInclude(
            `node address is 0x909DC59FF7A3b23126bc6F86ad44dD808fd424Dc\n`
        )

        expect(summary).toInclude(`generated name is Mountain Until Gun\n`)

        expect(summary).toInclude(`streamr-broker ${storagePath}\n`)
    })

    it('disallows taking default ports if they are inexplicitly used', async () => {
        await expect([
            Step.privateKeySource('enter'),
            Step.revealPrivateKey('enter'),
            Step.network('enter'),
            Step.rewards({ type: 'n' }, 'enter'),
            Step.pubsub('enter'),
            Step.pubsubPlugins(
                { keypress: 'space' },
                { keypress: 'down' },
                { keypress: 'space' },
                { keypress: 'down' },
                'enter'
            ),
            Step.pubsubPort('enter'),
            Step.pubsubPort(
                { type: '7170' },
                'enter',
                {
                    find: /port 7170 is taken by websocket/i,
                },
                { keypress: 'backspace' },
                { type: '9' },
                'enter'
            ),
            Step.storage({ type: storagePath }, 'enter'),
        ]).toMatchAnswers(
            'Generate',
            false,
            'polygon',
            false,
            true,
            'websocket,mqtt',
            '7170',
            '7179',
            storagePath
        )

        const config = JSON.parse(readFileSync(storagePath).toString('utf-8'))

        expect(config).toMatchObject({
            client: {
                auth: {
                    privateKey: GeneratedPrivateKey,
                },
            },
        })

        const { websocket, mqtt, ...otherPlugins } = config.plugins

        expect(websocket).toBeEmptyObject()

        expect(mqtt.port).toEqual(7179)

        expect(otherPlugins).toBeEmptyObject()

        expect('httpServer' in config).toBe(false)

        expect(config).not.toMatchObject({
            client: {
                contracts: expect.anything(),
                network: expect.anything(),
            },
        })

        const summary = logs.join('\n')

        expect(summary).toMatch(/congratulations/i)

        expect(summary).toInclude(
            `node address is 0x909DC59FF7A3b23126bc6F86ad44dD808fd424Dc\n`
        )

        expect(summary).toInclude(`generated name is Mountain Until Gun\n`)

        expect(summary).toInclude(`streamr-broker ${storagePath}\n`)
    })

    it('allows to uses a custom file path for the config file', async () => {
        storagePath = path.join(tempDir, 'CUSTOMDIR', 'foobar.json')

        expect(existsSync(storagePath)).toBe(false)

        await expect([
            Step.privateKeySource('enter'),
            Step.revealPrivateKey('enter'),
            Step.network('enter'),
            Step.rewards({ type: 'n' }, 'enter'),
            Step.pubsub({ type: 'n' }, 'enter'),
            Step.storage({ type: storagePath }, 'enter'),
        ]).toMatchAnswers(
            'Generate',
            false,
            'polygon',
            false,
            false,
            storagePath
        )

        expect(existsSync(storagePath)).toBe(true)

        const config = JSON.parse(readFileSync(storagePath).toString('utf-8'))

        expect(config).toMatchObject({
            client: {
                auth: {
                    privateKey: GeneratedPrivateKey,
                },
            },
        })
    })

    it('overwrites the existing config file if told to', async () => {
        writeFileSync(storagePath, '{"FOOBAR":true}')

        let config = JSON.parse(readFileSync(storagePath).toString('utf-8'))

        expect(config).toMatchObject({
            FOOBAR: true,
        })

        await expect([
            Step.privateKeySource('enter'),
            Step.revealPrivateKey('enter'),
            Step.network('enter'),
            Step.rewards({ type: 'n' }, 'enter'),
            Step.pubsub({ type: 'n' }, 'enter'),
            Step.storage({ type: storagePath }, 'enter'),
            Step.overwriteStorage({ type: 'y' }, 'enter'),
        ]).toMatchAnswers(
            'Generate',
            false,
            'polygon',
            false,
            false,
            storagePath,
            true
        )

        expect(existsSync(storagePath)).toBe(true)

        config = JSON.parse(readFileSync(storagePath).toString('utf-8'))

        expect(config).toMatchObject({
            client: {
                auth: {
                    privateKey: GeneratedPrivateKey,
                },
            },
        })
    })

    it('allows to change the storage location if the one they initially picked is taken', async () => {
        writeFileSync(storagePath, '{"FOOBAR":true}')

        let config = JSON.parse(readFileSync(storagePath).toString('utf-8'))

        expect(config).toMatchObject({
            FOOBAR: true,
        })

        const otherStoragePath = path.join(tempDir, 'foobar.json')

        expect(otherStoragePath).not.toEqual(storagePath)

        await expect([
            Step.privateKeySource('enter'),
            Step.revealPrivateKey('enter'),
            Step.network('enter'),
            Step.rewards({ type: 'n' }, 'enter'),
            Step.pubsub({ type: 'n' }, 'enter'),
            Step.storage({ type: storagePath }, 'enter'),
            Step.overwriteStorage('enter'),
            Step.storage({ type: otherStoragePath }, 'enter'),
        ]).toMatchAnswers(
            'Generate',
            false,
            'polygon',
            false,
            false,
            storagePath,
            false,
            otherStoragePath
        )

        config = JSON.parse(readFileSync(storagePath).toString('utf-8'))

        expect(config).toMatchObject({
            FOOBAR: true,
        })

        config = JSON.parse(readFileSync(otherStoragePath).toString('utf-8'))

        expect(config).toMatchObject({
            client: {
                auth: {
                    privateKey: GeneratedPrivateKey,
                },
            },
        })
    })

    it('creates a Mumbai environment config file', async () => {
        await expect([
            Step.privateKeySource('enter'),
            Step.revealPrivateKey('enter'),
            Step.network({ keypress: 'down' }, 'enter'),
            Step.rewards('enter'),
            Step.operator({ type: OperatorAddress }, 'enter'),
            Step.pubsub('enter'),
            Step.pubsubPlugins(
                { keypress: 'space' },
                { keypress: 'down' },
                { keypress: 'space' },
                { keypress: 'down' },
                { keypress: 'space' },
                'enter'
            ),
            Step.pubsubPort('enter'),
            Step.pubsubPort('enter'),
            Step.pubsubPort('enter'),
            Step.storage({ type: storagePath }, 'enter'),
        ]).toMatchAnswers(
            'Generate',
            false,
            'mumbai',
            true,
            OperatorAddress,
            true,
            'websocket,mqtt,http',
            '7170',
            '1883',
            '7171',
            storagePath
        )

        const config = JSON.parse(readFileSync(storagePath).toString('utf-8'))

        console.log(readFileSync(storagePath).toString('utf-8'))

        expect(config).toMatchObject({
            client: {
                auth: {
                    privateKey: GeneratedPrivateKey,
                },
            },
        })

        const { websocket, mqtt, http, operator, ...otherPlugins } =
            config.plugins

        expect(websocket).toBeEmptyObject()

        expect(mqtt).toBeEmptyObject()

        expect(http).toBeEmptyObject()

        expect(operator).toMatchObject({
            operatorContractAddress: OperatorAddress,
        })

        expect(otherPlugins).toBeEmptyObject()

        expect('httpServer' in config).toBe(false)

        expect(config.client.network.controlLayer.entryPoints[0]).toMatchObject({
            nodeId: expect.stringMatching(/\w/),
        })

        expect(config.client.contracts).toMatchObject({
            streamRegistryChainAddress:
                expect.stringMatching(/^0x[\da-f]{40}$/i),
            streamStorageRegistryChainAddress:
                expect.stringMatching(/^0x[\da-f]{40}$/i),
            storageNodeRegistryChainAddress:
                expect.stringMatching(/^0x[\da-f]{40}$/i),
            streamRegistryChainRPCs: expect.objectContaining({
                name: 'mumbai',
            }),
        })

        const summary = logs.join('\n')

        expect(summary).toMatch(/congratulations/i)

        expect(summary).toInclude(
            `node address is 0x909DC59FF7A3b23126bc6F86ad44dD808fd424Dc\n`
        )

        expect(summary).toInclude(`generated name is Mountain Until Gun\n`)

        expect(summary).toInclude(`streamr-broker ${storagePath}\n`)
    })
})

describe('getNodeMnemonic', () => {
    it('gives a mnemonic for a private key', () => {
        expect(
            getNodeMnemonic(
                '0x9a2f3b058b9b457f9f954e62ea9fd2cefe2978736ffb3ef2c1782ccfad9c411d'
            )
        ).toEqual('Mountain Until Gun')
    })
})

function act(
    ...actions: (
        | 'abort'
        | 'enter'
        | { type: string }
        | { keypress: string }
        | { find: RegExp | string }
    )[]
) {
    return async ({
        events,
        getScreen,
    }: Awaited<ReturnType<typeof render>>) => {
        for (const action of actions) {
            await (async () => {
                if (action === 'abort') {
                    throw 'abort'
                }

                if (action === 'enter') {
                    return void events.keypress('enter')
                }

                if ('find' in action) {
                    await Promise.resolve()

                    const screen = getScreen()

                    const { find } = action

                    const found =
                        find instanceof RegExp
                            ? find.test(screen)
                            : screen.includes(find)

                    if (!found) {
                        throw `Failed to find ${find} in\n${screen}`
                    }

                    return
                }

                if ('type' in action) {
                    return void events.type(action.type)
                }

                events.keypress(action.keypress)
            })()
        }
    }
}

const Step: Record<
    | 'privateKeySource'
    | 'revealPrivateKey'
    | 'providePrivateKey'
    | 'network'
    | 'rewards'
    | 'pubsub'
    | 'storage'
    | 'operator'
    | 'pubsubPlugins'
    | 'pubsubPort'
    | 'overwriteStorage',
    (...actions: Parameters<typeof act>) => AnswerMock
> = {
    privateKeySource: (...actions) => ({
        prompt: select,
        question: /want to generate/i,
        action: act(...actions),
    }),
    revealPrivateKey: (...actions) => ({
        prompt: confirm,
        question: /sensitive information on screen/i,
        action: act(...actions),
    }),
    providePrivateKey: (...actions) => ({
        prompt: password,
        question: /provide the private key/i,
        action: act(...actions),
    }),
    network: (...actions) => ({
        prompt: select,
        question: /which network/i,
        action: act(...actions),
    }),
    rewards: (...actions) => ({
        prompt: confirm,
        question: /participate in earning rewards/i,
        action: act(...actions),
    }),
    pubsub: (...actions) => ({
        prompt: confirm,
        question: /node for data publishing/i,
        action: act(...actions),
    }),
    storage: (...actions) => ({
        prompt: input,
        question: /path to store/i,
        action: act(...actions),
    }),
    operator: (...actions) => ({
        prompt: input,
        question: /operator address/i,
        action: act(...actions),
    }),
    pubsubPlugins: (...actions) => ({
        prompt: checkbox,
        question: /plugins to enable/i,
        action: act(...actions),
    }),
    pubsubPort: (...actions) => ({
        prompt: input,
        question: /provide a port/i,
        action: act(...actions),
    }),
    overwriteStorage: (...actions) => ({
        prompt: confirm,
        question: /do you want to overwrite/i,
        action: act(...actions),
    }),
}

declare global {
    namespace jest {
        interface Matchers<R> {
            toMatchAnswers(...answers: (string | boolean)[]): Promise<void>
        }
        interface ExpectExtendMap {
            toMatchAnswers: (
                this: jest.MatcherContext,
                actual: AnswerMock[],
                ...params: (string | boolean)[]
            ) => Promise<jest.CustomMatcherResult>
        }
    }
}

expect.extend({
    async toMatchAnswers(mocks, ...expectedAnswers) {
        let mocksCopy = [...mocks]

        const answers: (string | boolean)[] = []

        function getActualPrompt(promptMock: jest.MockedFunction<any>) {
            const inquirer = jest.requireActual('@inquirer/prompts')

            switch (promptMock) {
                case checkbox:
                    return inquirer.checkbox
                case confirm:
                    return inquirer.confirm
                case input:
                    return inquirer.input
                case password:
                    return inquirer.password
                case select:
                    return inquirer.select
                default:
                    throw 'Unknown prompt mock'
            }
        }

        void [checkbox, confirm, input, password, select].forEach((prompt) => {
            prompt.mockImplementation(async (config: any) => {
                const inq = mocksCopy.find(
                    (inq) =>
                        inq.prompt === prompt &&
                        inq.question.test(config.message)
                )

                if (!inq) {
                    throw `Missing mock for ${chalk.whiteBright(
                        `"${config.message}"`
                    )}`
                }

                mocksCopy = mocksCopy.filter((i) => i !== inq)

                const r = await render(getActualPrompt(prompt), config)

                await inq.action(r)

                const answer = await r.answer

                answers.push(Array.isArray(answer) ? answer.join() : answer)

                return answer
            })
        })

        try {
            await start()
        } catch (e) {
            if (
                typeof e === 'string' &&
                (/missing mock/i.test(e) || /failed to find/i.test(e))
            ) {
                return {
                    message: () => e,
                    pass: false,
                }
            }

            if (e !== 'abort') {
                throw e
            }
        }

        return {
            message: () =>
                `Expected answers: ${expectedAnswers.join(
                    ', '
                )}\nReceived answers: ${answers
                    .map((a, i) =>
                        a === expectedAnswers[i] ? a : chalk.redBright(a)
                    )
                    .join(', ')}.`,
            pass: JSON.stringify(expectedAnswers) === JSON.stringify(answers),
        }
    },
})
