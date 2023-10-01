import EventEmitter from 'eventemitter3'
import { WebRtcConnectionEvents, IWebRtcConnection, RtcDescription } from './IWebRtcConnection'
import { IConnection, ConnectionID, ConnectionEvents, ConnectionType } from '../IConnection'
import { Logger } from '@streamr/utils'
import { DisconnectionType } from '../../transport/ITransport'
import { IceServer } from './WebRtcConnector'

const logger = new Logger(module)

export const WEB_RTC_CLEANUP = new class {
    // eslint-disable-next-line class-methods-use-this
    cleanUp(): void {
    }
}

type Events = WebRtcConnectionEvents & ConnectionEvents

interface Params {
    iceServers?: IceServer[]
}

export class NodeWebRtcConnection extends EventEmitter<Events> implements IWebRtcConnection, IConnection {

    public readonly connectionId: ConnectionID
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

    constructor(params: Params) {
        super()
        this.connectionId = new ConnectionID()
        this.iceServers = params.iceServers || []
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
            if (event.candidate && event.candidate.sdpMid) {
                this.emit('localCandidate', event.candidate.candidate, event.candidate.sdpMid)
            }
        }

        this.peerConnection.onicegatheringstatechange = () => {
            logger.trace(`conn.onGatheringStateChange: ${this.peerConnection?.iceGatheringState}`)
        }

        if (isOffering) {
            this.peerConnection.onnegotiationneeded = async () => {
                try {
                    if (this.peerConnection) {
                        this.makingOffer = true
                        try {
                            await this.peerConnection.setLocalDescription()
                        } catch (err) {
                            logger.warn('error', { err })
                        }
                        if (this.peerConnection.localDescription) {
                            this.emit('localDescription', this.peerConnection.localDescription?.sdp, this.peerConnection.localDescription?.type)
                        }
                    }
                } catch (err) {
                    logger.error('error', { err })
                } finally {
                    this.makingOffer = false
                }
            }

            const dataChannel = this.peerConnection.createDataChannel('streamrDataChannel')
            this.setupDataChannel(dataChannel)
        } else {
            this.peerConnection.ondatachannel = (event) => {
                this.setupDataChannel(event.channel)
                logger.trace('connection.onDataChannel')
                this.openDataChannel(event.channel)
            }
        }
    }

    public async setRemoteDescription(description: string, type: string): Promise<void> {
        const offerCollision = (type.toLowerCase() === RtcDescription.OFFER) && (this.makingOffer || !this.peerConnection ||
            this.peerConnection.signalingState != 'stable')

        const ignoreOffer = this.isOffering && offerCollision
        if (ignoreOffer) {
            return
        }
        try {
            await this.peerConnection?.setRemoteDescription({ sdp: description, type: type.toLowerCase() as RTCSdpType })
        } catch (err) {
            logger.warn('error', { err })
        }

        if (type.toLowerCase() === RtcDescription.OFFER && this.peerConnection) {
            try {
                await this.peerConnection.setLocalDescription()
            } catch (err) {
                logger.warn('error', { err })
            }
            if (this.peerConnection.localDescription) {
                this.emit('localDescription', this.peerConnection.localDescription.sdp, this.peerConnection.localDescription.type)
            }
        }
    }

    public addRemoteCandidate(candidate: string, mid: string): void {
        try {
            this.peerConnection?.addIceCandidate({ candidate: candidate, sdpMid: mid }).then(() => { return }).catch((err: any) => {
                logger.warn('error', { err })
            })
        } catch (err) {
            logger.warn('error', { err })
        }
    }

    public isOpen(): boolean {
        return this.lastState === 'connected'
    }

    // IConnection implementation
    
    public async close(disconnectionType: DisconnectionType, reason?: string): Promise<void> {
        this.doClose(disconnectionType, reason)
    }
    
    private doClose(disconnectionType: DisconnectionType, reason?: string): void {
        if (!this.closed) {
            this.closed = true
            this.lastState = 'closed'

            this.stopListening()
            this.emit('disconnected', disconnectionType, undefined, reason)
            
            this.removeAllListeners()

            if (this.dataChannel) {
                try {
                    this.dataChannel.close()
                } catch (e) {
                    logger.warn(`dc.close() errored: ${e}`)
                }
            }

            this.dataChannel = undefined

            if (this.peerConnection) {
                try {
                    this.peerConnection.close()
                } catch (e) {
                    logger.warn(`conn.close() errored: ${e}`)
                }
            }
            this.peerConnection = undefined
            
        }
    }

    public destroy(): void {
        this.removeAllListeners()
        this.doClose('OTHER')
    }

    public send(data: Uint8Array): void {
        if (this.lastState === 'connected') {
            this.dataChannel?.send(data as Buffer)
        } else {
            logger.warn('Tried to send on a connection with last state ' + this.lastState)
        }
    }

    private setupDataChannel(dataChannel: RTCDataChannel): void {
        dataChannel.onopen = () => {
            logger.trace('dc.onOpen')
            this.openDataChannel(dataChannel)
        }

        dataChannel.onclose = () => {
            logger.trace('dc.onClosed')
            this.doClose('OTHER')
        }

        dataChannel.onerror = (err) => {
            logger.warn(`dc.onError: ${err}`)
        }

        dataChannel.onbufferedamountlow = () => {
            //this.emitLowBackpressure()
        }

        dataChannel.onmessage = (msg) => {
            logger.trace('dc.onmessage')
            this.emit('data', new Uint8Array(msg.data))
        }
    }

    private stopListening() {
        if (this.dataChannel) {
            this.dataChannel.onopen = null
            this.dataChannel.onclose = null
            this.dataChannel.onerror = null
            this.dataChannel.onbufferedamountlow = null
            this.dataChannel.onmessage = null
        }

        if (this.peerConnection) {
            this.peerConnection.onicecandidate = null
            this.peerConnection.onicegatheringstatechange = null
            this.peerConnection.onnegotiationneeded = null
            this.peerConnection.ondatachannel = null
        }
    }

    private openDataChannel(dataChannel: RTCDataChannel): void {
        this.dataChannel = dataChannel
        this.lastState = 'connected'
        this.emit('connected')
    }

    public setConnectionId(connectionID: string): void {
        this.connectionId = new ConnectionID(connectionID)
    }
}
