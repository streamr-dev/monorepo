#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-floating-promises */
import { config as CHAIN_CONFIG } from '@streamr/config'
import { DhtAddress, DhtNode, NodeType, getRawFromDhtAddress } from '@streamr/dht'

const main = async () => {
    const entryPoint = CHAIN_CONFIG.dev2.entryPoints[0]
    const peerDescriptor = {
        ...entryPoint,
        nodeId: getRawFromDhtAddress(entryPoint.nodeId as DhtAddress),
        type: NodeType.NODEJS  // TODO remove this when NET-1070 done
    }
    const dhtNode = new DhtNode({
        nodeId: entryPoint.nodeId as DhtAddress,
        websocketHost: entryPoint.websocket.host,
        websocketPortRange: {
            min: entryPoint.websocket.port,
            max: entryPoint.websocket.port
        },
        websocketServerEnableTls: false,
        entryPoints: [peerDescriptor]
    })
    await dhtNode.start()
    await dhtNode.joinDht([peerDescriptor])
    console.info('Entry point started')
}

main()
