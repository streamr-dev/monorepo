import { createTestStream, fakePrivateKey, getCreateClient, getPrivateKey } from '../utils'
import { ConfigTest, Stream, StreamPermission, StreamrClient } from '../../src'
import { wait } from 'streamr-test-utils'
import { toStreamPartID } from 'streamr-client-protocol'

jest.setTimeout(50000)

describe('PubSub with proxy connections', () => {
    let stream: Stream
    let publishingClient: StreamrClient
    let proxyClient1: StreamrClient
    let proxyClient2: StreamrClient
    let pubPrivateKey: string
    let proxyPrivateKey1: string
    let proxyPrivateKey2: string
    let proxyNodeId1: string
    let proxyNodeId2: string
    const createClient = getCreateClient()

    beforeEach(async () => {
        pubPrivateKey = await getPrivateKey()
        proxyPrivateKey1 = fakePrivateKey()
        proxyPrivateKey2 = fakePrivateKey()

        publishingClient = await createClient({
            id: 'publisher',
            auth: {
                privateKey: pubPrivateKey
            }
        })
        proxyClient1 = await createClient({
            id: 'proxy',
            auth: {
                privateKey: proxyPrivateKey1
            },
            network: {
                acceptProxyConnections: true,
                trackers: ConfigTest.network.trackers
            }
        })
        proxyClient2 = await createClient({
            id: 'proxy',
            auth: {
                privateKey: proxyPrivateKey2
            },
            network: {
                acceptProxyConnections: true,
                trackers: ConfigTest.network.trackers
            }
        })
    }, 10000)

    beforeEach(async () => {
        proxyNodeId1 = await proxyClient1.node.getNodeId()
        proxyNodeId2 = await proxyClient2.node.getNodeId()
        stream = await createTestStream(publishingClient, module)
        const pubUser = await publishingClient.getAddress()
        const proxyUser = await proxyClient1.getAddress()
        const proxyUser2 = await proxyClient2.getAddress()

        await stream.grantUserPermission(StreamPermission.PUBLISH, pubUser)
        await stream.grantUserPermission(StreamPermission.PUBLISH, proxyUser)
        await stream.grantUserPermission(StreamPermission.SUBSCRIBE, proxyUser)
        await stream.grantUserPermission(StreamPermission.PUBLISH, proxyUser2)
        await stream.grantUserPermission(StreamPermission.SUBSCRIBE, proxyUser2)
    }, 60000)

    it('Publish only connections work', async () => {
        const receivedMessagesProxy: any[] = []
        await proxyClient1.subscribe(stream, (msg) => {
            receivedMessagesProxy.push(msg)
        })
        await wait(1000)
        await publishingClient.setPublishProxy(stream, proxyNodeId1)
        await publishingClient.publish(stream, {
            msg: 'hellow'
        })
        await publishingClient.publish(stream, {
            msg: 'hellow'
        })
        await publishingClient.publish(stream, {
            msg: 'hellow'
        })
        await wait(2500)
        expect(receivedMessagesProxy.length).toEqual(3)

        // @ts-expect-error private
        expect((await publishingClient.publisher.node.getNode())
            // @ts-expect-error private
            .streamPartManager.hasOutOnlyConnection(toStreamPartID(stream.id, 0), proxyNodeId1))
            .toEqual(true)
    }, 15000)

    it('removing proxy publishing node works', async () => {
        const receivedMessagesProxy: any[] = []
        await proxyClient1.subscribe(stream, (msg) => {
            receivedMessagesProxy.push(msg)
        })
        await wait(1000)
        await publishingClient.setPublishProxy(stream, proxyNodeId1)
        await wait(1000)

        // @ts-expect-error private
        expect((await publishingClient.publisher.node.getNode())
            // @ts-expect-error private
            .streamPartManager.hasOutOnlyConnection(toStreamPartID(stream.id, 0), proxyNodeId1))
            .toEqual(true)

        await publishingClient.removePublishProxy(stream, proxyNodeId1)

        // @ts-expect-error private
        expect((await publishingClient.publisher.node.getNode())
            // @ts-expect-error private
            .streamPartManager.isSetUp(toStreamPartID(stream.id, 0)))
            .toEqual(false)
    }, 15000)

    it('setPublishProxies, removePublishProxies', async () => {
        const receivedMessagesProxy1: any[] = []
        const receivedMessagesProxy2: any[] = []
        await proxyClient1.subscribe(stream, (msg) => {
            receivedMessagesProxy1.push(msg)
        })
        await proxyClient2.subscribe(stream, (msg) => {
            receivedMessagesProxy2.push(msg)
        })
        await wait(1000)
        await publishingClient.setPublishProxies(stream, [proxyNodeId1, proxyNodeId2])
        await wait(1000)

        // @ts-expect-error private
        expect((await publishingClient.publisher.node.getNode())
            // @ts-expect-error private
            .streamPartManager.hasOutOnlyConnection(toStreamPartID(stream.id, 0), proxyNodeId1))
            .toEqual(true)

        // @ts-expect-error private
        expect((await publishingClient.publisher.node.getNode())
            // @ts-expect-error private
            .streamPartManager.hasOutOnlyConnection(toStreamPartID(stream.id, 0), proxyNodeId2))
            .toEqual(true)

        await publishingClient.removePublishProxies(stream, [proxyNodeId1, proxyNodeId2])

        // @ts-expect-error private
        expect((await publishingClient.publisher.node.getNode())
            // @ts-expect-error private
            .streamPartManager.isSetUp(toStreamPartID(stream.id, 0)))
            .toEqual(false)

        // @ts-expect-error private
        expect((await publishingClient.publisher.node.getNode())
            // @ts-expect-error private
            .streamPartManager.isSetUp(toStreamPartID(stream.id, 0)))
            .toEqual(false)

    }, 15000)
})
