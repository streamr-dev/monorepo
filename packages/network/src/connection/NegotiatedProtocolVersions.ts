import { PeerId, PeerInfo } from "./PeerInfo"
import { ControlMessage, StreamMessage } from '@streamr/protocol'

const defaultControlLayerVersions = ControlMessage.getSupportedVersions()
const defaultMessageLayerVersions = StreamMessage.getSupportedVersions()

interface NegotiatedProtocolVersion { controlLayerVersion: number, messageLayerVersion: number }

export class NegotiatedProtocolVersions {

    private readonly peerInfo: PeerInfo
    private readonly negotiatedProtocolVersions: Record<PeerId, NegotiatedProtocolVersion>
    private readonly defaultProtocolVersions: NegotiatedProtocolVersion
    constructor(peerInfo: PeerInfo) {
        this.negotiatedProtocolVersions = Object.create(null)
        this.peerInfo = peerInfo
        this.defaultProtocolVersions = {
            controlLayerVersion: Math.max(0, ...defaultControlLayerVersions),
            messageLayerVersion: Math.max(0, ...defaultMessageLayerVersions)
        }
    }

    negotiateProtocolVersion(peerId: PeerId, controlLayerVersions: number[], messageLayerVersions: number[]): void | never {
        const [controlLayerVersion, messageLayerVersion] = this.validateProtocolVersions(controlLayerVersions, messageLayerVersions)
        this.negotiatedProtocolVersions[peerId] = {
            controlLayerVersion,
            messageLayerVersion
        }
    }

    removeNegotiatedProtocolVersion(peerId: PeerId): void {
        delete this.negotiatedProtocolVersions[peerId]
    }

    getNegotiatedProtocolVersions(peerId: PeerId): NegotiatedProtocolVersion | undefined {
        return this.negotiatedProtocolVersions[peerId]
    }

    getDefaultProtocolVersions(): NegotiatedProtocolVersion {
        return this.defaultProtocolVersions
    }

    private validateProtocolVersions(controlLayerVersions: number[], messageLayerVersions: number[]): [number, number] | never {
        if (!controlLayerVersions || !messageLayerVersions || controlLayerVersions.length === 0 || messageLayerVersions.length === 0) {
            throw new Error('Missing version negotiation! Must give controlLayerVersions and messageLayerVersions as query parameters!')
        }

        const controlLayerVersion = Math.max(...this.peerInfo.controlLayerVersions.filter((version) => controlLayerVersions.includes(version)))
        const messageLayerVersion = Math.max(...this.peerInfo.messageLayerVersions.filter((version) => messageLayerVersions.includes(version)))

        // Validate that the requested versions are supported
        if (controlLayerVersion < 0) {
            throw new Error(`Supported ControlLayer versions: ${
                JSON.stringify(defaultControlLayerVersions)
            }. Are you using an outdated library?`)
        }

        if (messageLayerVersion < 0) {
            throw new Error(`Supported MessageLayer versions: ${
                JSON.stringify(defaultMessageLayerVersions)
            }. Are you using an outdated library?`)
        }

        return [controlLayerVersion, messageLayerVersion]
    }
}
