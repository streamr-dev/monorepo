import { parseMetadata } from '../../src/StreamMetadata'

describe('metadata', () => {

    describe('parse', () => {

        it('happy path', () => {
            const metadata = JSON.stringify({
                partitions: 50,
                foo: 'bar'
            })
            expect(parseMetadata(metadata)).toEqual({
                partitions: 50,
                foo: 'bar'
            })
        })
    
        it('no value in valid JSON', () => {
            const metadata = JSON.stringify({
                foo: 'bar'
            })
            expect(parseMetadata(metadata)).toEqual({
                partitions: 1,
                foo: 'bar'
            })
        })
    
        it('empty metadata', () => {
            const metadata = ''
            expect(parseMetadata(metadata)).toEqual({
                partitions: 1
            })
        })
    
        it('invalid value', () => {
            const metadata = JSON.stringify({
                partitions: 150
            })
            expect(() => parseMetadata(metadata)).toThrowStreamrError({
                message: 'Invalid stream metadata: {"partitions":150}',
                code: 'INVALID_STREAM_METADATA'
            })
        })
    
        it('invalid JSON', () => {
            const metadata = 'invalid-json'
            expect(() => parseMetadata(metadata)).toThrowStreamrError({
                message: 'Invalid stream metadata: invalid-json',
                code: 'INVALID_STREAM_METADATA'
            })
        })
    })
})