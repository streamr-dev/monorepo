import EventEmitter from "events"
import { PeerId } from './PeerInfo'

export class DeferredConnectionAttempt {
    
    private eventEmitter: EventEmitter
    private connectionAttemptPromise: Promise<PeerId>

    constructor() {
        this.eventEmitter = new EventEmitter()
        
        this.connectionAttemptPromise = new Promise((resolve, reject) => {
            this.eventEmitter.once('resolve', (targetPeerId) => {
                resolve(targetPeerId)
            })
            this.eventEmitter.once('reject', (reason) => {
                reject(reason)
            })
        })

        // allow promise to reject without outside catch
        this.connectionAttemptPromise.catch(() => {})
    }

    getPromise(): Promise<PeerId> {
        return this.connectionAttemptPromise
    }

    resolve(targetPeerId: PeerId): void {
        this.eventEmitter.emit('resolve', targetPeerId)
    }

    reject(reason: Error | string): void {
        this.eventEmitter.emit('reject', reason)
    }
}