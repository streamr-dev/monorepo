import { RandomContactList } from '../../src/dht/contact/RandomContactList'
import { PeerID } from '../../src/helpers/PeerID'
import { DhtAddress, getDhtAddressFromRaw } from '../../src/identifiers'

const createItem = (nodeId: Uint8Array): { getNodeId: () => DhtAddress, getPeerId: () => PeerID } => {
    return { 
        getNodeId: () => getDhtAddressFromRaw(nodeId),
        getPeerId: () => PeerID.fromValue(nodeId)
    }
}

describe('RandomContactList', () => {

    const item0 = createItem(new Uint8Array([0, 0, 0, 0]))
    const item1 = createItem(new Uint8Array([0, 0, 0, 1]))
    const item2 = createItem(new Uint8Array([0, 0, 0, 2]))
    const item3 = createItem(new Uint8Array([0, 0, 0, 3]))
    const item4 = createItem(new Uint8Array([0, 0, 0, 4]))

    it('adds contacts correctly', () => {
        const list = new RandomContactList(item0.getNodeId(), 5, 1)
        list.addContact(item1)
        list.addContact(item2)
        list.addContact(item3)
        list.addContact(item3)
        list.addContact(item4)
        list.addContact(item4)
        expect(list.getSize()).toEqual(4)
        expect(list.getContacts()).toEqual(
            [item1, item2, item3, item4]
        )
    })

    it('removes contacts correctly', () => {
        const list = new RandomContactList(item0.getNodeId(), 5, 1)
        list.addContact(item1)
        list.addContact(item2)
        list.addContact(item3)
        list.addContact(item4)
        list.removeContact(item2.getNodeId())
        expect(list.getContact(item1.getNodeId())).toBeTruthy()
        expect(list.getContact(item3.getNodeId())).toBeTruthy()
        expect(list.getContact(item4.getNodeId())).toBeTruthy()
        expect(list.getContacts()).toEqual(
            [item1, item3, item4]
        )
        expect(list.getSize()).toEqual(3)
    })

})
