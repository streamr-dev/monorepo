import mqtt, { AsyncMqttClient } from 'async-mqtt'
import { MqttServer } from '../../../../src/plugins/mqtt/MqttServer'

const MQTT_PORT = 1883

const createClient = (apiKey?: string): Promise<AsyncMqttClient> => {
    return mqtt.connectAsync('mqtt://localhost:' + MQTT_PORT, (apiKey !== undefined) ? {
        username: '',
        password: apiKey,
    } : undefined)
}

describe('MQTT server', () => {
    const REQUIRED_API_KEY = 'required-api-key'
    let server: MqttServer
    let client: AsyncMqttClient

    describe('authentication required', () => {

        beforeEach(async () => {
            server = new MqttServer(MQTT_PORT, {
                isValidAuthentication: (apiKey?: string) => (apiKey === REQUIRED_API_KEY)
            })
            await server.start()
        })

        afterEach(async () => {
            await client?.end(true)
            await server?.stop()
        })

        it('connect with required authentication', async () => {
            client = await createClient(REQUIRED_API_KEY)
            expect(client).toBeDefined()
        })

        it('connect with invalid authentication', async () => { 
            return expect(() => createClient('invalid-api-key')).rejects.toThrow('Bad username or password')
        })

        it('connect without authentication', async () => { 
            return expect(() => createClient(undefined)).rejects.toThrow('Not authorized')
        })

    })

    describe('authentication not required', () => {
        let client: AsyncMqttClient
        let server: MqttServer

        beforeEach(async () => {
            server = new MqttServer(MQTT_PORT, {
                isValidAuthentication: () => true
            })
            await server.start()
        })

        afterEach(async () => {
            await client?.end(true)
            await server?.stop()
        })

        it('connect without authentication', async () => {
            client = await createClient(undefined)
            expect(client).toBeDefined()
        })

        it('connect with some authentication', async () => { 
            client = await createClient('ignorable-api-key')
            expect(client).toBeDefined()
        })

    })

})
