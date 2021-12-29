import { Tracker } from '../../src/logic/tracker/Tracker'
import { NetworkNode } from '../../src/logic/node/NetworkNode'
import http from 'http'

import { waitForCondition } from 'streamr-test-utils'

import { createNetworkNode, startTracker } from '../../src/composition'
import { SPID } from 'streamr-client-protocol'

function getHttp(url: string) {
    return new Promise((resolve, reject) => {
        http.get(url, (resp) => {
            let data = ''
            resp
                .on('data', (chunk) => {
                    data += chunk
                })
                .on('end', () => {
                    let content
                    try {
                        content = JSON.parse(data)
                    } catch (e) {
                        content = data
                    }
                    resolve([resp.statusCode, content])
                })
                .on('error', (err) => {
                    reject(err)
                })
        })
    })
}

const trackerPort = 31750

describe('tracker endpoint', () => {
    let tracker: Tracker
    let nodeOne: NetworkNode
    let nodeTwo: NetworkNode

    beforeAll(async () => {
        tracker = await startTracker({
            listen: {
                hostname: '127.0.0.1',
                port: trackerPort
            },
            attachHttpEndpoints: true
        })
        const trackerInfo = tracker.getConfigRecord()
        nodeOne = createNetworkNode({
            id: 'node-1',
            trackers: [trackerInfo],
            location: {
                country: 'CH',
                city: 'Zug'
            }
        })
        nodeTwo = createNetworkNode({
            id: 'node-2',
            trackers: [trackerInfo],
            location: {
                country: 'FI',
                city: 'Helsinki'
            }
        })
        nodeTwo.setExtraMetadata({
            foo: 'bar'
        })

        nodeOne.subscribe(new SPID('stream-1', 0))
        nodeTwo.subscribe(new SPID('stream-1', 0))

        nodeOne.subscribe(new SPID('stream-2', 0))
        nodeOne.subscribe(new SPID('sandbox/test/stream-3', 0))

        nodeOne.start()
        nodeTwo.start()

        // @ts-expect-error private variable
        await waitForCondition(() => Object.keys(tracker.overlayPerStream).length === 3)
    })

    afterAll(async () => {
        await Promise.allSettled([
            tracker.stop(),
            nodeOne.stop(),
            nodeTwo.stop()
        ])
    })

    it('/topology/', async () => {
        const [status, jsonResult]: any = await getHttp(`http://127.0.0.1:${trackerPort}/topology/`)
        expect(status).toEqual(200)
        expect(jsonResult['stream-1#0']).not.toBeUndefined()
        expect(jsonResult['stream-2#0']).not.toBeUndefined()
        expect(jsonResult['sandbox/test/stream-3#0']).not.toBeUndefined()
    })

    it('/topology/stream-1/', async () => {
        const [status, jsonResult]: any = await getHttp(`http://127.0.0.1:${trackerPort}/topology/stream-1/`)
        expect(status).toEqual(200)
        expect(jsonResult['stream-1#0']).not.toBeUndefined()
        expect(jsonResult['stream-2#0']).toBeUndefined()
        expect(jsonResult['sandbox/test/stream-3#0']).toBeUndefined()
    })

    it('/topology/sandbox%2test%2stream-3/', async () => {
        const [status, jsonResult]: any = await getHttp(`http://127.0.0.1:${trackerPort}/topology/sandbox%2Ftest%2Fstream-3/`)
        expect(status).toEqual(200)
        expect(jsonResult['stream-1#0']).toBeUndefined()
        expect(jsonResult['stream-2#0']).toBeUndefined()
        expect(jsonResult['sandbox/test/stream-3#0']).not.toBeUndefined()
    })

    it('/topology/non-existing-stream/', async () => {
        const [status, jsonResult]: any = await getHttp(`http://127.0.0.1:${trackerPort}/topology/non-existing-stream/`)
        expect(status).toEqual(200)
        expect(jsonResult).toEqual({})
    })

    it('/topology/%20/', async () => {
        const [status, jsonResult]: any = await getHttp(`http://127.0.0.1:${trackerPort}/topology/%20/`)
        expect(status).toEqual(422)
        expect(jsonResult).toEqual({
            errorMessage: 'streamId cannot be empty'
        })
    })

    it('/topology/stream-1/0/', async () => {
        const [status, jsonResult]: any = await getHttp(`http://127.0.0.1:${trackerPort}/topology/stream-1/0/`)
        expect(status).toEqual(200)
        expect(jsonResult['stream-1#0']).not.toBeUndefined()
        expect(jsonResult['stream-2#0']).toBeUndefined()
        expect(jsonResult['sandbox/test/stream-3#0']).toBeUndefined()
    })

    it('/topology/sandbox%2test%2stream-3/0/', async () => {
        const [status, jsonResult]: any = await getHttp(`http://127.0.0.1:${trackerPort}/topology/sandbox%2Ftest%2Fstream-3/0/`)
        expect(status).toEqual(200)
        expect(jsonResult['stream-1#0']).toBeUndefined()
        expect(jsonResult['stream-2#0']).toBeUndefined()
        expect(jsonResult['sandbox/test/stream-3#0']).not.toBeUndefined()
    })

    it('/topology/non-existing-stream/0/', async () => {
        const [status, jsonResult]: any = await getHttp(`http://127.0.0.1:${trackerPort}/topology/non-existing-stream/0/`)
        expect(status).toEqual(200)
        expect(jsonResult).toEqual({})
    })

    it('/topology/%20/1/', async () => {
        const [status, jsonResult]: any = await getHttp(`http://127.0.0.1:${trackerPort}/topology/%20/1/`)
        expect(status).toEqual(422)
        expect(jsonResult).toEqual({
            errorMessage: 'streamId cannot be empty'
        })
    })

    it('/topology/stream-1/-666/', async () => {
        const [status, jsonResult]: any = await getHttp(`http://127.0.0.1:${trackerPort}/topology/stream-1/-666/`)
        expect(status).toEqual(422)
        expect(jsonResult).toEqual({
            errorMessage: 'partition must be a positive integer (was -666)'
        })
    })

    it('/topology-size/', async () => {
        const [status, jsonResult]: any = await getHttp(`http://127.0.0.1:${trackerPort}/topology-size/`)
        expect(status).toEqual(200)
        expect(jsonResult).toEqual(
            expect.arrayContaining([{
                streamId: 'stream-1',
                partition: 0,
                nodeCount: 2
            }, {
                streamId: 'stream-2',
                partition: 0,
                nodeCount: 1
            }, {
                streamId: 'sandbox/test/stream-3',
                partition: 0,
                nodeCount: 1
            }])
        )
    })
    it('/topology-size/stream-1/', async () => {
        const [status, jsonResult]: any = await getHttp(`http://127.0.0.1:${trackerPort}/topology-size/stream-1/`)
        expect(status).toEqual(200)
        expect(jsonResult).toEqual(
            expect.arrayContaining([{
                streamId: 'stream-1',
                partition: 0,
                nodeCount: 2
            }])
        )
    })

    it('/topology-size/stream-1/0', async () => {
        const [status, jsonResult]: any = await getHttp(`http://127.0.0.1:${trackerPort}/topology-size/stream-1/0/`)
        expect(status).toEqual(200)
        expect(jsonResult).toEqual(
            expect.arrayContaining([{
                streamId: 'stream-1',
                partition: 0,
                nodeCount: 2
            }])
        )
    })

    it('/topology-size/stream-1/-1', async () => {
        const [status, jsonResult]: any = await getHttp(`http://127.0.0.1:${trackerPort}/topology-size/stream-1/-1/`)
        expect(status).toEqual(422)
        expect(jsonResult).toEqual({
            errorMessage: 'partition must be a positive integer (was -1)'
        })
    })

    it('/topology-size/%20/1/', async () => {
        const [status, jsonResult]: any = await getHttp(`http://127.0.0.1:${trackerPort}/topology-size/%20/1/`)
        expect(status).toEqual(422)
        expect(jsonResult).toEqual({
            errorMessage: 'streamId cannot be empty'
        })
    })

    it('/topology-size/non-existing-stream/0/', async () => {
        const [status, jsonResult]: any = await getHttp(`http://127.0.0.1:${trackerPort}/topology-size/non-existing-stream/0/`)
        expect(status).toEqual(200)
        expect(jsonResult).toEqual([])
    })

    it('/node-connections/', async () => {
        const [status, jsonResult]: any = await getHttp(`http://127.0.0.1:${trackerPort}/node-connections/`)
        expect(status).toEqual(200)
        expect(jsonResult).toEqual({
            'node-1': [{neighborId: 'node-2', rtt: null}],
            'node-2': [{neighborId: 'node-1', rtt: null}]
        })
    })

    it('/nodes/node-1/streams', async () => {
        const [status, jsonResult]: any = await getHttp(`http://127.0.0.1:${trackerPort}/nodes/node-1/streams/`)
        expect(status).toEqual(200)
        expect(jsonResult).toIncludeSameMembers([
            {
                "partition": 0,
                "streamId": "sandbox/test/stream-3",
                "topologySize": 1
            },
            {
                "partition": 0,
                "streamId": "stream-1",
                "topologySize": 2
            },
            {
                "partition": 0,
                "streamId": "stream-2",
                "topologySize": 1
            },
        ])
    })

    it('/nodes/node-2/streams', async () => {
        const [status, jsonResult]: any = await getHttp(`http://127.0.0.1:${trackerPort}/nodes/node-2/streams/`)
        expect(status).toEqual(200)
        expect(jsonResult).toEqual([
            {
                "partition": 0,
                "streamId": "stream-1",
                "topologySize": 2
            }
        ])
    })

    it('/nodes/non-existing-node/streams', async () => {
        const [status, jsonResult]: any = await getHttp(`http://127.0.0.1:${trackerPort}/nodes/non-existing-node/streams/`)
        expect(status).toEqual(200)
        expect(jsonResult).toEqual([])
    })

    it('/location/', async () => {
        const [status, jsonResult]: any = await getHttp(`http://127.0.0.1:${trackerPort}/location/`)
        expect(status).toEqual(200)
        expect(jsonResult).toEqual({
            'node-1': {
                country: 'CH',
                city: 'Zug'
            },
            'node-2': {
                country: 'FI',
                city: 'Helsinki'
            }
        })
    })

    it('/location/node-1/', async () => {
        const [status, jsonResult]: any = await getHttp(`http://127.0.0.1:${trackerPort}/location/node-1/`)
        expect(status).toEqual(200)
        expect(jsonResult).toEqual({
            country: 'CH',
            city: 'Zug'
        })
    })

    it('/location/non-existing-node/', async () => {
        const [status, jsonResult]: any = await getHttp(`http://127.0.0.1:${trackerPort}/location/non-existing-node/`)
        expect(status).toEqual(200)
        expect(jsonResult).toEqual({})
    })

    it('/metrics/', async () => {
        const [status, jsonResult]: any = await getHttp(`http://127.0.0.1:${trackerPort}/metrics/`)
        expect(status).toEqual(200)
        expect(jsonResult.peerId).toEqual(tracker.getTrackerId())
        expect(jsonResult.startTime).toBeGreaterThan(1600000000000)
        expect(jsonResult.metrics).not.toBeUndefined()
    })

    it('/metadata/', async () => {
        const [status, jsonResult]: any = await getHttp(`http://127.0.0.1:${trackerPort}/metadata/`)
        expect(status).toEqual(200)
        expect(jsonResult).toEqual({
            'node-1': {},
            'node-2': {
                foo: 'bar'
            }
        })
    })
})
