import EventEmitter from 'eventemitter3'
import { WebrtcConnectionEvents, IWebrtcConnection, RtcDescription } from './IWebrtcConnection'
import { IConnection, ConnectionID, ConnectionEvents, ConnectionType } from '../IConnection'
import { Logger, wait } from '@streamr/utils'
import { IceServer } from './WebrtcConnector'
import { createRandomConnectionId } from '../Connection'

enum DisconnectedRtcPeerConnectionStateEnum {
    DISCONNECTED = 'disconnected',
    FAILED = 'failed',
    CLOSED = 'closed',
}

const logger = new Logger(module)

type Events = WebrtcConnectionEvents & ConnectionEvents

interface Params {
    iceServers?: IceServer[]
}

const MESSAGE_QUEUE_MAX_SIZE = 10000

class MessageQueue {
    
    private readonly queue: Array<Uint8Array>
    private readonly sendFn: (message: Uint8Array) => void
    private running: boolean

    constructor(sendFn: (message: Uint8Array) => void) {
        this.running = false
        this.queue = []
        this.sendFn = sendFn
    }

    push(message: Uint8Array): void {
        if (this.queue.length >= MESSAGE_QUEUE_MAX_SIZE) {
            logger.warn('Dropping message due to buffer overflow')
            throw new Error('Cannot add to buffer queue full')
        }
        this.queue.push(message)
    }

    sendBuffer(): void {
        if (this.running === true) {
            return
        }
        this.running = true
        let sendAttempts = 0;
        (async () => {
            while (this.queue.length > 0 && this.running) {
                const messageToSend = this.queue.shift()!
                try {
                    this.sendFn(messageToSend)
                } catch (err) {
                    this.queue.unshift(messageToSend)
                }
                sendAttempts++
                if (sendAttempts % 200 === 0) {
                    await wait(0) // give up CPU cycle 
                }
            }
            this.running = false
        })()   
    }
    
    isRunning(): boolean {
        return this.running
    }

    pause(): void {
        this.running = false
    }
    
}

export class NodeWebrtcConnection extends EventEmitter<Events> implements IWebrtcConnection, IConnection {

    public connectionId: ConnectionID
    public readonly connectionType: ConnectionType = ConnectionType.WEBRTC
    // We need to keep track of connection state ourselves because
    // RTCPeerConnection.connectionState is not supported on Firefox
    private lastState: RTCPeerConnectionState = 'connecting'
    private readonly iceServers: IceServer[]
    private peerConnection?: RTCPeerConnection
    private dataChannel?: RTCDataChannel
    private makingOffer = false
    private isOffering = false
    private closed = false
    private messageQueue: MessageQueue

    constructor(params: Params) {
        super()
        this.connectionId = createRandomConnectionId()
        this.iceServers = params.iceServers ?? []
        this.messageQueue = new MessageQueue((message: Uint8Array) => this.doSend(message))
    }

    public start(isOffering: boolean): void {
        this.isOffering = isOffering
        const urls: RTCIceServer[] = this.iceServers.map(({ url, port, username, password }) => ({
            urls: `${url}:${port}`,
            username,
            credential: password
        }))
        this.peerConnection = new RTCPeerConnection({ iceServers: urls })

        this.peerConnection.onicecandidate = (event) => {
            if ((event.candidate !== null) && (event.candidate.sdpMid !== null)) {
                this.emit('localCandidate', event.candidate.candidate, event.candidate.sdpMid)
            }
        }

        this.peerConnection.onicegatheringstatechange = () => {
            logger.trace(`conn.onGatheringStateChange: ${this.peerConnection?.iceGatheringState}`)
        }

        this.peerConnection.onconnectionstatechange = () => this.onStateChange()

        if (isOffering) {
            this.peerConnection.onnegotiationneeded = async () => {
                if (this.peerConnection !== undefined) {
                    this.makingOffer = true
                    try {
                        await this.peerConnection.setLocalDescription()
                    } catch (err) {
                        logger.warn('Failed to set local description', { err })
                    }
                    if (this.peerConnection.localDescription !== null) {
                        this.emit('localDescription', this.peerConnection.localDescription?.sdp, this.peerConnection.localDescription?.type)
                    }
                }
                this.makingOffer = false
            }

            const dataChannel = this.peerConnection.createDataChannel('streamrDataChannel')
            this.setupDataChannel(dataChannel)
        } else {
            this.peerConnection.ondatachannel = (event) => {
                this.setupDataChannel(event.channel)
            }
        }
    }

