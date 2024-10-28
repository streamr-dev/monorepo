import { v4 } from 'uuid'
import WebSocket from 'ws'
import { NetworkNode } from '../src/NetworkNode'
import { NetworkStack } from '../src/NetworkStack'
import { ExperimentClientMessage, ExperimentServerMessage, Hello } from './generated/packages/trackerless-network/experiment/Experiment'
import { NodeType, PeerDescriptor } from '@streamr/dht'
import { binaryToHex, hexToBinary, StreamIDUtils, StreamPartID, StreamPartIDUtils, utf8ToBinary } from '@streamr/utils'
import { ContentType, EncryptionType, SignatureType, StreamMessage } from '../generated/packages/trackerless-network/protos/NetworkRpc'

const createStreamMessage = (streamPartId: StreamPartID, id: string, region: number) => {
    const message: StreamMessage = {
        messageId: {
            streamId: StreamPartIDUtils.getStreamID(streamPartId),
            streamPartition: StreamPartIDUtils.getStreamPartition(streamPartId),
            timestamp: Date.now(),
            sequenceNumber: 0,
            publisherId: hexToBinary(binaryToHex(utf8ToBinary(id))),
            messageChainId: 'msgChainId'
        },
        body: {
            oneofKind: 'contentMessage',
            contentMessage: {
                content: utf8ToBinary(JSON.stringify({ id, route: [
                    { id, time: Date.now(), region }
                ]})),
                contentType: ContentType.JSON,
                encryptionType: EncryptionType.NONE,
            }
        },
        signatureType: SignatureType.SECP256K1,
        signature: hexToBinary('0x1234')
    }
    return message
}

export class ExperimentNodeWrapper {
    private readonly id = v4()
    private node?: NetworkNode
    private socket?: WebSocket
    constructor() {
        console.log(this.id)
    }

    async run() {
        await this.connect()
    }

    async startNode(entryPoints: PeerDescriptor[], asEntryPoint: boolean, join: boolean, nodeId?: string) {
        console.log('starting node')
        let configPeerDescriptor: PeerDescriptor | undefined
        if (asEntryPoint) {
            configPeerDescriptor = {
                nodeId: hexToBinary(nodeId!),
                websocket: {
                    host: '127.0.0.1',
                    port: 44444,
                    tls: false
                },
                type: NodeType.NODEJS
            }
        }
        const layer0config = {
            entryPoints: asEntryPoint ? [configPeerDescriptor!] : entryPoints,
            websocketPortRange: { min: 44444, max: 44888 },
            websocketServerEnableTls: false,
            peerDescriptor: configPeerDescriptor,
            webrtcAllowPrivateAddresses: true
        }
        const stack = new NetworkStack({
            layer0: layer0config,
            networkNode: {
                experimentId: this.id
            }
        })
        this.node = new NetworkNode(stack)
        await this.node.start(join)
        const peerDescriptor = this.node.getPeerDescriptor()
        const message = ExperimentClientMessage.create({
            id: this.id,
            payload: {
                oneofKind: 'started',
                started: {
                    peerDescriptor,
                    timeToJoin: 0
                }
            }
        })
        this.send(message)
    }

    async connect() {
        this.socket = new WebSocket('ws://localhost:7070')
        this.socket.binaryType = 'nodebuffer'
        this.socket.on('open', () => {
            const helloMessage = ExperimentClientMessage.create({
                id: this.id,
                payload: { 
                    oneofKind: 'hello', 
                    hello: Hello.create({})
                }
            })
            this.socket!.send(ExperimentClientMessage.toBinary(helloMessage))
        })

        this.socket!.on('message', (data) => {
            // These should be commands to run a task for an experiment
            const message = ExperimentServerMessage.fromBinary(new Uint8Array(data as ArrayBuffer))
            if (message.instruction.oneofKind === 'start') {
                const instruction = message.instruction.start
                setImmediate(() => this.startNode(instruction.entryPoints, instruction.asEntryPoint, instruction.join, instruction.nodeId))
            } else if (message.instruction.oneofKind === 'joinExperiment') {
                const instruction = message.instruction.joinExperiment
                setImmediate(() => this.joinExperiment(instruction.entryPoints))
            } else if (message.instruction.oneofKind === 'joinStreamPart') {
                const instruction = message.instruction.joinStreamPart
                setImmediate(() => this.joinStreamPart(instruction.streamPartId, instruction.neighborCount))
            } else if (message.instruction.oneofKind === 'publishMessage') {
                const instruction = message.instruction.publishMessage
                setImmediate(() => this.publishMessage(instruction.streamPartId))
            }
        })
    }

    send(msg: ExperimentClientMessage): void {
        this.socket!.send(ExperimentClientMessage.toBinary(msg))
    }

    async joinExperiment(entryPoints: PeerDescriptor[]): Promise<void> {
        console.log('joining experiment')
        const startTime = Date.now()
        await this.node!.stack.getControlLayerNode().joinDht(entryPoints)
        const runTime = Date.now() - startTime
        const results = ExperimentClientMessage.create({
            id: this.id,
            payload: {
                oneofKind: 'experimentResults',
                experimentResults: {
                    results: `${runTime}`
                }
            }
        })
        this.send(results)
    }

    async joinStreamPart(streamPartId: string, neighborCount: number): Promise<void> {
        const streamPart = StreamPartIDUtils.parse(streamPartId)
        await this.node!.join(streamPart, { minCount: neighborCount, timeout: 20000 })
        const results = ExperimentClientMessage.create({
            id: this.id,
            payload: {
                oneofKind: 'instructionCompleted',
                instructionCompleted: {}
            }
        })
        this.send(results)
    }

    async publishMessage(streamPartId: string): Promise<void> {
        const streamPart = StreamPartIDUtils.parse(streamPartId)
        const message = createStreamMessage(streamPart, this.id, this.node!.getPeerDescriptor().region!)
        await this.node!.broadcast(message)
        const results = ExperimentClientMessage.create({
            id: this.id,
            payload: {
                oneofKind: 'instructionCompleted',
                instructionCompleted: {}
            }
        })
        this.send(results)
    }

    async stop() {
        this.node!.stop()
        this.socket!.close()
    }

}
