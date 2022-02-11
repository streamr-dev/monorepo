import { Server } from 'http'
import express, { Application } from 'express'
import { wait } from 'streamr-test-utils'

import authFetch from '../../src/authFetch'
import * as utils from '../../src/utils'
import { inspect, format, DEFAULT_INSPECT_OPTS } from '../../src/utils/log'

import { describeRepeats, Debug } from '../test-utils/utils'

const debug = Debug('StreamrClient::test::utils')

interface TestResponse {
    test: string
}

describeRepeats('utils', () => {
    describe('with mock server', () => {
        let session: any
        let expressApp: Application
        let server: Server
        const baseUrl = 'http://127.0.0.1:30000'
        const testUrl = '/some-test-url'

        beforeEach((done) => {
            session = {
                options: {},
                isUnauthenticated() {
                    return false
                },
                getSessionToken: () => {}
            }

            expressApp = express()

            function handle(req: any, res: any) {
                if (req.get('Authorization') !== 'Bearer session-token') {
                    res.sendStatus(401)
                } else {
                    res.status(200).send({
                        test: 'test',
                    })
                }
            }

            expressApp.get(testUrl, (req: any, res: any) => handle(req, res))

            server = expressApp.listen(30000, () => {
                debug('Mock server started on port 30000\n')
                done()
            })
        })

        afterEach(async () => {
            await new Promise((resolve, reject) => {
                server.close((err) => {
                    if (err) {
                        reject(err)
                    } else {
                        resolve(undefined)
                    }
                })
            })
        })

        afterAll(async () => {
            await wait(1000) // wait a moment for server to truly close
        })

        describe('authFetch', () => {
            it('should return normally when valid session token is passed', async () => {
                session.getSessionToken = jest.fn(async () => 'session-token')
                const res = await authFetch<TestResponse>(baseUrl + testUrl, { session })
                expect(session.getSessionToken).toHaveBeenCalledTimes(1)
                expect(res.test).toBeTruthy()
            })

            it('should return 401 error when invalid session token is passed twice', async () => {
                session.getSessionToken = jest.fn(async () => 'invalid-token')
                const onCaught = jest.fn()
                const err = await authFetch<TestResponse>(baseUrl + testUrl, { session }).catch((error) => {
                    onCaught()
                    return error
                })

                expect(session.getSessionToken).toHaveBeenCalledTimes(2)
                expect(err.toString()).toMatch(
                    '401. \'Unauthorized\'',
                )
                expect(err.body).toEqual('Unauthorized')
                expect(onCaught).toHaveBeenCalledTimes(1)
            })

            it('should return normally when valid session token is passed after expired session token', async () => {
                session.getSessionToken = jest.fn()
                    .mockImplementationOnce(async () => 'expired-session-token')
                    .mockImplementationOnce(async () => 'session-token')

                const res = await authFetch<TestResponse>(baseUrl + testUrl, { session })
                expect(session.getSessionToken).toHaveBeenCalledTimes(2)
                expect(res.test).toBeTruthy()
            })
        })
    })

    describe('uuid', () => {
        it('generates different ids', () => {
            expect(utils.uuid('test')).not.toEqual(utils.uuid('test'))
        })
        it('includes text', () => {
            expect(utils.uuid('test')).toContain('test')
        })
        it('increments', () => {
            const uid = utils.uuid('test') // generate new text to ensure count starts at 1
            expect(utils.uuid(uid) < utils.uuid(uid)).toBeTruthy()
        })
    })

    describe('getEndpointUrl', () => {
        it('works', () => {
            const streamId = 'x/y'
            const url = utils.getEndpointUrl('http://example.com', 'abc', streamId, 'def')
            expect(url.toLowerCase()).toBe('http://example.com/abc/x%2fy/def')
        })
    })

    describe('until', () => {
        it('works with sync true', async () => {
            const condition = jest.fn(() => true)
            await utils.until(condition)
            expect(condition).toHaveBeenCalledTimes(1)
        })

        it('works with async true', async () => {
            const condition = jest.fn(async () => true)
            await utils.until(condition)
            expect(condition).toHaveBeenCalledTimes(1)
        })

        it('works with sync false -> true', async () => {
            let calls = 0
            const condition = jest.fn(() => {
                calls += 1
                return calls > 1
            })
            await utils.until(condition)
            expect(condition).toHaveBeenCalledTimes(2)
        })

        it('works with sync false -> true', async () => {
            let calls = 0
            const condition = jest.fn(async () => {
                calls += 1
                return calls > 1
            })
            await utils.until(condition)
            expect(condition).toHaveBeenCalledTimes(2)
        })

        it('can time out', async () => {
            const condition = jest.fn(() => false)
            await expect(async () => {
                await utils.until(condition, 100)
            }).rejects.toThrow('Timeout')
            expect(condition).toHaveBeenCalled()
        })

        it('can set interval', async () => {
            const condition = jest.fn(() => false)
            await expect(async () => {
                await utils.until(condition, 100, 20)
            }).rejects.toThrow('Timeout')
            expect(condition.mock.calls.length).toBeLessThan(7)
            // ideally it should be 5.
            expect(condition.mock.calls.length).toBeGreaterThan(4)
        })
    })

    describe('util/log', () => {
        const longString = 'longString'.repeat(DEFAULT_INSPECT_OPTS.maxStringLength)
        it('inspect limits string length', () => {
            expect(inspect({ longString }).length).toBeLessThan(DEFAULT_INSPECT_OPTS.maxStringLength * 1.2)
        })
        it('format limits string length', () => {
            expect(format('%o', { longString }).length).toBeLessThan(DEFAULT_INSPECT_OPTS.maxStringLength * 1.2)
        })
    })
})
