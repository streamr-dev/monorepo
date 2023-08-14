import { ListeningRpcCommunicator, PeerIDKey, peerIdFromPeerDescriptor } from '@streamr/dht'
import { Handshaker } from './neighbor-discovery/Handshaker'
import { NeighborFinder } from './neighbor-discovery/NeighborFinder'
import { NeighborUpdateManager } from './neighbor-discovery/NeighborUpdateManager'
import { StrictRandomGraphNodeConfig, RandomGraphNode } from './RandomGraphNode'
import { PeerList } from './PeerList'
import { Propagation } from './propagation/Propagation'
import { StreamMessage } from '../proto/packages/trackerless-network/protos/NetworkRpc'
import { MarkOptional } from 'ts-essentials'
import { ProxyStreamConnectionServer } from './proxy/ProxyStreamConnectionServer'

type RandomGraphNodeConfig = MarkOptional<StrictRandomGraphNodeConfig,
    "nearbyContactPool" | "randomContactPool" | "targetNeighbors" | "propagation"
    | "handshaker" | "neighborFinder" | "neighborUpdateManager" | "nodeName" | "numOfTargetNeighbors"
    | "maxNumberOfContacts" | "minPropagationTargets" | "rpcCommunicator" | "peerViewSize" | "acceptProxyConnections"
    | "neighborUpdateInterval">

const createConfigWithDefaults = (config: RandomGraphNodeConfig): StrictRandomGraphNodeConfig => {
    const peerId = peerIdFromPeerDescriptor(config.ownPeerDescriptor)
    const rpcCommunicator = config.rpcCommunicator ?? new ListeningRpcCommunicator(`layer2-${config.randomGraphId}`, config.P2PTransport)
    const nodeName = config.nodeName ?? peerId.toKey()
    const numOfTargetNeighbors = config.numOfTargetNeighbors ?? 4
    const maxNumberOfContacts = config.maxNumberOfContacts ?? 20
    const minPropagationTargets = config.minPropagationTargets ?? 2
    const acceptProxyConnections = config.acceptProxyConnections ?? false
    const neighborUpdateInterval = config.neighborUpdateInterval ?? 10000
    const nearbyContactPool = config.nearbyContactPool ?? new PeerList(peerId, numOfTargetNeighbors + 1)
    const randomContactPool = config.randomContactPool ?? new PeerList(peerId, maxNumberOfContacts)
    const targetNeighbors = config.targetNeighbors ?? new PeerList(peerId, maxNumberOfContacts)
    const proxyConnectionServer = acceptProxyConnections ? new ProxyStreamConnectionServer({
        ownPeerDescriptor: config.ownPeerDescriptor,
        streamPartId: config.randomGraphId,
        rpcCommunicator
    }) : undefined
    const propagation = config.propagation ?? new Propagation({
        minPropagationTargets,
        sendToNeighbor: async (neighborId: string, msg: StreamMessage): Promise<void> => {
            const remote = targetNeighbors.getNeighborWithId(neighborId)
            const proxyConnection = proxyConnectionServer?.getConnection(neighborId as PeerIDKey)
            if (remote) {
                await remote.sendData(config.ownPeerDescriptor, msg)
            } else if (proxyConnection) {
                await proxyConnection.remote.sendData(config.ownPeerDescriptor, msg)
            } else {
                throw new Error('Propagation target not found')
            }
        }
    })
    const handshaker = config.handshaker ?? new Handshaker({
        ownPeerDescriptor: config.ownPeerDescriptor,
        randomGraphId: config.randomGraphId,
        connectionLocker: config.connectionLocker,
        nodeName: config.nodeName,
        rpcCommunicator,
        nearbyContactPool,
        randomContactPool,
        targetNeighbors,
        N: numOfTargetNeighbors
    })
    const neighborFinder = config.neighborFinder ?? new NeighborFinder({
        targetNeighbors: targetNeighbors,
        nearbyContactPool: nearbyContactPool,
        doFindNeighbors: (excludedIds) => handshaker!.attemptHandshakesOnContacts(excludedIds),
        N: numOfTargetNeighbors
    })
    const neighborUpdateManager = config.neighborUpdateManager ?? new NeighborUpdateManager({
        targetNeighbors,
        nearbyContactPool,
        ownStringId: peerId.toKey(),
        ownPeerDescriptor: config.ownPeerDescriptor,
        neighborFinder,
        randomGraphId: config.randomGraphId,
        rpcCommunicator,
        neighborUpdateInterval
    })
    return {
        ...config,
        nearbyContactPool,
        randomContactPool,
        targetNeighbors,
        rpcCommunicator,
        handshaker,
        neighborFinder,
        neighborUpdateManager,
        propagation,
        numOfTargetNeighbors,
        minPropagationTargets,
        maxNumberOfContacts,
        nodeName,
        peerViewSize: maxNumberOfContacts,
        acceptProxyConnections,
        proxyConnectionServer,
        neighborUpdateInterval
    }
}

export const createRandomGraphNode = (config: RandomGraphNodeConfig): RandomGraphNode => {
    return new RandomGraphNode(createConfigWithDefaults(config))
}
