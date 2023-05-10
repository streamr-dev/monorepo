import omit from 'lodash/omit'
import merge from 'lodash/merge'
import { StreamrClientConfig, StreamrClient, CONFIG_TEST } from 'streamr-client'
import { Options } from './command'
import { getConfig } from './config'

export const getClientConfig = (commandOptions: Options, overridenOptions: StreamrClientConfig = {}): StreamrClientConfig => {
    const environmentOptions = commandOptions.dev ? omit(CONFIG_TEST, 'auth') : undefined
    const configFileJson = getConfig(commandOptions.config)?.client
    const authenticationOptions = (commandOptions.privateKey !== undefined) ? { auth: { privateKey: commandOptions.privateKey } } : undefined
    return merge(
        environmentOptions,
        configFileJson,
        authenticationOptions,
        overridenOptions
    )
}

const addInterruptHandler = (client: StreamrClient) => {
    process.on('SIGINT', async () => {
        try {
            await client.destroy()
        } catch {
            // no-op
        }
        process.exit()
    })
}

export const createClient = (commandOptions: Options, overridenOptions: StreamrClientConfig = {}): StreamrClient => {
    const config = getClientConfig(commandOptions, overridenOptions)
    const client = new StreamrClient(config)
    addInterruptHandler(client)
    return client
}
