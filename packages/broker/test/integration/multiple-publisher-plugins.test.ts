import mqtt, { AsyncMqttClient } from 'async-mqtt'
import WebSocket from 'ws'
import fetch from 'node-fetch'
import { StreamPermission } from 'streamr-client'
import { fetchPrivateKeyWithGas, Queue } from '@streamr/test-utils'
import { Broker } from '../../src/broker'
import { startBroker, createClient, createTestStream } from '../utils'
import { fastPrivateKey } from '@streamr/test-utils'
import { wait, waitForEvent, waitForCondition } from '@streamr/utils'
import sample from 'lodash/sample'
import range from 'lodash/range'

const MESSAGE_COUNT = 120
const mqttPort = 13611
const wsPort = 13612
const httpPort = 13613

const sendPostRequest = (url: string, content: object): Promise<unknown> => {
    return fetch(url, {
        method: 'POST',
        body: JSON.stringify(content),
        headers: { 'Content-Type': 'application/json' }
    })
}

interface PluginPublisher {
    connect: (streamId: string) => Promise<void>
    publish: (msg: object, streamId: string) => Promise<unknown>
    close: () => Promise<void>
}

class MqttPluginPublisher implements PluginPublisher {
    client: AsyncMqttClient | undefined
    async connect(): Promise<void> {
        this.client = await mqtt.connectAsync(`mqtt://localhost:${mqttPort}`)
    }
    publish(msg: object, streamId: string): Promise<unknown> {
        return this.client!.publish(streamId, JSON.stringify(msg))
    }
    close(): Promise<void> {
        return this.client!.end(false)
    }
}

class WebsocketPluginPublisher implements PluginPublisher {
    client: WebSocket | undefined
    async connect(streamId: string): Promise<void> {
        this.client = new WebSocket(`ws://localhost:${wsPort}/streams/${encodeURIComponent(streamId)}/publish`)
        await waitForEvent(this.client, 'open')
    }
    async publish(msg: object): Promise<unknown> {
        return this.client!.send(JSON.stringify(msg))
    }
    async close(): Promise<void> {
        return this.client!.close()
    }
}

/* eslint-disable class-methods-use-this */
class HttpPluginPublisher implements PluginPublisher {
    async connect(): Promise<void> {
    }
    async publish(msg: object, streamId: string): Promise<unknown> {
        return sendPostRequest(`http://localhost:${httpPort}/streams/${encodeURIComponent(streamId)}`, msg)
    }
    async close(): Promise<void> {
    }
}

const publishMessages = async (streamId: string): Promise<any[]> => {
    const publishers: Record<string, PluginPublisher> = {
        mqtt1: new MqttPluginPublisher(),
        mqtt2: new MqttPluginPublisher(),
        websocket1: new WebsocketPluginPublisher(),
        websocket2: new WebsocketPluginPublisher(),
        http1: new HttpPluginPublisher(),
        http2: new HttpPluginPublisher(),
    }
    await Promise.all(Object.values(publishers).map((publisher) => publisher.connect(streamId)))
    const messages: { index: number, publisher: string }[] = []
    for (const index of range(MESSAGE_COUNT)) {
        messages.push({
            index,
            publisher: sample(Object.keys(publishers)) as any
        })
    }
    let firstMessage = true
    for (const msg of messages) {
        await publishers[msg.publisher].publish(msg, streamId)
        if (firstMessage) {
            firstMessage = false
            await wait(2000) // TODO: Remove after NET-919, where we can grow Propagation.ts buffer size
        }
    }
    await Promise.all(Object.values(publishers).map((publisher) => publisher.close()))
    return messages
}

describe('multiple publisher plugins', () => {

    let broker: Broker
    let privateKey: string
    let streamId: string

    beforeAll(async () => {
        privateKey = await fetchPrivateKeyWithGas()
        const client = await createClient(privateKey)
        const stream = await createTestStream(client, module)
        streamId = stream.id
        await stream.grantPermissions({
            permissions: [StreamPermission.SUBSCRIBE],
            public: true
        })
        await client.destroy()
    }, 30 * 1000)

    beforeEach(async () => {
        broker = await startBroker({
            privateKey,
            httpPort,
            extraPlugins: {
                mqtt: {
                    port: mqttPort
                },
                websocket: {
                    port: wsPort
                },
                http: {},
            },
            wsServerPort: 44409
        })
    }, 15000)

    afterEach(async () => {
        await broker?.stop()
    })

    it('subscribe by StreamrClient', async () => {

        const receivedMessages: Queue<unknown> = new Queue()
        const subscriber = await createClient(fastPrivateKey())
        await subscriber.subscribe(streamId, (message: unknown) => {
            receivedMessages.push(message)
        })

        const messages = await publishMessages(streamId)

        await waitForCondition(() => receivedMessages.size() >= messages.length)
        expect(receivedMessages.items).toIncludeSameMembers(messages)
        await subscriber.destroy()

    }, 10 * 1000)

    it('subscribe by websocket plugin', async () => {

        const receivedMessages: Queue<object> = new Queue()
        const subscriber = new WebSocket(`ws://localhost:${wsPort}/streams/${encodeURIComponent(streamId)}/subscribe`)
        subscriber.on('message', (data: WebSocket.RawData) => {
            const message = data.toString()
            receivedMessages.push(JSON.parse(message))
        })

        const messages = await publishMessages(streamId)

        await waitForCondition(() => receivedMessages.size() >= messages.length)
        expect(receivedMessages.items).toIncludeSameMembers(messages)
        await subscriber.close()

    })

    it('subscribe by mqtt plugin', async () => {

        const receivedMessages: Queue<object> = new Queue()
        const subscriber = await mqtt.connectAsync(`mqtt://localhost:${mqttPort}`)
        subscriber.on('message', (topic: string, message: Buffer) => {
            if (topic === streamId) {
                receivedMessages.push(JSON.parse(message.toString()))
            }
        })
        await subscriber.subscribe(streamId)

        const messages = await publishMessages(streamId)

        await waitForCondition(() => receivedMessages.size() >= messages.length)
        expect(receivedMessages.items).toIncludeSameMembers(messages)
        await subscriber.end(true)
    })
})
