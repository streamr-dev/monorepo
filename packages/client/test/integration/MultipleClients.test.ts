import { wait, waitForCondition } from 'streamr-test-utils'

import {
    getCreateClient, getPublishTestMessages, getWaitForStorage, describeRepeats, uid, fakePrivateKey, addAfterFn, createTestStream
} from '../utils'
import { StreamrClient } from '../../src/StreamrClient'
import { counterId } from '../../src/utils'
import { StorageNode } from '../../src/StorageNode'
import { Stream, StreamOperation } from '../../src/Stream'

// this number should be at least 10, otherwise late subscribers might not join
// in time to see any realtime messages
const MAX_MESSAGES = 10

describeRepeats('PubSub with multiple clients', () => {
    let stream: Stream
    let mainClient: StreamrClient
    let otherClient: StreamrClient
    let privateKey: string
    let errors: Error[] = []

    const createClient = getCreateClient()
    const addAfter = addAfterFn()

    beforeEach(async () => {
        errors = []
        privateKey = fakePrivateKey()

        mainClient = createClient({
            id: 'main',
            auth: {
                privateKey
            }
        })
        // mainClient.on('error', getOnError(errors))
        stream = await createTestStream(mainClient, module)
        await stream.addToStorageNode(StorageNode.STREAMR_DOCKER_DEV)
    })

    afterEach(async () => {
        expect(errors).toEqual([])
    })

    async function createPublisher(opts = {}) {
        const pubClient = createClient({
            auth: {
                privateKey: fakePrivateKey(),
            },
            ...opts,
        })
        const publisherId = (await pubClient.getAddress()).toLowerCase()

        addAfter(async () => {
            counterId.clear(publisherId) // prevent overflows in counter
        })

        // pubClient.on('error', getOnError(errors))
        const pubUser = await pubClient.getUserInfo()
        await stream.grantPermission(StreamOperation.STREAM_GET, pubUser.username)
        await stream.grantPermission(StreamOperation.STREAM_PUBLISH, pubUser.username)
        // needed to check last
        await stream.grantPermission(StreamOperation.STREAM_SUBSCRIBE, pubUser.username)
        await pubClient.session.getSessionToken()
        await pubClient.connect()

        return pubClient
    }

    async function createSubscriber(opts = {}) {
        const client = createClient({
            id: 'subscriber',
            auth: {
                privateKey
            },
            ...opts,
        })

        // client.on('error', getOnError(errors))
        await client.session.getSessionToken()
        const user = await client.getUserInfo()

        await stream.grantPermission(StreamOperation.STREAM_GET, user.username)
        await stream.grantPermission(StreamOperation.STREAM_SUBSCRIBE, user.username)
        await client.connect()
        return client
    }

    function checkMessages<T>(published: Record<string, T[]>, received: Record<string, T[]>) {
        for (const [key, msgs] of Object.entries(published)) {
            expect(received[key]).toEqual(msgs)
        }
    }

    describe('can get messages published from other client', () => {
        test('it works', async () => {
            otherClient = await createSubscriber()
            await mainClient.connect()

            const receivedMessagesOther: any[] = []
            const receivedMessagesMain: any[] = []
            // subscribe to stream from other client instance
            await otherClient.subscribe({
                stream: stream.id,
            }, (msg) => {
                receivedMessagesOther.push(msg)
            })
            // subscribe to stream from main client instance
            await mainClient.subscribe({
                stream: stream.id,
            }, (msg) => {
                receivedMessagesMain.push(msg)
            })
            const message = {
                msg: uid('message'),
            }
            // publish message on main client
            await mainClient.publish(stream, message)
            await wait(5000)
            // messages should arrive on both clients?
            expect(receivedMessagesMain).toEqual([message])
            expect(receivedMessagesOther).toEqual([message])
        }, 60000)
        /*
        describe('subscriber disconnects after each message (uses resend)', () => {
            test('single subscriber', async () => {
                const maxMessages = MAX_MESSAGES + Math.floor(Math.random() * MAX_MESSAGES * 0.25)
                otherClient = await createSubscriber()
                await mainClient.connect()

                const receivedMessagesOther: any[] = []
                const msgs = receivedMessagesOther
                const otherDone = Defer()
                // subscribe to stream from other client instance
                await otherClient.subscribe({
                    stream: stream.id,
                }, (msg) => {
                    receivedMessagesOther.push(msg)
                    onConnectionMessage()

                    if (receivedMessagesOther.length === maxMessages) {
                        cancelled = true
                        otherDone.resolve(undefined)
                    }
                })

                let cancelled = false
                const localOtherClient = otherClient // capture so no chance of disconnecting wrong client
                let reconnected = Defer()

                const disconnect = async () => {
                    if (localOtherClient !== otherClient) {
                        throw new Error('not equal')
                    }

                    if (cancelled || msgs.length === MAX_MESSAGES) {
                        reconnected.resolve(undefined)
                        return
                    }

                    await wait(500) // some backend bug causes subs to stop working if we disconnect too quickly
                    if (cancelled || msgs.length === MAX_MESSAGES) {
                        reconnected.resolve(undefined)
                        return
                    }

                    if (localOtherClient !== otherClient) {
                        throw new Error('not equal')
                    }
                    await localOtherClient.nextConnection()
                    if (cancelled || msgs.length === MAX_MESSAGES) {
                        reconnected.resolve(undefined)
                        return
                    }

                    if (localOtherClient !== otherClient) {
                        throw new Error('not equal')
                    }
                    localOtherClient.connection.socket.close()
                    // wait for reconnection before possibly disconnecting again
                    await localOtherClient.nextConnection()
                    const p = reconnected
                    p.resolve(undefined)
                    reconnected = Defer()
                }

                const onConnectionMessage = jest.fn(() => {
                    // disconnect after every message
                    disconnect()
                })

                const onConnected = jest.fn()
                const onDisconnected = jest.fn()
                otherClient.connection.on('connected', onConnected)
                otherClient.connection.on('disconnected', onDisconnected)
                addAfter(() => {
                    otherClient.connection.off('connected', onConnected)
                    otherClient.connection.off('disconnected', onDisconnected)
                })
                let t = 0
                const publishTestMessages = getPublishTestMessages(mainClient, {
                    stream,
                    delay: 600,
                    timestamp: () => {
                        t += 1
                        return t
                    },
                    waitForLast: true,
                    waitForLastTimeout: 10000,
                    waitForLastCount: maxMessages,
                })

                const published = await publishTestMessages(maxMessages)
                await otherDone

                expect(receivedMessagesOther).toEqual(published)
            }, 60000)

            test('publisher also subscriber', async () => {
                const maxMessages = MAX_MESSAGES + Math.floor(Math.random() * MAX_MESSAGES * 0.25)
                otherClient = await createSubscriber()
                await mainClient.connect()

                const receivedMessagesOther = []
                const msgs = receivedMessagesOther
                const receivedMessagesMain = []
                const mainDone = Defer()
                const otherDone = Defer()
                // subscribe to stream from other client instance
                await otherClient.subscribe({
                    stream: stream.id,
                }, (msg) => {
                    otherClient.debug('other %d of %d', receivedMessagesOther.length, maxMessages, msg.value)
                    receivedMessagesOther.push(msg)

                    if (receivedMessagesOther.length === maxMessages) {
                        otherDone.resolve()
                    }
                })

                const disconnect = pLimitFn(async () => {
                    if (msgs.length === maxMessages) { return }
                    otherClient.debug('disconnecting...', msgs.length)
                    otherClient.connection.socket.close()
                    // wait for reconnection before possibly disconnecting again
                    await otherClient.nextConnection()
                    otherClient.debug('reconnected...', msgs.length)
                })

                const onConnectionMessage = jest.fn(() => {
                    disconnect.clear()
                    // disconnect after every message
                    disconnect()
                })

                otherClient.connection.on(ControlMessage.TYPES.BroadcastMessage, onConnectionMessage)
                otherClient.connection.on(ControlMessage.TYPES.UnicastMessage, onConnectionMessage)
                // subscribe to stream from main client instance
                await mainClient.subscribe({
                    stream: stream.id,
                }, (msg) => {
                    mainClient.debug('main %d of %d', receivedMessagesOther.length, maxMessages, msg.value)
                    receivedMessagesMain.push(msg)
                    if (receivedMessagesMain.length === maxMessages) {
                        mainDone.resolve()
                    }
                })

                let t = 0

                const publishTestMessages = getPublishTestMessages(mainClient, {
                    stream,
                    delay: 600,
                    waitForLast: true,
                    waitForLastTimeout: 10000,
                    waitForLastCount: maxMessages,
                    timestamp: () => {
                        t += 1
                        return t
                    },
                })
                const published = await publishTestMessages(maxMessages)
                mainClient.debug('publish done')
                mainDone.then(() => mainClient.debug('done')).catch(() => {})
                otherDone.then(() => otherClient.debug('done')).catch(() => {})
                await mainDone
                await otherDone

                // messages should arrive on both clients?
                expect(receivedMessagesMain).toEqual(published)
                expect(receivedMessagesOther).toEqual(published)
            }, 60000)
        })
        */
    })

    describe('multiple publishers', () => {
        test('works with multiple publishers on a single stream', async () => {
            // this creates two subscriber clients and multiple publisher clients
            // all subscribing and publishing to same stream
            await mainClient.session.getSessionToken()
            await mainClient.connect()

            otherClient = await createSubscriber()

            const receivedMessagesOther: Record<string, any[]> = {}
            const receivedMessagesMain: Record<string, any[]> = {}
            // subscribe to stream from other client instance
            await otherClient.subscribe({
                stream: stream.id,
            }, (msg, streamMessage) => {
                const msgs = receivedMessagesOther[streamMessage.getPublisherId().toLowerCase()] || []
                msgs.push(msg)
                receivedMessagesOther[streamMessage.getPublisherId().toLowerCase()] = msgs
            })

            // subscribe to stream from main client instance
            await mainClient.subscribe({
                stream: stream.id,
            }, (msg, streamMessage) => {
                const msgs = receivedMessagesMain[streamMessage.getPublisherId().toLowerCase()] || []
                msgs.push(msg)
                receivedMessagesMain[streamMessage.getPublisherId().toLowerCase()] = msgs
            })

            /* eslint-disable no-await-in-loop */
            const publishers = []
            for (let i = 0; i < 3; i++) {
                publishers.push(await createPublisher({
                    id: `publisher-${i}`,
                }))
            }
            /* eslint-enable no-await-in-loop */
            const published: Record<string, any[]> = {}
            await Promise.all(publishers.map(async (pubClient) => {
                const publisherId = (await pubClient.getAddress()).toLowerCase()
                addAfter(() => {
                    counterId.clear(publisherId) // prevent overflows in counter
                })
                const publishTestMessages = getPublishTestMessages(pubClient, stream, {
                    // delay: 500 + Math.random() * 1500,
                    waitForLast: true,
                    waitForLastTimeout: 20000,
                    waitForLastCount: MAX_MESSAGES * publishers.length,
                    createMessage: ({ batchId }) => ({
                        batchId,
                        value: counterId(publisherId),
                    }),
                })
                published[publisherId] = await publishTestMessages(MAX_MESSAGES)
            }))

            await waitForCondition(() => {
                try {
                    checkMessages(published, receivedMessagesMain)
                    checkMessages(published, receivedMessagesOther)
                    return true
                } catch (err) {
                    return false
                }
            }, 25000).catch((err) => {
                checkMessages(published, receivedMessagesMain)
                checkMessages(published, receivedMessagesOther)
                throw err
            })

            checkMessages(published, receivedMessagesMain)
            checkMessages(published, receivedMessagesOther)
        }, 80000)

        test('works with multiple publishers on one stream with late subscriber', async () => {
            // this creates two subscriber clients and multiple publisher clients
            // all subscribing and publishing to same stream
            // the otherClient subscribes after the 3rd message hits storage
            otherClient = await createSubscriber()
            await mainClient.session.getSessionToken()
            await mainClient.connect()

            const receivedMessagesOther: Record<string, any[]> = {}
            const receivedMessagesMain: Record<string, any[]> = {}

            // subscribe to stream from main client instance
            const mainSub = await mainClient.subscribe({
                stream: stream.id,
            }, (msg, streamMessage) => {
                const key = streamMessage.getPublisherId().toLowerCase()
                const msgs = receivedMessagesMain[key] || []
                msgs.push(msg)
                receivedMessagesMain[key] = msgs
                if (Object.values(receivedMessagesMain).every((m) => m.length === MAX_MESSAGES)) {
                    mainSub.unsubscribe()
                }
            })

            /* eslint-disable no-await-in-loop */
            const publishers = []
            for (let i = 0; i < 3; i++) {
                publishers.push(await createPublisher({
                    id: `publisher-${i}`,
                }))
            }

            /* eslint-enable no-await-in-loop */
            let counter = 0
            const published: Record<string, any[]> = {}
            await Promise.all(publishers.map(async (pubClient) => {
                const waitForStorage = getWaitForStorage(pubClient, {
                    stream,
                    timeout: 15000,
                    count: MAX_MESSAGES * publishers.length,
                })

                const publisherId = (await pubClient.getAddress()).toLowerCase()
                addAfter(() => {
                    counterId.clear(publisherId) // prevent overflows in counter
                })

                const publishTestMessages = getPublishTestMessages(pubClient, stream, {
                    waitForLast: true,
                    waitForLastTimeout: 15000,
                    waitForLastCount: MAX_MESSAGES * publishers.length,
                    delay: 500 + Math.random() * 1000,
                    createMessage: (msg) => ({
                        ...msg,
                        publisherId,
                    }),
                })

                async function addLateSubscriber() {
                    // late subscribe to stream from other client instance
                    const lateSub = await otherClient.subscribe({
                        stream: stream.id,
                        last: MAX_MESSAGES * publishers.length,
                    }, (msg, streamMessage) => {
                        const key = streamMessage.getPublisherId().toLowerCase()
                        const msgs = receivedMessagesOther[key] || []
                        msgs.push(msg)
                        receivedMessagesOther[key] = msgs
                    })

                    addAfter(async () => {
                        await lateSub.unsubscribe()
                    })
                }

                published[publisherId] = await publishTestMessages(MAX_MESSAGES, {
                    waitForLast: true,
                    async afterEach(streamMessage) {
                        counter += 1
                        if (counter === 3) {
                            await waitForStorage(streamMessage) // make sure lastest message has hit storage
                            await addLateSubscriber()
                        }
                    }
                })
            }))

            await waitForCondition(() => {
                try {
                    checkMessages(published, receivedMessagesMain)
                    checkMessages(published, receivedMessagesOther)
                    return true
                } catch (err) {
                    return false
                }
            }, 20000, 300).catch((err) => {
                // convert timeout to actual error
                checkMessages(published, receivedMessagesMain)
                checkMessages(published, receivedMessagesOther)
                throw err
            })
        }, 60000)
    })

    test('works with multiple publishers on one stream', async () => {
        await mainClient.getSessionToken()
        await mainClient.connect()

        otherClient = createClient({
            auth: {
                privateKey
            }
        })
        await otherClient.getSessionToken()
        const otherUser = await otherClient.getUserInfo()
        await stream.grantPermission(StreamOperation.STREAM_GET, otherUser.username)
        await stream.grantPermission(StreamOperation.STREAM_SUBSCRIBE, otherUser.username)
        await otherClient.connect()

        const receivedMessagesOther: Record<string, any[]> = {}
        const receivedMessagesMain: Record<string, any[]> = {}
        // subscribe to stream from other client instance
        await otherClient.subscribe({
            stream: stream.id,
        }, (msg, streamMessage) => {
            const key = streamMessage.getPublisherId().toLowerCase()
            const msgs = receivedMessagesOther[key] || []
            msgs.push(msg)
            receivedMessagesOther[key] = msgs
        })

        // subscribe to stream from main client instance
        await mainClient.subscribe({
            stream: stream.id,
        }, (msg, streamMessage) => {
            const key = streamMessage.getPublisherId().toLowerCase()
            const msgs = receivedMessagesMain[key] || []
            msgs.push(msg)
            receivedMessagesMain[key] = msgs
        })

        /* eslint-disable no-await-in-loop */
        const publishers = []
        for (let i = 0; i < 1; i++) {
            publishers.push(await createPublisher())
        }

        /* eslint-enable no-await-in-loop */
        const published: Record<string, any[]> = {}
        await Promise.all(publishers.map(async (pubClient) => {
            const publisherId = (await pubClient.getAddress()).toLowerCase()
            const publishTestMessages = getPublishTestMessages(pubClient, stream, {
                waitForLast: true,
                waitForLastTimeout: 15000,
            })

            await publishTestMessages(MAX_MESSAGES, {
                // delay: 500 + Math.random() * 1500,
                afterEach(msg) {
                    published[publisherId] = published[publisherId] || []
                    published[publisherId].push(msg.getParsedContent())
                }
            })
        }))

        await waitForCondition(() => {
            try {
                checkMessages(published, receivedMessagesMain)
                checkMessages(published, receivedMessagesOther)
                return true
            } catch (err) {
                return false
            }
        }, 25000).catch(() => {
            checkMessages(published, receivedMessagesMain)
            checkMessages(published, receivedMessagesOther)
        })
    }, 40000)

    test('works with multiple publishers on one stream with late subscriber', async () => {
        const published: Record<string, any[]> = {}
        await mainClient.session.getSessionToken()
        await mainClient.connect()

        otherClient = createClient({
            auth: {
                privateKey
            }
        })
        await otherClient.session.getSessionToken()
        const otherUser = await otherClient.getUserInfo()

        await stream.grantPermission(StreamOperation.STREAM_GET, otherUser.username)
        await stream.grantPermission(StreamOperation.STREAM_SUBSCRIBE, otherUser.username)
        await otherClient.connect()

        const receivedMessagesOther: Record<string, any[]> = {}
        const receivedMessagesMain: Record<string, any[]> = {}

        // subscribe to stream from main client instance
        const mainSub = await mainClient.subscribe({
            stream: stream.id,
        }, (msg, streamMessage) => {
            const key = streamMessage.getPublisherId().toLowerCase()
            const msgs = receivedMessagesMain[key] || []
            msgs.push(msg)
            receivedMessagesMain[key] = msgs
            if (Object.values(receivedMessagesMain).every((m) => m.length === MAX_MESSAGES)) {
                mainSub.cancel()
            }
        })

        /* eslint-disable no-await-in-loop */
        const publishers = []
        for (let i = 0; i < 3; i++) {
            publishers.push(await createPublisher())
        }

        let counter = 0
        /* eslint-enable no-await-in-loop */
        await Promise.all(publishers.map(async (pubClient) => {
            const waitForStorage = getWaitForStorage(pubClient, {
                stream,
                timeout: 15000,
                count: MAX_MESSAGES * publishers.length,
            })

            const publisherId = (await pubClient.getAddress()).toString().toLowerCase()
            const publishTestMessages = getPublishTestMessages(pubClient, stream, {
                waitForLast: true,
                waitForLastTimeout: 15000,
                waitForLastCount: MAX_MESSAGES * publishers.length,
                delay: 500 + Math.random() * 1000,
            })

            async function addLateSubscriber() {
                // late subscribe to stream from other client instance
                const lateSub = await otherClient.subscribe({
                    stream: stream.id,
                    last: MAX_MESSAGES * publishers.length,
                }, (msg, streamMessage) => {
                    const key = streamMessage.getPublisherId().toLowerCase()
                    const msgs = receivedMessagesOther[key] || []
                    msgs.push(msg)
                    receivedMessagesOther[key] = msgs
                })

                addAfter(async () => {
                    await lateSub.unsubscribe()
                })
            }

            await publishTestMessages(MAX_MESSAGES, {
                async afterEach(streamMessage) {
                    published[publisherId] = published[publisherId] || []
                    published[publisherId].push(streamMessage.getParsedContent())
                    counter += 1
                    if (counter === 3) {
                        await waitForStorage(streamMessage) // make sure lastest message has hit storage
                        // late subscribe to stream from other client instance
                        await addLateSubscriber()
                    }
                }
            })
        }))

        await waitForCondition(() => {
            try {
                checkMessages(published, receivedMessagesMain)
                checkMessages(published, receivedMessagesOther)
                return true
            } catch (err) {
                return false
            }
        }, 25000, 300).catch(() => {
            checkMessages(published, receivedMessagesMain)
            checkMessages(published, receivedMessagesOther)
        })
    }, 80000)
})
