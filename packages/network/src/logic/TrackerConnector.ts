import { Utils } from 'streamr-client-protocol'
import { StreamIdAndPartition, TrackerInfo } from '../identifiers'
import { NodeToTracker } from '../protocol/NodeToTracker'
import { Logger } from '../helpers/Logger'
import { PeerInfo } from '../connection/PeerInfo'
import { TrackerId } from './Tracker'
import { StreamManager } from './StreamManager'

export class TrackerConnector {

    private readonly streamManager: StreamManager
    private readonly nodeToTracker: NodeToTracker
    private readonly trackerRegistry: Utils.TrackerRegistry<TrackerInfo>
    private readonly logger: Logger
    private maintenanceTimer?: NodeJS.Timeout | null
    private readonly maintenanceInterval: number
    private unconnectables: Set<TrackerId>

    constructor(streamManager: StreamManager, nodeToTracker: NodeToTracker, trackerRegistry: Utils.TrackerRegistry<TrackerInfo>, logger: Logger, maintenanceInterval: number) {
        this.streamManager = streamManager
        this.nodeToTracker = nodeToTracker
        this.trackerRegistry = trackerRegistry
        this.logger = logger
        this.maintenanceInterval = maintenanceInterval
        this.unconnectables = new Set()
    }

    maintainConnections(): void {
        const activeTrackers = new Set<string>()
        this.streamManager.getStreams().forEach((s) => {
            const trackerInfo = this.trackerRegistry.getTracker(s.id, s.partition)
            activeTrackers.add(trackerInfo.id)
        })
        this.trackerRegistry.getAllTrackers().forEach(({ id, ws }) => {
            if (activeTrackers.has(id)) {
                this.nodeToTracker.connectToTracker(ws, PeerInfo.newTracker(id))
                    .then(() => this.unconnectables.delete(id))
                    .catch((err) => {
                        if (!this.unconnectables.has(id)) {
                            // TODO we could also store the previous error and check that the current error is the same?
                            // -> now it doesn't log anything if the connection error reason changes 
                            this.unconnectables.add(id)
                            this.logger.warn('could not connect to tracker %s, reason: %j', ws, err)
                        }
                    })
            } else {
                this.nodeToTracker.disconnectFromTracker(id)
            }
        })
    }

    start(): void {
        this.maintainConnections()
        this.maintenanceTimer = setInterval(
            this.maintainConnections.bind(this),
            this.maintenanceInterval
        )
    }

    stop(): void {
        if (this.maintenanceTimer) {
            clearInterval(this.maintenanceTimer)
            this.maintenanceTimer = null
        }
    }
}
