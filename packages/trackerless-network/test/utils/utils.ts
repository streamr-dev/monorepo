import { randomBytes } from 'crypto'
import { ConnectionLocker, DhtNode, PeerDescriptor, Simulator, SimulatorTransport } from '@streamr/dht'
import { RandomGraphNode } from '../../src/logic/RandomGraphNode'
import {
    ContentType,
    EncryptionType,
    MessageID,
    StreamMessage,
    StreamMessageType
} from '../../src/proto/packages/trackerless-network/protos/NetworkRpc'
import { RemoteRandomGraphNode } from '../../src/logic/RemoteRandomGraphNode'
import { createRandomGraphNode } from '../../src/logic/createRandomGraphNode'
import { RemoteHandshaker } from '../../src/logic/neighbor-discovery/RemoteHandshaker'
import { NetworkNode, createNetworkNode } from '../../src/NetworkNode'
import { hexToBinary, utf8ToBinary } from '@streamr/utils'
import { StreamPartID, StreamPartIDUtils } from '@streamr/protocol'
import { NodeID } from '../../src/identifiers'

export const mockConnectionLocker: ConnectionLocker = {
    lockConnection: () => {},
    unlockConnection: () => {},
    weakLockConnection: () => {},
    weakUnlockConnection: () => {}
}

export const createMockRandomGraphNodeAndDhtNode = (
    ownPeerDescriptor: PeerDescriptor,
    entryPointDescriptor: PeerDescriptor,
    randomGraphId: string,
    simulator: Simulator
): [ DhtNode, RandomGraphNode ] => {
    const mockCm = new SimulatorTransport(ownPeerDescriptor, simulator)
    const dhtNode = new DhtNode({
        transportLayer: mockCm,
        peerDescriptor: ownPeerDescriptor,
        numberOfNodesPerKBucket: 4,
        entryPoints: [entryPointDescriptor]
    })
    const randomGraphNode = createRandomGraphNode({
        randomGraphId,
        P2PTransport: mockCm,
        layer1: dhtNode,
        connectionLocker: mockCm,
        ownPeerDescriptor
    })
    return [dhtNode, randomGraphNode]
}

export const createStreamMessage = (
    content: string,
    streamPartId: StreamPartID,
    publisherId: Uint8Array,
    timestamp?: number,
    sequenceNumber?: number
): StreamMessage => {
    const messageId: MessageID = {
        streamId: StreamPartIDUtils.getStreamID(streamPartId),
        streamPartition: StreamPartIDUtils.getStreamPartition(streamPartId),
        sequenceNumber: sequenceNumber || 0,
        timestamp: timestamp || Date.now(),
        publisherId,
        messageChainId: 'messageChain0',
    }
    const msg: StreamMessage = {
        messageType: StreamMessageType.MESSAGE,
        encryptionType: EncryptionType.NONE,
        content: utf8ToBinary(content),
        contentType: ContentType.JSON,
        messageId,
        signature: hexToBinary('0x1234')
    }
    return msg
}

export const createRandomNodeId = (): NodeID => {
    return randomBytes(10).toString('hex') as NodeID
}

export const createMockRemoteNode = (peerDescriptor?: PeerDescriptor): RemoteRandomGraphNode => {
    const mockPeerDescriptor: PeerDescriptor = {
        kademliaId: hexToBinary(createRandomNodeId()),
        type: 0
    }
    return new RemoteRandomGraphNode(peerDescriptor || mockPeerDescriptor, 'mock', {} as any)
}

export const createMockRemoteHandshaker = (): RemoteHandshaker => {
    const mockPeerDescriptor: PeerDescriptor = {
        kademliaId: hexToBinary(createRandomNodeId()),
        type: 0
    }
    return new RemoteHandshaker(mockPeerDescriptor, 'mock', {
        handshake: async () => {},
        interleaveNotice: async () => {}
    } as any)
}

export const createNetworkNodeWithSimulator = (
    peerDescriptor: PeerDescriptor,
    simulator: Simulator,
    entryPoints: PeerDescriptor[]
): NetworkNode => {
    const transport = new SimulatorTransport(peerDescriptor, simulator)
    return createNetworkNode({
        layer0: {
            peerDescriptor,
            entryPoints,
            transportLayer: transport,
            maxConnections: 25,
            storeHighestTtl: 120000,
            storeMaxTtl: 120000
        },
        networkNode: {}
    })
}
