import WebSocket from 'ws'
import { Queue } from '@streamr/test-utils'
import { waitForEvent } from '@streamr/utils'
import { Message } from '../../../../src/helpers/PayloadFormat'
import { createMessagingPluginTest } from '../../createMessagingPluginTest'

jest.setTimeout(30000)

const WEBSOCKET_PORT = 12400
const TRACKER_PORT = 12402

createMessagingPluginTest('websocket', 
    {
        createClient: async (action: 'publish' | 'subscribe', streamId: string, apiKey: string): Promise<WebSocket> => {
            const client = new WebSocket(`ws://localhost:${WEBSOCKET_PORT}/streams/${encodeURIComponent(streamId)}/${action}?apiKey=${apiKey}`)
            await waitForEvent(client, 'open')
            return client
        },
        closeClient: async (client: WebSocket): Promise<void> => {
            client.close()
        },
        publish: async (msg: Message, _streamId: string, client: WebSocket): Promise<void> => {
            client.send(JSON.stringify(msg))
        },
        subscribe: async (messageQueue: Queue<Message>, _streamId: string, client: WebSocket): Promise<void> => {
            client.on('message', (data: WebSocket.RawData) => {
                const payload = data.toString()
                messageQueue.push(JSON.parse(payload))
            })
        }
    },
    {
        plugin: WEBSOCKET_PORT,
        tracker: TRACKER_PORT
    },
    module
)
