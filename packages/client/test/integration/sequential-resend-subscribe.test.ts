import 'reflect-metadata'

import { collect, waitForCondition } from '@streamr/utils'
import { Message } from '../../src/Message'
import { StreamPermission } from '../../src/permission'
import { Stream } from '../../src/Stream'
import { StreamrClient } from '../../src/StreamrClient'
import { FakeEnvironment } from '../test-utils/fake/FakeEnvironment'
import { getPublishTestStreamMessages, getWaitForStorage, Msg } from '../test-utils/publish'
import { createTestStream } from '../test-utils/utils'

const MAX_MESSAGES = 5
const ITERATIONS = 4

describe('sequential resend subscribe', () => {

    let publisher: StreamrClient
    let subscriber: StreamrClient
    let stream: Stream

    let publishTestMessages: ReturnType<typeof getPublishTestStreamMessages>
    let waitForStorage: (msg: Message) => Promise<void> = async () => {}

    let published: Message[] = [] // keeps track of stream message data so we can verify they were resent
    let environment: FakeEnvironment

    beforeAll(async () => {
        environment = new FakeEnvironment()
        publisher = environment.createClient()
        subscriber = environment.createClient()
        stream = await createTestStream(publisher, module)
        await stream.grantPermissions({ permissions: [StreamPermission.SUBSCRIBE], public: true })
        const storageNode = await environment.startStorageNode()
        await stream.addToStorageNode(storageNode.getAddress())
        publishTestMessages = getPublishTestStreamMessages(publisher, stream)
        await stream.grantPermissions({
            user: await subscriber.getAddress(),
            permissions: [StreamPermission.SUBSCRIBE]
        })
        waitForStorage = getWaitForStorage(publisher, {
            stream
        })
        // initialize resend data by publishing some messages and waiting for
        // them to land in storage
        published = await publishTestMessages(MAX_MESSAGES, {
            waitForLast: true,
            timestamp: 111111,
        })
    })

    afterAll(async () => {
        await environment.destroy()
    })

    afterEach(async () => {
        // ensure last message is in storage
        const last = published[published.length - 1]
        await waitForStorage(last)
    })

    for (let i = 0; i < ITERATIONS; i++) {
        // keep track of which messages were published in previous tests
        // so we can check that they exist in resends of subsequent tests
        // publish messages with timestamps like 222222, 333333, etc so the
        // sequencing is clearly visible in logs
        const id = (i + 2) * 111111 // start at 222222
        test(`test ${id}`, async () => {
            const sub = await subscriber.subscribe({
                streamId: stream.id,
                resend: {
                    last: published.length,
                }
            })

            const onResent = jest.fn()
            sub.once('resendComplete', onResent)

            const expectedMessageCount = published.length + 1 // the realtime message which we publish next
            const receivedMsgsPromise = collect(sub, expectedMessageCount)
            await waitForCondition(() => onResent.mock.calls.length > 0)
            const streamMessage = await publisher.publish(stream.id, Msg(), { // should be realtime
                timestamp: id
            })
            // keep track of published messages so we can check they are resent in next test(s)
            published.push(streamMessage)
            const receivedMsgs = await receivedMsgsPromise
            expect(receivedMsgs).toHaveLength(expectedMessageCount)
            expect(receivedMsgs.map((m) => m.signature)).toEqual(published.map((m) => m.signature))
        })
    }
})
