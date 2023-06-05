import { Stream, StreamrClient } from 'streamr-client'
import mqtt from 'async-mqtt'
import { fetchPrivateKeyWithGas, Queue } from '@streamr/test-utils'
import { Broker } from '../../../../src/broker'
import { createClient, startBroker, createTestStream } from '../../../utils'
import { wait } from '@streamr/utils'
import { Wallet } from '@ethersproject/wallet'

const MQTT_PLUGIN_PORT = 12470
const BROKER_CONNECTIONMANAGER_PORT = 40415

jest.setTimeout(60000)

const createMqttClient = () => {
    return mqtt.connectAsync(`mqtt://localhost:${MQTT_PLUGIN_PORT}`)
}

describe('MQTT Bridge', () => {
    let stream: Stream
    let streamrClient: StreamrClient
    let broker: Broker
    let brokerUser: Wallet

    const createSubscriber = async (messageQueue: Queue<any>) => {
        const subscriber = await createMqttClient()
        subscriber.on('message', (_topic, message) => messageQueue.push(JSON.parse(message.toString())))
        subscriber.subscribe(stream.id)
        return subscriber
    }

    beforeAll(async () => {
        brokerUser = new Wallet(await fetchPrivateKeyWithGas())
        broker = await startBroker({
            privateKey: brokerUser.privateKey,
            extraPlugins: {
                mqtt: {
                    port: MQTT_PLUGIN_PORT
                }
            },
            wsServerPort: BROKER_CONNECTIONMANAGER_PORT
        })
    })

    afterAll(async () => {
        await Promise.allSettled([
            broker.stop()
        ])
    })

    beforeEach(async () => {
        streamrClient = await createClient(brokerUser.privateKey)
        stream = await createTestStream(streamrClient, module)
    })

    afterEach(async () => {
        await streamrClient?.destroy()
    })

    test('message published by a MQTT client is delivered only once', async () => {
        const message = {
            foo: Date.now()
        }
        const messageQueue = new Queue<any>()
        const subscriber = await createSubscriber(messageQueue)

        const publisher = await createMqttClient()
        publisher.publish(stream.id, JSON.stringify(message))
        await wait(1000)

        expect(messageQueue.items).toEqual([message])

        await Promise.allSettled([
            subscriber.end(true),
            publisher.end(true)
        ])
    })

    test('message published by a StreamrClient is delivered', async () => {
        const expected = {
            foo: Date.now()
        }
        const messageQueue = new Queue<any>()
        const subscriber = await createSubscriber(messageQueue)
        await streamrClient.publish(stream.id, expected)

        const actual = await messageQueue.pop(10000)
        expect(actual).toEqual(expected)

        await subscriber.end(true)
    })

    test('message should be delivered once per client if subscribed by multiple clients', async () => {
        const expected = {
            foo: Date.now()
        }
        const messageQueue1 = new Queue<any>()
        const messageQueue2 = new Queue<any>()
        const subscriber1 = await createSubscriber(messageQueue1)
        const subscriber2 = await createSubscriber(messageQueue2)
        await streamrClient.publish(stream.id, expected)

        const actual1 = await messageQueue1.pop(10000)
        const actual2 = await messageQueue2.pop()
        expect(actual1).toEqual(expected)
        expect(actual2).toEqual(expected)

        await Promise.allSettled([
            subscriber1.end(true),
            subscriber2.end(true)
        ])
    })

    it('subscription should not be unsubscribed if it was not subscribed by that client', async () => {
        const expected = {
            foo: Date.now()
        }
        const messageQueue = new Queue<any>()
        const subscriber1 = await createSubscriber(messageQueue)
        const subscriber2 = await createMqttClient()
        subscriber2.unsubscribe(stream.id)
        await streamrClient.publish(stream.id, expected)

        const actual = await messageQueue.pop(10000)

        expect(actual).toEqual(expected)

        await Promise.allSettled([
            subscriber1.end(true),
            subscriber2.end(true)
        ])
    })

    test('message should be delivered to remaining subscribers if one subscriber unsubscribes', async () => {
        const expected = {
            foo: Date.now()
        }
        const messageQueue1 = new Queue<any>()
        const messageQueue2 = new Queue<any>()
        const subscriber1 = await createSubscriber(messageQueue1)
        const subscriber2 = await createSubscriber(messageQueue2)
        subscriber2.unsubscribe(stream.id)
        await streamrClient.publish(stream.id, expected)

        const actual1 = await messageQueue1.pop(15000)
        expect(actual1).toEqual(expected)
        expect(messageQueue2.items).toEqual([])

        await Promise.allSettled([
            subscriber1.end(true),
            subscriber2.end(true)
        ])
    })
})
