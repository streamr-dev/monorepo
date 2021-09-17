import { startTracker, createNetworkNode, MetricsContext, NetworkNode, Tracker } from 'streamr-network'
import { waitForCondition } from 'streamr-test-utils'
import http from 'http'
import StreamrClient from 'streamr-client'
import { StreamFetcher } from '../../../../src/StreamFetcher'
import { WebsocketServer } from '../../../../src/plugins/legacyWebsocket/WebsocketServer'
import { Publisher } from '../../../../src/Publisher'
import { SubscriptionManager } from '../../../../src/SubscriptionManager'
import { createClient } from '../../../utils'

const trackerPort = 17370
const wsPort = 17351

describe('ping-pong test between broker and clients', () => {
    let tracker: Tracker
    let websocketServer: WebsocketServer
    let networkNode: NetworkNode
    let metricsContext: MetricsContext
    let client1: StreamrClient
    let client2: StreamrClient
    let client3: StreamrClient

    beforeEach(async () => {
        tracker = await startTracker({
            listenConfig: {
                hostname: '127.0.0.1',
                port: trackerPort
            },
            id: 'tracker'
        })
    })

    beforeEach(async () => {
        const trackerInfo = { id: 'tracker', ws: tracker.getUrl(), http: '' }
        networkNode = createNetworkNode({
            id: 'networkNode',
            trackers: [trackerInfo]
        })
        networkNode.start()
        metricsContext = new MetricsContext(null as any)
        websocketServer = new WebsocketServer(
            http.createServer().listen(wsPort),
            networkNode,
            new StreamFetcher('http://127.0.0.1'),
            new Publisher(networkNode, {}, metricsContext),
            metricsContext,
            new SubscriptionManager(networkNode),
            undefined as any,
            undefined as any
        )
    })

    beforeEach(async () => {
        client1 = createClient(wsPort)
        client2 = createClient(wsPort)
        client3 = createClient(wsPort)

        await Promise.all([
            client1.connect(),
            client2.connect(),
            client3.connect()
        ])
    })

    beforeEach(async () => {
        // @ts-expect-error accessing private
        await waitForCondition(() => websocketServer.connections.size === 3)
    })

    afterEach(async () => {
        await Promise.all([
            client1.ensureDisconnected(),
            client2.ensureDisconnected(),
            client3.ensureDisconnected()
        ])

        await tracker.stop()
        await networkNode.stop()
        await websocketServer.close()
    })

    it('websocketServer sends pings and receives pongs from clients', async () => {
        let pings = 0

        // @ts-expect-error accessing private
        const connections = [...websocketServer.connections.values()]
        connections.forEach((connection) => {
            expect(connection.isDead()).toEqual(false)
        })

        // @ts-expect-error
        client1.connection.socket.on('ping', () => {
            pings += 1
        })

        // @ts-expect-error
        client2.connection.socket.on('ping', () => {
            pings += 1
        })

        // @ts-expect-error
        client3.connection.socket.on('ping', () => {
            pings += 1
        })

        // @ts-expect-error accessing private method
        websocketServer.pingConnections()
        await waitForCondition(() => pings === 3)

        expect(pings).toEqual(3)
        // @ts-expect-error accessing private
        expect(websocketServer.connections.size).toEqual(3)
        await waitForCondition(() => connections.every((connection) => connection.hasRespondedToPong()))
        connections.forEach((connection) => {
            expect(connection.hasRespondedToPong()).toEqual(true)
        })
    })

    it('websocketServer closes connections, which are not replying with pong', (done) => {
        let pings = 0

        // @ts-expect-error
        client1.connection.socket.pong = jest.fn() // don't send back pong

        // @ts-expect-error
        client2.connection.socket.on('ping', () => {
            pings += 1
        })

        // @ts-expect-error
        client3.connection.socket.on('ping', () => {
            pings += 1
        })

        // @ts-expect-error accessing private method
        websocketServer.pingConnections()
        waitForCondition(() => pings === 2).then(async () => {
            // @ts-expect-error accessing private
            const connections = [...websocketServer.connections.values()]
            expect(connections.length).toEqual(3)
            await waitForCondition(() => {
                const respondedPongCount = connections.filter((connection) => connection.hasRespondedToPong()).length
                // @ts-expect-error client1.connection hack
                return ((client1.connection.socket.pong.mock.calls.length === 1) && (respondedPongCount === 2))
            })
            connections.forEach((connection, index) => {
                // first client
                if (index === 0) {
                    expect(connection.hasRespondedToPong()).toEqual(false)
                } else {
                    expect(connection.hasRespondedToPong()).toEqual(true)
                }
            })

            client1.on('disconnected', () => {
                // TODO replace with () => done, after fixing stopping of JS client
                client1.on('connected', done)
            })

            // @ts-expect-error accessing private method
            websocketServer.pingConnections()
        }).catch((err) => {
            done(err)
        })
    })
})
