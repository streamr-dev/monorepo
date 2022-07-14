import { Tracker, startTracker } from '@streamr/network-tracker'
import WebSocket from 'ws'
import { waitForCondition, runAndWaitForEvents } from 'streamr-test-utils'
import { waitForEvent } from '@streamr/utils'

import { ServerWsEndpoint } from '../../src/connection/ws/ServerWsEndpoint'
import { PeerInfo } from '../../src/connection/PeerInfo'
import BrowserClientWsEndpoint from '../../src/connection/ws/BrowserClientWsEndpoint'
import { DisconnectionCode, Event } from '../../src/connection/ws/AbstractWsEndpoint'
import { startServerWsEndpoint } from '../utils'

const trackerPort = 38482

describe('ws-endpoint', () => {
    const endpoints: ServerWsEndpoint[] = []

    it('create five endpoints and init connection between them, should be able to start and stop successfully', async () => {
        for (let i = 0; i < 5; i++) {
            // eslint-disable-next-line no-await-in-loop
            const endpoint = await startServerWsEndpoint('127.0.0.1', 30740 + i, PeerInfo.newNode(`endpoint-${i}`))
                .catch((err) => {
                    throw err
                })
            endpoints.push(endpoint)
        }

        for (let i = 0; i < 5; i++) {
            expect(endpoints[i].getPeers().size).toBe(0)
        }
        const clients = []
        for (let i = 0; i < 5; i++) {
            const client = new BrowserClientWsEndpoint(PeerInfo.newNode(`client-${i}`))

            // eslint-disable-next-line no-await-in-loop
            await runAndWaitForEvents([
                () => {
                    client.connect(endpoints[i].getUrl(), PeerInfo.newTracker(`endpoint-${i}`))
                }], [
                [client, Event.PEER_CONNECTED]
            ])
            clients.push(client)
        }
        for (let i = 0; i < 5; i++) {
            await waitForCondition(() => endpoints[i].getPeers().size === 1)
        }

        for (let i = 0; i < 5; i++) {
            // eslint-disable-next-line no-await-in-loop
            await endpoints[i].stop()
            await clients[i].stop()
        }
    })

    it('server and client form correct peerInfo on connection', async () => {
        const client = new BrowserClientWsEndpoint(PeerInfo.newNode('client'))
        const server = await startServerWsEndpoint('127.0.0.1', 30696, PeerInfo.newNode('server'))

        const e1 = waitForEvent(client, Event.PEER_CONNECTED)
        const e2 = waitForEvent(server, Event.PEER_CONNECTED)

        await client.connect(server.getUrl(), PeerInfo.newTracker('server'))

        const clientArguments = await e1
        const serverArguments = await e2

        expect(clientArguments).toEqual([PeerInfo.newTracker('server')])
        expect(serverArguments).toEqual([PeerInfo.newNode('client')])

        await client.stop()
        await server.stop()
    })

    describe('test direct connections from simple websocket', () => {
        let tracker: Tracker

        beforeEach(async () => {
            tracker = await startTracker({
                listen: {
                    hostname: '127.0.0.1',
                    port: trackerPort
                }
            })
            // @ts-expect-error TODO: do this proper way (pass via constructor)
            tracker.trackerServer.endpoint.handshakeTimer = 3000
        })

        afterEach(async () => {
            await tracker.stop()
        })

        it('tracker checks that peerId is given by incoming connections', async () => {
            const ws = new WebSocket(`ws://127.0.0.1:${trackerPort}/ws`)
            const close = await waitForEvent(ws, 'close')
            expect(close[0]).toEqual(DisconnectionCode.FAILED_HANDSHAKE)
            expect(close[1]).toContain('Handshake not received from connection behind UUID')
        })
    })

    describe('Duplicate connections from same nodeId are closed', () => {
        it('Duplicate connection is closed', async () => {
            const client1 = new BrowserClientWsEndpoint(PeerInfo.newNode('client'))
            const client2 = new BrowserClientWsEndpoint(PeerInfo.newNode('client'))

            const server = await startServerWsEndpoint('127.0.0.1', trackerPort, PeerInfo.newNode('server'))

            await client1.connect(server.getUrl(), PeerInfo.newTracker('server'))
            await client2.connect(server.getUrl(), PeerInfo.newTracker('server'))
            await waitForEvent(client2, Event.PEER_DISCONNECTED)

            await client1.stop()
            await client2.stop()
            await server.stop()
        })
    })
})
