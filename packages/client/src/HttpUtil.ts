import { StreamMessage } from '@streamr/protocol'
import { Logger } from '@streamr/utils'
import fetch, { Response } from 'node-fetch'
import { AbortSignal } from 'node-fetch/externals'
import split2 from 'split2'
import { Readable } from 'stream'
import { Lifecycle, scoped } from 'tsyringe'
import { LoggerFactory } from './utils/LoggerFactory'
import { WebStreamToNodeStream } from './utils/WebStreamToNodeStream'

export enum ErrorCode {
    NOT_FOUND = 'NOT_FOUND',
    VALIDATION_ERROR = 'VALIDATION_ERROR',
    UNKNOWN = 'UNKNOWN'
}

export class HttpError extends Error {
    public response?: Response
    public body?: any
    public code: ErrorCode
    public errorCode: ErrorCode

    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    constructor(message: string, response?: Response, body?: any, errorCode?: ErrorCode) {
        const typePrefix = errorCode ? errorCode + ': ' : ''
        // add leading space if there is a body set
        super(typePrefix + message)
        this.response = response
        this.body = body
        this.code = errorCode || ErrorCode.UNKNOWN
        this.errorCode = this.code
    }
}

export class ValidationError extends HttpError {
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    constructor(message: string, response?: Response, body?: any) {
        super(message, response, body, ErrorCode.VALIDATION_ERROR)
    }
}

export class NotFoundError extends HttpError {
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    constructor(message: string, response?: Response, body?: any) {
        super(message, response, body, ErrorCode.NOT_FOUND)
    }
}

const ERROR_TYPES = new Map<ErrorCode, typeof HttpError>()
ERROR_TYPES.set(ErrorCode.VALIDATION_ERROR, ValidationError)
ERROR_TYPES.set(ErrorCode.NOT_FOUND, NotFoundError)
ERROR_TYPES.set(ErrorCode.UNKNOWN, HttpError)

export const createQueryString = (query: Record<string, any>): string => {
    const withoutEmpty = Object.fromEntries(Object.entries(query).filter(([_k, v]) => v != null))
    return new URLSearchParams(withoutEmpty).toString()
}

const parseErrorCode = (body: string) => {
    let json
    try {
        json = JSON.parse(body)
    } catch (err) {
        return ErrorCode.UNKNOWN
    }

    const { code } = json
    return code in ErrorCode ? code : ErrorCode.UNKNOWN
}

@scoped(Lifecycle.ContainerScoped)
export class HttpUtil {

    constructor() {
    }

    async* fetchHttpStream(
        url: string,
        abortController = new AbortController()
    ): AsyncIterable<StreamMessage> {
        // cast is needed until this is fixed: https://github.com/node-fetch/node-fetch/issues/1652
        const response = await fetchResponse(url, abortController.signal as AbortSignal)
        if (!response.body) {
            throw new Error('No Response Body')
        }

        let stream: Readable | undefined
        try {
            // in the browser, response.body will be a web stream. Convert this into a node stream.
            const source: Readable = WebStreamToNodeStream(response.body as unknown as (ReadableStream | Readable))

            stream = source.pipe(split2((message: string) => {
                return StreamMessage.deserialize(message)
            }))

            stream.once('close', () => {
                abortController.abort()
            })

            yield* stream
        } catch (err) {
            abortController.abort()
            throw err
        } finally {
            stream?.destroy()
        }
    }
}

async function fetchResponse(
    url: string,
    abortSignal: AbortSignal
): Promise<Response> {
    const response: Response = await fetch(url, {
        signal: abortSignal
    })

    if (response.ok) {
        return response
    }

    const body = await response.text()
    const errorCode = parseErrorCode(body)
    const ErrorClass = ERROR_TYPES.get(errorCode)!
    throw new ErrorClass(`Request to ${url} returned with error code ${response.status}.`, response, body, errorCode)
}
