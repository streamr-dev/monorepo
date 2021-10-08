import { StreamPart } from '../../../../src/types'

export const createMockStorageConfig = (streams: StreamPart[]): any => {
    return {
        hasStream: (stream: StreamPart) => {
            return streams.some((s) => (s.id === stream.id) && (s.partition === stream.partition))
        },
        getStreams: () => {
            return streams
        },
        addChangeListener: () => {},
        startAssignmentEventListener: jest.fn(),
        stopAssignmentEventListener: jest.fn(),
        cleanup: jest.fn().mockResolvedValue(undefined)
    }
}
