import 'reflect-metadata'

import { wait } from '@streamr/utils'
import { TheGraphClient } from '../../src/utils/TheGraphClient'
import { mockLoggerFactory } from '../test-utils/utils'

const POLL_INTERVAL = 50
const INDEXING_INTERVAL = 100
const MOCK_QUERY = { query: 'mock-query' }

interface IndexState {
    blockNumber: number
    queryResult: any
}

class EmulatedTheGraphIndex {

    private states: IndexState[]
    private timer: NodeJS.Timer | undefined

    constructor(states: IndexState[]) {
        this.states = states
    }

    getState(): IndexState {
        return this.states[0]
    }

    start(): void {
        this.timer = setInterval(() => {
            if (this.states.length > 1) {
                this.states = this.states.slice(1)
            }
        }, INDEXING_INTERVAL)
    }

    stop(): void {
        clearInterval(this.timer)
    }
}

describe('TheGraphClient', () => {

    let theGraphIndex: EmulatedTheGraphIndex
    let sendQuery: jest.Mock<Promise<any>, []>
    let getIndexBlockNumber: jest.Mock<Promise<number>, []>
    let client: Pick<TheGraphClient, 'sendQuery' | 'updateRequiredBlockNumber'>

    beforeEach(() => {
        theGraphIndex = new EmulatedTheGraphIndex([{
            blockNumber: 0,
            queryResult: {
                foo: 'result-0'
            }
        }, {
            blockNumber: 2,
            queryResult: {
                foo: 'result-2'
            }
        }, {
            blockNumber: 4,
            queryResult: {
                foo: 'result-4'
            }
        }, {
            blockNumber: 7,
            queryResult: {
                foo: 'result-7'
            }
        }, {
            blockNumber: 8,
            queryResult: {
                foo: 'result-8'
            }
        }])
        sendQuery = jest.fn().mockImplementation((_query: string) => {
            const state = theGraphIndex.getState()
            return state.queryResult
        })
        getIndexBlockNumber = jest.fn().mockImplementation(() => {
            return theGraphIndex.getState().blockNumber
        })
        client = new TheGraphClient(
            mockLoggerFactory(),
            undefined as any,
            {
                _timeouts: {
                    theGraph: {
                        timeout: 10 * INDEXING_INTERVAL,
                        retryInterval: POLL_INTERVAL
                    }
                }
            } as any
        )
        // @ts-expect-error private
        client.delegate = {
            sendQuery,
            getIndexBlockNumber
        } as any
    })

    afterEach(() => {
        theGraphIndex.stop()
    })

    it('no synchronization', async () => {
        const response = await client.sendQuery(MOCK_QUERY)
        expect(response).toEqual({
            foo: 'result-0'
        })
        expect(getIndexBlockNumber).not.toBeCalled()
        expect(sendQuery).toBeCalledTimes(1)
        expect(sendQuery).toBeCalledWith(MOCK_QUERY)
    })

    it('happy path', async () => {
        client.updateRequiredBlockNumber(4)
        const responsePromise = client.sendQuery(MOCK_QUERY)
        theGraphIndex.start()
        expect(await responsePromise).toEqual({
            foo: 'result-4'
        })
        expect(sendQuery).toBeCalledTimes(1)
        expect(sendQuery).toBeCalledWith(MOCK_QUERY)
    })

    it('required block number is not a poll result', async () => {
        client.updateRequiredBlockNumber(3)
        const responsePromise = client.sendQuery(MOCK_QUERY)
        theGraphIndex.start()
        expect(await responsePromise).toEqual({
            foo: 'result-4'
        })
        expect(sendQuery).toBeCalledTimes(1)
        expect(sendQuery).toBeCalledWith(MOCK_QUERY)
    })

    it('multiple queries for same block', async () => {
        client.updateRequiredBlockNumber(7)
        const responsePromise = Promise.all([
            client.sendQuery(MOCK_QUERY),
            client.sendQuery(MOCK_QUERY)
        ])
        theGraphIndex.start()
        const responses = await responsePromise
        expect(responses).toHaveLength(2)
        expect(responses[0]).toEqual({
            foo: 'result-7'
        })
        expect(responses[1]).toEqual({
            foo: 'result-7'
        })
        expect(sendQuery).toBeCalledTimes(2)
        expect(sendQuery).toBeCalledWith(MOCK_QUERY)
    })

    it('multiple queries for different blocks', async () => {
        client.updateRequiredBlockNumber(7)
        const responsePromise1 = client.sendQuery(MOCK_QUERY)
        client.updateRequiredBlockNumber(8)
        const responsePromise2 = client.sendQuery(MOCK_QUERY)
        theGraphIndex.start()
        const responses = await Promise.all([responsePromise1, responsePromise2])
        expect(responses).toHaveLength(2)
        expect(responses[0]).toEqual({
            foo: 'result-7'
        })
        expect(responses[1]).toEqual({
            foo: 'result-8'
        })
        expect(sendQuery).toBeCalledTimes(2)
        expect(sendQuery).toBeCalledWith(MOCK_QUERY)
    })

    it('timeout', async () => {
        client.updateRequiredBlockNumber(999999)
        theGraphIndex.start()
        return expect(() => client.sendQuery(MOCK_QUERY)).rejects.toThrow('The Graph did not synchronize to block 999999 (timed out after 1000 ms)')
    })

    it('one query timeouts, another succeeds', async () => {
        client.updateRequiredBlockNumber(7)
        const responsePromise1 = client.sendQuery(MOCK_QUERY)
        await wait(800)
        const responsePromise2 = client.sendQuery(MOCK_QUERY)
        theGraphIndex.start()
        await expect(() => responsePromise1).rejects.toThrow('The Graph did not synchronize to block 7 (timed out after 1000 ms)')
        expect(await responsePromise2).toEqual({
            foo: 'result-7'
        })
    })
})
