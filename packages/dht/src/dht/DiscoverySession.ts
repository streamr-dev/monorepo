import { RpcCommunicator, toProtoRpcClient } from "@streamr/proto-rpc"
import { Logger, runAndWaitForEvents3 } from "@streamr/utils"
import EventEmitter from "eventemitter3"
import { v4 } from "uuid"
import { PeerID } from "../helpers/PeerID"
import { PeerDescriptor } from "../proto/packages/dht/protos/DhtRpc"
import { DhtRpcServiceClient } from "../proto/packages/dht/protos/DhtRpc.client"
import { SortedContactList } from "./contact/SortedContactList"
import { DhtPeer } from "./DhtPeer"

const logger = new Logger(module)

interface DiscoverySessionEvents {
    discoveryCompleted: () => void
}

export class DiscoverySession {
    public readonly sessionId = v4()

    private stopped = false
    private emitter = new EventEmitter<DiscoverySessionEvents>()
    private outgoingClosestPeersRequestsCounter = 0
    private noProgressCounter = 0
    private ongoingClosestPeersRequests: Set<string> = new Set()
    private readonly neighborList: SortedContactList<DhtPeer>
    private readonly targetId: Uint8Array
    private readonly ownPeerDescriptor: PeerDescriptor
    private readonly serviceId: string
    private readonly rpcCommunicator: RpcCommunicator
    private readonly parallelism: number
    private readonly noProgressLimit: number
    private readonly newContactListener?: (dhtPeer: DhtPeer) => void
    private readonly nodeName?: string

    constructor(
        neighborList: SortedContactList<DhtPeer>,
        targetId: Uint8Array,
        ownPeerDescriptor: PeerDescriptor,
        serviceId: string,
        rpcCommunicator: RpcCommunicator,
        parallelism: number,
        noProgressLimit: number,
        newContactListener?: (dhtPeer: DhtPeer) => void,
        nodeName?: string
    ) {
        this.neighborList = neighborList
        this.targetId = targetId
        this.ownPeerDescriptor = ownPeerDescriptor
        this.serviceId = serviceId
        this.rpcCommunicator = rpcCommunicator
        this.parallelism = parallelism
        this.noProgressLimit = noProgressLimit
        this.newContactListener = newContactListener
        this.nodeName = nodeName
    }

    private get ownPeerId(): PeerID {
        return PeerID.fromValue(this.ownPeerDescriptor.kademliaId)
    }

    private addNewContacts(contacts: PeerDescriptor[]): void {
        if (this.stopped) {
            return
        }
        contacts.forEach((contact) => {
            const dhtPeer = new DhtPeer(
                this.ownPeerDescriptor,
                contact,
                toProtoRpcClient(new DhtRpcServiceClient(this.rpcCommunicator!.getRpcClientTransport())),
                this.serviceId
            )
            if (!dhtPeer.getPeerId().equals(this.ownPeerId!)) {
                if (this.newContactListener) {
                    this.newContactListener(dhtPeer)
                }
                if (!this.neighborList.getContact(dhtPeer.getPeerId())) {
                    this.neighborList!.addContact(dhtPeer)
                }
            }
        })
    }

    private async getClosestPeersFromContact(contact: DhtPeer): Promise<PeerDescriptor[]> {
        if (this.stopped) {
            return []
        }
        logger.trace(`Getting closest peers from contact: ${contact.getPeerId().toKey()}`)
        this.outgoingClosestPeersRequestsCounter++
        this.neighborList!.setContacted(contact.getPeerId())
        const returnedContacts = await contact.getClosestPeers(this.targetId)
        this.neighborList!.setActive(contact.getPeerId())
        return returnedContacts
    }

    private onClosestPeersRequestSucceeded(peerId: PeerID, contacts: PeerDescriptor[]) {
        if (this.ongoingClosestPeersRequests.has(peerId.toKey())) {
            this.ongoingClosestPeersRequests.delete(peerId.toKey())
            const oldClosestContact = this.neighborList!.getClosestContactId()
            this.addNewContacts(contacts)
            if (this.neighborList!.getClosestContactId().equals(oldClosestContact)) {
                this.noProgressCounter++
            } else {
                this.noProgressCounter = 0
            }
        }
    }

    private onClosestPeersRequestFailed(peer: DhtPeer, _exception: Error) {
        if (this.ongoingClosestPeersRequests.has(peer.getPeerId().toKey())) {
            this.ongoingClosestPeersRequests.delete(peer.getPeerId().toKey())
            this.neighborList!.removeContact(peer.getPeerId())
        }
    }

    private findMoreContacts(): void {
        if (this.stopped) {
            return
        }
        if (this.neighborList!.getUncontactedContacts(this.parallelism).length < 1
            || this.noProgressCounter >= this.noProgressLimit) {
            this.emitter.emit('discoveryCompleted')
            this.stopped = true
            return
        }
        const uncontacted = this.neighborList!.getUncontactedContacts(this.parallelism)
        while (this.ongoingClosestPeersRequests.size < this.parallelism && uncontacted.length > 0) {
            const nextPeer = uncontacted.shift()
            this.ongoingClosestPeersRequests.add(nextPeer!.getPeerId().toKey())
            // eslint-disable-next-line promise/catch-or-return
            this.getClosestPeersFromContact(nextPeer!)
                .then((contacts) => this.onClosestPeersRequestSucceeded(nextPeer!.getPeerId(), contacts))
                .catch((err) => this.onClosestPeersRequestFailed(nextPeer!, err))
                .finally(() => {
                    this.outgoingClosestPeersRequestsCounter--
                    this.findMoreContacts()
                })
        }
    }

    public async findClosestNodes(timeout: number): Promise<SortedContactList<DhtPeer>> {
        if (this.neighborList!.getUncontactedContacts(this.parallelism).length < 1) {
            logger.trace('getUncontactedContacts length was 0 in beginning of discovery, this.neighborList.size: '
                + this.neighborList.getSize())
            return this.neighborList
        }
        await runAndWaitForEvents3<DiscoverySessionEvents>([() => { this.findMoreContacts() }], [
            [this.emitter, 'discoveryCompleted']], timeout)

        return this.neighborList
    }

    public stop(): void {
        this.stopped = true
        this.emitter.emit('discoveryCompleted')
    }
}
