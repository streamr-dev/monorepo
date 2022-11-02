import 'reflect-metadata'

import { finished } from 'stream/promises'
import { WebStreamToNodeStream } from '../../src/utils/WebStreamToNodeStream'
import { Msg } from '../test-utils/publish'

const version = process.version.slice(1).split('.').map((v) => Number.parseInt(v, 10))
describe('WebStreamToNodeStream', () => {
    // webstreams only in 16.5+
    if (version[0] < 16 && version[1] < 5) {
        test.skip('node version too low, requires v16.5+')
        return
    }

    it('works', async () => {
        const WebStream: any = await import('node:stream/web')
        const Timers = await import('node:timers/promises')
        const published: ReturnType<typeof Msg>[] = []
        const webStream = new WebStream.ReadableStream({
            async start(controller: any) {
                for await (const _ of Timers.setInterval(100)) {
                    const msg = Msg()
                    published.push(msg)
                    controller.enqueue(msg)
                    if (published.length === 5) {
                        controller.close()
                        break
                    }
                }
            }
        })

        const nodeStream = WebStreamToNodeStream(webStream, { objectMode: true })
        expect(typeof nodeStream.pipe).toBe('function')
        const received = []
        for await (const msg of nodeStream) {
            received.push(msg)
        }
        expect(received).toEqual(published)
        expect(nodeStream.readableEnded).toBeTruthy()
    })

    it('can work with small buffer', async () => {
        const WebStream: any = await import('node:stream/web')
        const Timers = await import('node:timers/promises')
        const published: ReturnType<typeof Msg>[] = []
        const webStream = new WebStream.ReadableStream({
            async start(controller: any) {
                for await (const _ of Timers.setInterval(100)) {
                    const msg = Msg()
                    published.push(msg)
                    controller.enqueue(msg)
                    if (published.length === 5) {
                        controller.close()
                        break
                    }
                }
            }
        })

        const nodeStream = WebStreamToNodeStream(webStream, { objectMode: true, highWaterMark: 1 })
        expect(typeof nodeStream.pipe).toBe('function')
        const received = []
        for await (const msg of nodeStream) {
            received.push(msg)
        }
        expect(received).toEqual(published)
        expect(nodeStream.readableEnded).toBeTruthy()
    })

    it('can work with errors', async () => {
        const WebStream: any = await import('node:stream/web')
        const Timers = await import('node:timers/promises')
        const published: ReturnType<typeof Msg>[] = []
        const webStream = new WebStream.ReadableStream({
            async start(controller: any) {
                for await (const _ of Timers.setInterval(100)) {
                    const msg = Msg()
                    published.push(msg)
                    controller.enqueue(msg)
                    if (published.length === 5) {
                        controller.close()
                        break
                    }
                }
            }
        })

        const err = new Error('expected')
        const received: any[] = []
        const nodeStream = WebStreamToNodeStream(webStream, {
            objectMode: true,
            highWaterMark: 1,
            transform(chunk, _enc, done) {
                if (received.length === 3) {
                    done(err)
                    return
                }
                this.push(chunk)
                done()
            }
        })
        expect(typeof nodeStream.pipe).toBe('function')
        await expect(async () => {
            for await (const msg of nodeStream) {
                received.push(msg)
            }
        }).rejects.toThrow(err)
        await expect(finished(nodeStream)).rejects.toThrow(err)
        expect(received).toEqual(published.slice(0, 3))
        expect(nodeStream.readable).not.toBeTruthy()
        expect(nodeStream.destroyed).toBeTruthy()
    })
})
