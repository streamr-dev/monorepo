import { wait } from 'streamr-test-utils'

import { getPublishTestMessages, describeRepeats, fakePrivateKey, createTestStream } from '../utils'
import { StreamrClient } from '../../src/StreamrClient'
import { Defer, pTimeout } from '../../src/utils'

import config from '../../src/ConfigTest'
import { Stream } from '../../src/Stream'
import { StorageNode } from '../../src/StorageNode'

/* eslint-disable no-await-in-loop */

describeRepeats('StreamrClient resends', () => {
    describe('resend', () => {
        let expectErrors = 0 // check no errors by default
        let onError = jest.fn()

        const createClient = (opts: any = {}) => {
            const c = new StreamrClient({
                ...config,
                auth: {
                    privateKey: fakePrivateKey(),
                },
                autoConnect: false,
                autoDisconnect: false,
                maxRetries: 2,
                ...opts,
            })
            return c
        }

        let client: StreamrClient
        let stream: Stream
        let published: any[]
        let publishTestMessages: ReturnType<typeof getPublishTestMessages>

        beforeEach(async () => {
            client = createClient()
            await client.connect()
            expectErrors = 0
            onError = jest.fn()
        })

        afterEach(async () => {
            await wait(0)
            // ensure no unexpected errors
            expect(onError).toHaveBeenCalledTimes(expectErrors)
        })

        afterEach(async () => {
            await wait(500)
            if (client) {
                client.debug('disconnecting after test')
                await client.destroy()
            }
        })

        describe('long resend', () => {
            const LONG_RESEND = 500

            beforeEach(async () => {
                stream = await createTestStream(client, module)

                await stream.addToStorageNode(StorageNode.STREAMR_DOCKER_DEV)

                publishTestMessages = getPublishTestMessages(client, stream)
            }, 300000)

            beforeEach(async () => {
                client.debug(`Publishing ${LONG_RESEND} messages...`)
                published = await publishTestMessages(LONG_RESEND, {
                    waitForLast: true,
                })
                client.debug(`Published ${LONG_RESEND} messages`)
                await client.destroy()
            }, 300000)

            test('receives all messages', async () => {
                // resend from LONG_RESEND messages
                await client.connect()

                const receivedMessages: any[] = []
                const onGotFirstMessage = Defer()
                const sub = await client.resend({
                    stream: stream.id,
                    resend: {
                        from: {
                            timestamp: 0,
                        },
                    },
                }, (msg) => {
                    receivedMessages.push(msg)
                    if (receivedMessages.length === 1) {
                        onGotFirstMessage.resolve(undefined)
                    }
                })

                await pTimeout(onGotFirstMessage, 5000, 'waiting for first resent message')
                client.debug('got first message')
                client.debug('waiting for all messages')
                await sub.onFinally.wait()
                client.debug('subscription done')

                expect(receivedMessages).toEqual(published)
                expect(published.length).toBe(LONG_RESEND)
            }, 300000)
        })
    })
})
