import { Message, PeerDescriptor } from '../proto/DhtRpc'
import { EventEmitter } from 'events'
import { ITransport, Event } from '../transport/ITransport'
import { Simulator } from './Simulator'

export class MockConnectionManager extends EventEmitter implements ITransport {
    constructor(private ownPeerDescriptor: PeerDescriptor, private simulator: Simulator) {
        super()
        this.simulator.addConnectionManager(this)
    }

    send(peerDescriptor: PeerDescriptor, msg: Message): void {
        this.simulator.send(this.ownPeerDescriptor, peerDescriptor, msg)
    }

    disconnect(_peerDescriptor: PeerDescriptor): void { }

    getPeerDescriptor(): PeerDescriptor {
        return this.ownPeerDescriptor
    }

    handleIncomingMessage(peerDescriptor: PeerDescriptor, msg: Message): void {
        this.emit(Event.DATA, peerDescriptor, msg)
    }
}