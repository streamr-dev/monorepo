import http from 'http'
import { startTracker, Tracker } from 'streamr-network'
import { Broker } from '../../../broker'
import { startBroker, createClient, createTestStream } from '../../../utils'

const trackerPort = 12420
const httpPort = 12422

describe('broker resistance to invalid data', () => {
    let tracker: Tracker
    let broker: Broker
    let streamId: string
    let sessionToken: string

    beforeEach(async () => {
        tracker = await startTracker({
            listen: {
                hostname: '127.0.0.1',
                port: trackerPort
            },
            id: 'tracker'
        })
        broker = await startBroker({
            name: 'broker',
            privateKey: '0xbc19ba842352248cb9132cc212f35d2f947dd66a0fda1e19021f9231e069c12d',
            trackerPort,
            httpPort
        })

        // Create new stream
        const client = createClient(0)
        const freshStream = await createTestStream(client, module)
        streamId = freshStream.id
        await client.ensureDisconnected()
        sessionToken = await client.session.getSessionToken()
    })

    afterEach(async () => {
        await broker.stop()
        await tracker.stop()
    })

    test('pushing invalid data to legacy HTTP plugin returns 400 error & does not crash broker', (done) => {
        const invalidData = '###!!THIS-DATA-IS-NOT-JSON!!###'

        const request = http.request({
            hostname: '127.0.0.1',
            port: httpPort,
            path: `/api/v1/streams/${encodeURIComponent(streamId)}/data`,
            method: 'POST',
            headers: {
                Authorization: 'Bearer ' + sessionToken,
                'Content-Type': 'application/json',
                'Content-Length': invalidData.length
            }
        }, (res) => {
            let data = ''

            res.on('data', (chunk) => {
                data += chunk
            })

            res.on('end', () => {
                expect(res.statusCode).toEqual(400)
                const asObject = JSON.parse(data)
                expect(Object.keys(asObject)).toEqual(['error'])
                done()
            })
        })

        request.on('error', (err) => {
            if (err) {
                done(err)
            } else {
                done(new Error('error cb'))
            }
        })

        request.write(invalidData)
        request.end()
    })
})