    public async setRemoteDescription(description: string, type: string): Promise<void> {
        const offerCollision = (type.toLowerCase() === RtcDescription.OFFER) && (this.makingOffer || (this.peerConnection === undefined) ||
            this.peerConnection.signalingState != 'stable')

        const ignoreOffer = this.isOffering && offerCollision
        if (ignoreOffer) {
            return
        }
        try {
            await this.peerConnection?.setRemoteDescription({ sdp: description, type: type.toLowerCase() as RTCSdpType })
        } catch (err) {
            logger.warn('Failed to set remote description', { err })
        }

        if ((type.toLowerCase() === RtcDescription.OFFER) && (this.peerConnection !== undefined)) {
            try {
                await this.peerConnection.setLocalDescription()
            } catch (err) {
                logger.warn('Failed to set local description', { err })
            }
            if (this.peerConnection.localDescription !== null) {
                this.emit('localDescription', this.peerConnection.localDescription.sdp, this.peerConnection.localDescription.type)
            }
        }
    }

    public addRemoteCandidate(candidate: string, mid: string): void {
        this.peerConnection?.addIceCandidate({ candidate: candidate, sdpMid: mid })
            .catch((err) => {
                logger.warn('Failed to add ICE candidate', { err })
            })
    }

    public isOpen(): boolean {
        return this.lastState === 'connected'
    }

    // IConnection implementation
    
    public async close(gracefulLeave: boolean, reason?: string): Promise<void> {
        this.doClose(gracefulLeave, reason)
    }
    
    private doClose(gracefulLeave: boolean, reason?: string): void {
        if (!this.closed) {
            this.closed = true
            this.lastState = 'closed'

            this.stopListening()
            this.emit('disconnected', gracefulLeave, undefined, reason)
            
            this.removeAllListeners()

            if (this.dataChannel !== undefined) {
                try {
                    this.dataChannel.close()
                } catch (err) {
                    logger.warn('Failed to close data channel', { err })
                }
            }

            this.dataChannel = undefined

            if (this.peerConnection !== undefined) {
                try {
                    this.peerConnection.close()
                } catch (err) {
                    logger.warn('Failed to close connection', { err })
                }
            }
            this.peerConnection = undefined
            
        }
    }

    public destroy(): void {
        this.removeAllListeners()
        this.doClose(false)
    }

    public send(data: Uint8Array): void {
        this.messageQueue.push(data)
        this.messageQueue.sendBuffer()
    }

    private doSend(data: Uint8Array): void {
        if (this.lastState === 'connected') {
            if (this.dataChannel!.bufferedAmount > 1 * 1000 * 1000) {
                this.messageQueue.pause()
                throw 'buffer high'
            } else {
                this.dataChannel?.send(data as Buffer)
            }
        } else {
            logger.warn('Tried to send on a connection with last state ' + this.lastState)
        }
    }

    private setupDataChannel(dataChannel: RTCDataChannel): void {
        this.dataChannel = dataChannel
        dataChannel.bufferedAmountLowThreshold = 32000
        dataChannel.onopen = () => {
            logger.trace('dc.onOpen')
            this.onDataChannelOpen()
        }

        dataChannel.onclose = () => {
            logger.trace('dc.onClosed')
            this.doClose(false)
        }

        dataChannel.onerror = (err) => {
            logger.warn('Data channel error', { err })
        }

        dataChannel.onmessage = (msg) => {
            logger.trace('dc.onmessage')
            this.emit('data', new Uint8Array(msg.data))
        }

        dataChannel.onbufferedamountlow = () => {
            this.messageQueue.sendBuffer()
        }
    }

    private stopListening() {
        if (this.dataChannel !== undefined) {
            this.dataChannel.onopen = null
            this.dataChannel.onclose = null
            this.dataChannel.onerror = null
            this.dataChannel.onbufferedamountlow = null
            this.dataChannel.onmessage = null
        }

        if (this.peerConnection !== undefined) {
            this.peerConnection.onconnectionstatechange = null
            this.peerConnection.onicecandidate = null
            this.peerConnection.onicegatheringstatechange = null
            this.peerConnection.onnegotiationneeded = null
            this.peerConnection.ondatachannel = null
        }
    }

    private onDataChannelOpen(): void {
        this.lastState = 'connected'
        this.emit('connected')
    }

    private onStateChange(): void {
        if (this.peerConnection!.connectionState === DisconnectedRtcPeerConnectionStateEnum.CLOSED
            || this.peerConnection!.connectionState === DisconnectedRtcPeerConnectionStateEnum.DISCONNECTED
            || this.peerConnection!.connectionState === DisconnectedRtcPeerConnectionStateEnum.FAILED
        ) {
            this.doClose(false)
        }
    }

    public setConnectionId(connectionId: ConnectionID): void {
        this.connectionId = connectionId
    }
}
