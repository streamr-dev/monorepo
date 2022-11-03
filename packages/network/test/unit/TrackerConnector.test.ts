import { wait } from '@streamr/utils'
import { TrackerRegistryRecord, StreamPartID, StreamPartIDUtils, TrackerRegistry } from 'streamr-client-protocol'
import { TrackerConnector } from '../../src/logic/TrackerConnector'
import { TrackerId } from '../../../network-tracker/src/logic/Tracker'

const TTL_IN_MS = 10

const TRACKERS = [
    {
        id: 't1',
        http: 'http://t1.xyz',
        ws: 'ws://t1.xyz'
    },
    {
        id: 't2',
        http: 'http://t2.xyz',
        ws: 'ws://t2.xyz'
    },
    {
        id: 't3',
        http: 'http://t3.xyz',
        ws: 'ws://t3.xyz'
    },
    {
        id: 't4',
        http: 'http://t4.xyz',
        ws: 'ws://t4.xyz'
    },
]

const T1_STREAM = StreamPartIDUtils.parse('streamOne#2')
const T2_STREAM = StreamPartIDUtils.parse('streamOne#15')
const T3_STREAM = StreamPartIDUtils.parse('streamSix#3')
const T4_STREAM = StreamPartIDUtils.parse('streamTwo#7')

describe(TrackerConnector, () => {
    let streams: Array<StreamPartID>
    let activeConnections: Set<TrackerId>
    let connector: TrackerConnector

    beforeAll(() => {
        // sanity check stream hash assignments
        const trackerRegistry = new TrackerRegistry<TrackerRegistryRecord>(TRACKERS)
        function checkTrackerAssignment(streamPartId: StreamPartID, expectedTracker: TrackerRegistryRecord): void {
            expect(trackerRegistry.getTracker(streamPartId)).toEqual(expectedTracker)
        }
        checkTrackerAssignment(T1_STREAM, TRACKERS[0])
        checkTrackerAssignment(T2_STREAM, TRACKERS[1])
        checkTrackerAssignment(T3_STREAM, TRACKERS[2])
        checkTrackerAssignment(T4_STREAM, TRACKERS[3])
    })

    function setUpConnector(intervalInMs: number) {
        streams = []
        activeConnections = new Set<TrackerId>()
        connector = new TrackerConnector(
            () => streams,
            (_wsUrl, trackerInfo) => {
                activeConnections.add(trackerInfo.peerId)
                return Promise.resolve()
            },
            (trackerId) => {
                activeConnections.delete(trackerId)
            },
            new TrackerRegistry<TrackerRegistryRecord>(TRACKERS),
            intervalInMs
        )
    }

    afterEach(() => {
        connector?.stop()
    })

    it('maintains no tracker connections if no streams', async () => {
        setUpConnector(TTL_IN_MS)
        connector.start()
        await wait(TTL_IN_MS * 2)
        expect(activeConnections).toBeEmpty()
    })

    it('maintains tracker connections based on active streams', async () => {
        setUpConnector(TTL_IN_MS)
        connector.start()

        streams = []
        await wait(TTL_IN_MS + 1)
        expect(activeConnections).toBeEmpty()

        streams = [T1_STREAM]
        await wait(TTL_IN_MS + 1)
        expect(activeConnections).toEqual(new Set<string>(['t1']))

        streams = []
        await wait(TTL_IN_MS + 1)
        expect(activeConnections).toBeEmpty()

        streams = [T2_STREAM, T3_STREAM]
        await wait(TTL_IN_MS + 1)
        expect(activeConnections).toEqual(new Set<string>(['t2', 't3']))

        streams = [
            T4_STREAM,
            T3_STREAM,
            T2_STREAM
        ]
        await wait(TTL_IN_MS + 1)
        expect(activeConnections).toEqual(new Set<string>(['t2', 't3', 't4']))

        streams = []
        await wait(TTL_IN_MS + 1)
        expect(activeConnections).toBeEmpty()
    })

    it('onNewStream can be used to form immediate connections', () => {
        setUpConnector(1000000000)
        connector.start()

        connector.onNewStreamPart(T2_STREAM)
        expect(activeConnections).toEqual(new Set<string>(['t2']))

        connector.onNewStreamPart(T4_STREAM)
        expect(activeConnections).toEqual(new Set<string>(['t2', 't4']))
    })
})
