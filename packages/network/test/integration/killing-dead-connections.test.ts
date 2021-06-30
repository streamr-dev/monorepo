/* eslint-disable no-underscore-dangle */
import { waitForEvent } from 'streamr-test-utils'

import { Event, DisconnectionReason } from '../../src/connection/IWsEndpoint'
import { startServerWsEndpoint, ServerWsEndpoint } from '../../src/connection/ServerWsEndpoint'
import { PeerInfo } from '../../src/connection/PeerInfo'
import { ClientWsEndpoint, startClientWsEndpoint } from '../../src/connection/ClientWsEndpoint'

const STATE_OPEN = 1

describe('check and kill dead connections', () => {
    let clientEndpoint: ClientWsEndpoint
    let serverEndpoint: ServerWsEndpoint

    beforeEach(async () => {
        clientEndpoint = await startClientWsEndpoint(PeerInfo.newNode('clientEndpoint'), null)
        serverEndpoint = await startServerWsEndpoint('127.0.0.1', 43972, PeerInfo.newTracker('serverEndpoint'), null)
        await clientEndpoint.connect('ws://127.0.0.1:43972')
    })

    afterEach(async () => {
        Promise.allSettled([
            clientEndpoint.stop(),
            serverEndpoint.stop()
        ])
    })

    it('if we find dead connection, we force close it', async () => {
        expect(clientEndpoint.getPeers().size).toBe(1)

        // get alive connection
        const connection = clientEndpoint.getPeers().get('serverEndpoint')
        expect(connection!.getReadyState()).toEqual(STATE_OPEN)

        // check connections
        jest.spyOn(connection!, 'ping').mockImplementation(() => {
            throw new Error('mock error message')
        })

        const event = waitForEvent(clientEndpoint, Event.PEER_DISCONNECTED)
        // @ts-expect-error private method
        clientEndpoint.pingPongWs.pingConnections()
        const [peerInfo, reason] = await event

        expect(peerInfo).toEqual(PeerInfo.newTracker('serverEndpoint'))
        expect(reason).toEqual('')
    })
})
