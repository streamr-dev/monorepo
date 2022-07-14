import { StreamPartID, toStreamID, toStreamPartID } from 'streamr-client-protocol'
import { Tracker } from '@streamr/network-tracker'
import { PeerInfo } from '../src/connection/PeerInfo'
import { startHttpServer, ServerWsEndpoint } from '../src/connection/ws/ServerWsEndpoint'
import { Node } from '../src/logic/Node'

export const startServerWsEndpoint = async (
    host: string,
    port: number,
    peerInfo: PeerInfo,
    pingInterval?: number | undefined
): Promise<ServerWsEndpoint> => {
    const listen = {
        hostname: host,
        port: port
    }
    const httpServer = await startHttpServer(listen, undefined, undefined)
    return new ServerWsEndpoint(listen, false, httpServer, peerInfo, pingInterval)
}

export const createStreamPartId = (streamIdAsStr: string, streamPartition: number): StreamPartID => {
    return toStreamPartID(toStreamID(streamIdAsStr), streamPartition)
}

export const getStreamParts = (nodeOrTracker: Node|Tracker): StreamPartID[] => {
    return Array.from(nodeOrTracker.getStreamParts())
}
