import { NodeID, areEqualNodeIds } from '../../helpers/nodeId'
import { ContactList, ContactState } from './ContactList'

export class RandomContactList<C extends { getNodeId: () => NodeID }> extends ContactList<C> {

    private randomness: number

    constructor(
        localNodeId: NodeID,
        maxSize: number,
        randomness = 0.20,
        defaultContactQueryLimit?: number
    ) {
        super(localNodeId, maxSize, defaultContactQueryLimit)
        this.randomness = randomness
    }

    addContact(contact: C): void {
        if (areEqualNodeIds(this.localNodeId, contact.getNodeId())) {
            return
        }
        if (!this.contactsById.has(contact.getNodeId())) {
            const roll = Math.random()
            if (roll < this.randomness) {
                if (this.getSize() === this.maxSize && this.getSize() > 0) {
                    const toRemove = this.contactIds[0]
                    this.removeContact(toRemove)
                }
                this.contactIds.push(contact.getNodeId())
                this.contactsById.set(contact.getNodeId(), new ContactState(contact))
                this.emit(
                    'newContact',
                    contact,
                    this.getContacts()
                )
            }
        }
    }

    removeContact(id: NodeID): boolean {
        if (this.contactsById.has(id)) {
            const removed = this.contactsById.get(id)!.contact
            const index = this.contactIds.findIndex((nodeId) => areEqualNodeIds(nodeId, id))
            this.contactIds.splice(index, 1)
            this.contactsById.delete(id)
            this.emit('contactRemoved', removed, this.getContacts())
            return true
        }
        return false
    }

    public getContacts(limit = this.defaultContactQueryLimit): C[] {
        const ret: C[] = []
        this.contactIds.forEach((contactId) => {
            const contact = this.contactsById.get(contactId)
            if (contact) {
                ret.push(contact.contact)
            }
        })
        return ret.slice(0, limit)
    }
}
