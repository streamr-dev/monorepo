import 'reflect-metadata'
import './utils/PatchTsyringe'
import { DependencyContainer } from 'tsyringe'
import { uuid } from './utils/uuid'
import { counterId } from './utils/utils'
import { Debug } from './utils/log'
import { Context } from './utils/Context'
import { ConfigInjectionToken, StrictStreamrClientConfig } from './Config'
import { AuthenticationInjectionToken, createAuthentication } from './Authentication'

/**
 * DI Token for injecting the Client container.
 * Use sparingly, but can be necessary for factories
 * or to work around circular dependencies.
 */
export const BrubeckContainer = Symbol('BrubeckContainer')

let uid: string = process.pid != null
    // Use process id in node uid.
    ? `${process.pid}`
    // Fall back to `uuid()` later (see initContainer). Doing it here will break browser projects
    // that utilize server-side rendering (no `window` while build's target is `web`).
    : ''

export function initContainer(
    config: StrictStreamrClientConfig, 
    c: DependencyContainer
): Context {
    uid = uid || `${uuid().slice(-4)}${uuid().slice(0, 4)}`
    const id = config.id ?? counterId(`client-${uid}`)
    const debug = Debug(id)
    debug('create')

    const rootContext = {
        id,
        debug
    }

    c.register(Context as any, {
        useValue: rootContext
    })

    c.register(BrubeckContainer, {
        useValue: c
    })

    c.register(AuthenticationInjectionToken, {
        useValue: createAuthentication(config.auth, config)
    })

    // associate values to config tokens
    const configTokens: [symbol, object][] = [
        [ConfigInjectionToken.Root, config],
        [ConfigInjectionToken.Auth, config.auth],
        [ConfigInjectionToken.Ethereum, config],
        [ConfigInjectionToken.Network, config.network],
        [ConfigInjectionToken.Connection, config],
        [ConfigInjectionToken.Subscribe, config],
        [ConfigInjectionToken.Publish, config],
        [ConfigInjectionToken.Decryption, config.decryption],
        [ConfigInjectionToken.Cache, config.cache],
        // eslint-disable-next-line no-underscore-dangle
        [ConfigInjectionToken.Timeouts, config._timeouts],
    ]

    configTokens.forEach(([token, useValue]) => {
        c.register(token, { useValue })
    })

    return rootContext
}
