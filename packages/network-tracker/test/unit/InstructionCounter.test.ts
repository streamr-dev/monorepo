import { Status } from 'streamr-network'
import { InstructionCounter } from '../../src/logic/InstructionCounter'
import { StreamPartID, toStreamID } from 'streamr-client-protocol'

describe('InstructionCounter', () => {
    let instructionCounter: InstructionCounter

    beforeEach(() => {
        instructionCounter = new InstructionCounter()
    })

    it('if counters have not been set', () => {
        const status: Partial<Status> = {
            streamPart: {
                id: toStreamID('stream-1'),
                partition: 0,
                neighbors: [],
                counter: 123
            }
        }
        const isMostRecent = instructionCounter.isMostRecent(status as Status, 'node')
        expect(isMostRecent).toEqual(true)
    })

    it('stream specific', () => {
        instructionCounter.setOrIncrement('node', 'stream-1#0' as StreamPartID)
        instructionCounter.setOrIncrement('node', 'stream-1#0' as StreamPartID)
        instructionCounter.setOrIncrement('node', 'stream-2#0' as StreamPartID)
        instructionCounter.setOrIncrement('node', 'stream-2#0' as StreamPartID)
        instructionCounter.setOrIncrement('node', 'stream-2#0' as StreamPartID)
        const status1 = {
            streamPart: {
                id: 'stream-1',
                partition: 0,
                neighbors: [],
                counter: 1
            }
        }
        const status2 = {
            streamPart: {
                id: 'stream-2',
                partition: 0,
                neighbors: [],
                counter: 3
            }
        }
        expect(instructionCounter.isMostRecent(status1 as any, 'node')).toBe(false)
        expect(instructionCounter.isMostRecent(status2 as any, 'node')).toBe(true)
    })

    it('node specific', () => {
        instructionCounter.setOrIncrement('node-1', 'stream-1#0' as StreamPartID)
        instructionCounter.setOrIncrement('node-1', 'stream-1#0' as StreamPartID)
        instructionCounter.setOrIncrement('node-2', 'stream-1#0' as StreamPartID)
        instructionCounter.setOrIncrement('node-2', 'stream-1#0' as StreamPartID)
        instructionCounter.setOrIncrement('node-2', 'stream-1#0' as StreamPartID)
        const status1 = {
            streamPart: {
                id: 'stream-1',
                partition: 0,
                neighbors: [],
                counter: 1
            }
        }
        const status2 = {
            streamPart: {
                id: 'stream-1',
                partition: 0,
                neighbors: [],
                counter: 3
            }
        }
        expect(instructionCounter.isMostRecent(status1 as any, 'node-1')).toBe(false)
        expect(instructionCounter.isMostRecent(status2 as any, 'node-2')).toBe(true)
    })

    it('removeNodeFromStreamPart unsets counters', () => {
        instructionCounter.setOrIncrement('node', 'stream-1#0' as StreamPartID)
        instructionCounter.setOrIncrement('node', 'stream-1#0' as StreamPartID)
        instructionCounter.setOrIncrement('node', 'stream-1#0' as StreamPartID)
        instructionCounter.removeNodeFromStreamPart('node', 'stream-1#0' as StreamPartID)
        const status = {
            streamPart: {
                id: 'stream-1',
                partition: 0,
                neighbors: [],
                counter: 0
            }
        }
        expect(instructionCounter.isMostRecent(status as any, 'node')).toEqual(true)
    })

    it('removeStreamPart unsets counters', () => {
        instructionCounter.setOrIncrement('node', 'stream-1#0' as StreamPartID)
        instructionCounter.setOrIncrement('node', 'stream-1#0' as StreamPartID)
        instructionCounter.setOrIncrement('node', 'stream-1#0' as StreamPartID)
        instructionCounter.removeStreamPart('stream-1#0' as StreamPartID)
        const status = {
            streamPart: {
                id: 'stream-1',
                partition: 0,
                neighbors: [],
                counter: 0
            }
        }
        expect(instructionCounter.isMostRecent(status as any, 'node')).toEqual(true)
    })

    test('setOrIncrement returns node/stream-specific counter value', () => {
        expect(instructionCounter.setOrIncrement('node-a', 'stream-1#0' as StreamPartID)).toEqual(1)
        expect(instructionCounter.setOrIncrement('node-a', 'stream-1#0' as StreamPartID)).toEqual(2)
        expect(instructionCounter.setOrIncrement('node-a', 'stream-1#0' as StreamPartID)).toEqual(3)
        expect(instructionCounter.setOrIncrement('node-a', 'stream-2#0' as StreamPartID)).toEqual(1)
        expect(instructionCounter.setOrIncrement('node-b', 'stream-1#0' as StreamPartID)).toEqual(1)
        expect(instructionCounter.setOrIncrement('node-b', 'stream-1#0' as StreamPartID)).toEqual(2)
        expect(instructionCounter.setOrIncrement('node-b', 'stream-2#0' as StreamPartID)).toEqual(1)
        expect(instructionCounter.setOrIncrement('node-b', 'stream-3#0' as StreamPartID)).toEqual(1)
        expect(instructionCounter.setOrIncrement('node-a', 'stream-1#0' as StreamPartID)).toEqual(4)
        instructionCounter.removeStreamPart('stream-1#0' as StreamPartID)
        expect(instructionCounter.setOrIncrement('node-a', 'stream-1#0' as StreamPartID)).toEqual(1)
        expect(instructionCounter.setOrIncrement('node-b', 'stream-1#0' as StreamPartID)).toEqual(1)
        instructionCounter.removeNodeFromStreamPart('node-a', 'stream-1#0' as StreamPartID)
        expect(instructionCounter.setOrIncrement('node-a', 'stream-1#0' as StreamPartID)).toEqual(1)
        expect(instructionCounter.setOrIncrement('node-a', 'stream-2#0' as StreamPartID)).toEqual(2)
    })
})
