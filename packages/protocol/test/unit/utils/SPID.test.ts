import { SPID } from '../../../src/utils/SPID'

describe('SPID', () => {
    const STREAM_ID = 'test-stream-id'
    const PARTITION = 1

    it('can use object destructuring', () => {
        const spid = new SPID(STREAM_ID, PARTITION)
        const { streamId, streamPartition, key } = spid
        expect(streamId).toBe(STREAM_ID)
        expect(streamPartition).toBe(PARTITION)
        expect(key).toBe(spid.toString())
    })

    it('does not lowercase streamId', () => {
        const spid = new SPID(STREAM_ID.toUpperCase(), PARTITION)
        expect(spid.streamId).toEqual(STREAM_ID.toUpperCase())
        expect(spid.streamPartition).toBe(PARTITION)
    })

    it('has toString', () => {
        const spid = new SPID(STREAM_ID, PARTITION)
        // @ts-expect-error SPID.SEPARATOR is protected
        const str = `${STREAM_ID}${SPID.SEPARATOR}${PARTITION}`
        expect(spid.toString()).toBe(str)
    })

    it('has toObject', () => {
        const spid = new SPID(STREAM_ID, PARTITION)
        expect(spid.toObject()).toEqual({
            streamId: STREAM_ID,
            streamPartition: PARTITION,
        })
    })

    it('can get key from string', () => {
        const spid = new SPID(STREAM_ID, PARTITION)
        const key = SPID.toKey(spid.toString())
        expect(key).toBe(spid.key)
    })

    it('requires valid streamId', () => {
        const badTypes = [
            undefined,
            null,
            {},
            /regex/,
            [],
            [1,2,3],
            Number.NaN,
            Symbol('bad streamid'),
            BigInt(1),
            BigInt(0),
            function() {},
            new Uint8Array()
        ]
        const badStreamIds = [
            '', // too short
            0, // not a string
        ]
        for (const streamId of [...badTypes, ...badStreamIds]) {
            expect(() => {
                // @ts-expect-error testing bad input
                new SPID(streamId, PARTITION)
            }).toThrow()
        }
    })

    it('requires valid partition', () => {
        const badTypes = [
            undefined,
            null,
            {},
            '',
            /regex/,
            [],
            [1,2,3],
            Symbol('bad streamid'),
            BigInt(1),
            BigInt(0),
            function() {},
            new Uint8Array()
        ]

        const badPartitions = [
            '0', // not a number
            -1, // not positive
            0.1, // not integer
            -0.1, // negative and not integer
            Number.POSITIVE_INFINITY, // Too big
            Number.NEGATIVE_INFINITY, // Not positive
            Number.MAX_SAFE_INTEGER + 1, // Not safe
            Number.NaN, // NaN
        ]

        for (const partition of [...badTypes, ...badPartitions]) {
            expect(() => {
                // @ts-expect-error testing bad input
                new SPID(STREAM_ID, partition)
            }).toThrow()
        }
    })

    describe('parse', () => {
        it('returns self if already a spid', () => {
            const spid = new SPID(STREAM_ID, PARTITION)
            expect(SPID.parse(spid)).toBe(spid)
        })

        it('streamId is not optional in return type when supplied', () => {
            const parsed = SPID.parse({ streamId: STREAM_ID })
            expect(parsed).toEqual({ streamId: STREAM_ID, streamPartition: undefined })
            const id: string = parsed.streamId // ensure streamId type is not typed optional
            expect(id).toBe(STREAM_ID)
        })

        it('streamId & streamPartition are not optional in return type when supplied', () => {
            const parsed = SPID.parse({ streamId: STREAM_ID, streamPartition: PARTITION })
            expect(parsed).toEqual({ streamId: STREAM_ID, streamPartition: PARTITION })
            const id: string = parsed.streamId // ensure streamId type is not typed optional
            const partition: number = parsed.streamPartition // ensure streamPartition type is not typed optional
            expect(id).toBe(STREAM_ID)
            expect(partition).toBe(PARTITION)
        })

        it('streamPartition should be optional for string inputs', () => {
            const parsed = SPID.parse(STREAM_ID)
            expect(parsed).toEqual({ streamId: STREAM_ID, streamPartition: undefined })
            const id: string = parsed.streamId // ensure streamId type is not typed optional
            // @ts-expect-error streamPartition should be optional
            const partition: number = parsed.streamPartition
            expect(id).toBe(STREAM_ID)
            expect(partition).toBe(undefined)
        })
    })

    describe('from', () => {
        it('returns self if already a spid', () => {
            const spid = new SPID(STREAM_ID, PARTITION)
            expect(SPID.from(spid)).toBe(spid)
        })

        it('can parse valid strings', () => {
            // @ts-expect-error SPID.SEPARATOR is protected
            const str = `${STREAM_ID}${SPID.SEPARATOR}${PARTITION}`
            const spid = SPID.from(str)
            expect(spid.streamId).toBe(STREAM_ID)
            expect(spid.streamPartition).toBe(PARTITION)
        })

        it('requires partition in string', () => {
            expect(() => {
                SPID.from(STREAM_ID)
            }).toThrow()
        })

        describe('fromDefaults', () => {
            it('can fill defaults', () => {
                const spid = SPID.fromDefaults(STREAM_ID, { streamPartition: PARTITION })
                expect(spid.streamId).toBe(STREAM_ID)
                expect(spid.streamPartition).toBe(PARTITION)
                const spid2 = SPID.fromDefaults({ streamId: STREAM_ID }, { streamPartition: PARTITION + 1 })
                expect(spid2.streamId).toBe(STREAM_ID)
                expect(spid2.streamPartition).toBe(PARTITION + 1)
                const spid3 = SPID.fromDefaults({ streamPartition: PARTITION + 3 }, { streamId: STREAM_ID })
                expect(spid3.streamId).toBe(STREAM_ID)
                expect(spid3.streamPartition).toBe(PARTITION + 3)
            })

            it('can take a SID with streamPartition in defaults', () => {
                const sid = { streamId: STREAM_ID }
                const spid = SPID.fromDefaults(sid, { streamPartition: PARTITION })
                expect(spid.streamId).toBe(STREAM_ID)
                expect(spid.streamPartition).toBe(PARTITION)
                const spid2 = SPID.fromDefaults({ streamId: STREAM_ID }, { streamPartition: PARTITION + 1 })
                expect(spid2.streamId).toBe(STREAM_ID)
                expect(spid2.streamPartition).toBe(PARTITION + 1)
                const spid3 = SPID.fromDefaults({ streamPartition: PARTITION + 3 }, { streamId: STREAM_ID })
                expect(spid3.streamId).toBe(STREAM_ID)
                expect(spid3.streamPartition).toBe(PARTITION + 3)
            })

            it('can fill defaults from strings', () => {
                // @ts-expect-error SPID.SEPARATOR is protected
                const str = `${STREAM_ID}${SPID.SEPARATOR}${PARTITION}`
                const spid = SPID.fromDefaults({ streamId: STREAM_ID }, str)
                expect(spid.streamId).toBe(STREAM_ID)
                expect(spid.streamPartition).toBe(PARTITION)
                const spid2 = SPID.fromDefaults(STREAM_ID + '2', str)
                expect(spid2.streamId).toBe(STREAM_ID + '2')
                expect(spid2.streamPartition).toBe(PARTITION)
                // this is mainly testing TS, checking that it complains if partial used but no default
                expect(() =>{
                    // @ts-expect-error TS should complain, should require default if from argument is missing properties
                    SPID.fromDefaults({ streamPartition: PARTITION })
                }).toThrow()
            })

            it('still requires proper values if defaults are set', () => {
                expect(() =>{
                    // @ts-expect-error streamId required
                    SPID.fromDefaults({ streamId: undefined, streamPartition: PARTITION }, { streamPartition: PARTITION })
                }).toThrow()
            })
        })

        it('can parse {id, partition} objects', () => {
            const spid = SPID.from({streamId: STREAM_ID, streamPartition: PARTITION})
            expect(spid.streamId).toBe(STREAM_ID)
            expect(spid.streamPartition).toBe(PARTITION)
        })

        it('require partition in object', () => {
            expect(() => {
                // @ts-expect-error partition is required
                SPID.from({ streamId: STREAM_ID })
            }).toThrow()
        })

        it('can parse {streamId, streamPartition} objects', () => {
            const spid = SPID.from({streamId: STREAM_ID, streamPartition: PARTITION})
            expect(spid.streamId).toBe(STREAM_ID)
            expect(spid.streamPartition).toBe(PARTITION)
        })

        it('prioritises supplied values over defaults', () => {
            const spid = SPID.fromDefaults({
                streamId: STREAM_ID,
                streamPartition: PARTITION
            }, { streamId: `not${STREAM_ID}`, streamPartition: PARTITION + 1 })
            expect(spid.streamId).toBe(STREAM_ID)
            expect(spid.streamPartition).toBe(PARTITION)
        })
    })

    describe('toString', () => {
        it('creates a string', () => {
            const spid = new SPID(STREAM_ID, PARTITION)
            // @ts-expect-error SPID.SEPARATOR is protected
            expect(spid.toString()).toBe(`${STREAM_ID}${SPID.SEPARATOR}${PARTITION}`)
        })

        it('is valid input into from', () => {
            const spid = new SPID(STREAM_ID, PARTITION)
            const spid2 = SPID.from(spid.toString())
            expect(spid2.streamId).toBe(STREAM_ID)
            expect(spid2.streamPartition).toBe(PARTITION)
        })

        it('is the same as key', () => {
            const spid = new SPID(STREAM_ID, PARTITION)
            expect(spid.toString()).toBe(spid.key)
        })
    })

    describe('equals', () => {
        it('works with spids', () => {
            const spid1 = new SPID(STREAM_ID, PARTITION)
            const spid2 = new SPID(STREAM_ID, PARTITION)
            const spid3 = new SPID(STREAM_ID, PARTITION + 1)
            const spid4 = new SPID('other id', PARTITION)
            // same should be equal
            expect(spid1.equals(spid1)).toBeTruthy()
            // different ids but same values should be equal
            expect(spid1.equals(spid2)).toBeTruthy()
            // different partitions is not equal
            expect(spid1.equals(spid3)).not.toBeTruthy()
            // different streamIds is not equal
            expect(spid1.equals(spid4)).not.toBeTruthy()
        })

        it('works with spidLike', () => {
            const spid = new SPID(STREAM_ID, PARTITION)
            const spidString = spid.toString()
            expect(spid.equals(spidString)).toBeTruthy()
            // @ts-expect-error SPID.SEPARATOR is protected
            expect(spid.equals(`${STREAM_ID}${SPID.SEPARATOR}0`)).not.toBeTruthy()
            expect(spid.equals('')).not.toBeTruthy()
            // @ts-expect-error testing bad input
            expect(spid.equals()).not.toBeTruthy()
            // @ts-expect-error testing bad input
            expect(spid.equals([1,2])).not.toBeTruthy()
        })
    })

    describe('matches', () => {
        it('works with spids', () => {
            const spid1 = new SPID(STREAM_ID, PARTITION)
            const spid2 = new SPID(STREAM_ID, PARTITION)
            const spid3 = new SPID(STREAM_ID, PARTITION + 1)
            const spid4 = new SPID('other id', PARTITION)
            // same should be equal
            expect(spid1.matches(spid1)).toBeTruthy()
            // different ids but same values should be equal
            expect(spid1.matches(spid2)).toBeTruthy()
            // different partitions is not equal
            expect(spid1.matches(spid3)).not.toBeTruthy()
            // different streamIds is not equal
            expect(spid1.matches(spid4)).not.toBeTruthy()
        })

        it('works with spidLike', () => {
            const spid = new SPID(STREAM_ID, PARTITION)
            const spidString = spid.toString()
            expect(spid.matches(spidString)).toBeTruthy()
            // @ts-expect-error streamId is required
            expect(spid.matches(`${STREAM_ID}${SPID.SEPARATOR}0`)).not.toBeTruthy()
            expect(spid.matches('')).not.toBeTruthy()
            // @ts-expect-error testing bad input
            expect(spid.matches()).not.toBeTruthy()
            // @ts-expect-error testing bad input
            expect(spid.matches([1,2])).not.toBeTruthy()
            expect(spid.matches({ streamId: STREAM_ID })).toBeTruthy()
            expect(spid.matches(STREAM_ID)).toBeTruthy()
            // @ts-expect-error testing bad input, streamId is required
            expect(spid.matches({ streamPartition: PARTITION })).not.toBeTruthy()
            // @ts-expect-error testing bad input, streamId is required
            expect(spid.matches({ partition: PARTITION })).not.toBeTruthy()
            // @ts-expect-error testing bad input, streamId is required
            expect(spid.matches(PARTITION)).not.toBeTruthy()
            const spid2 = new SPID(STREAM_ID, PARTITION + 1)
            expect(spid2.matches(STREAM_ID)).toBeTruthy()
            // should also match on partition if supplied
            expect(spid2.matches(spid.toString())).not.toBeTruthy()
            expect(spid2.matches(spid)).not.toBeTruthy()
            expect(spid2.matches(spid.toObject())).not.toBeTruthy()
        })
    })
})
