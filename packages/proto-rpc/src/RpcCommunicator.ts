/* eslint-disable promise/catch-or-return */

import * as Err from './errors'
import { ErrorCode } from './errors'
import {
    ClientTransport,
    ResultParts
} from './ClientTransport'
import {
    RpcMessage,
    RpcErrorType
} from './proto/ProtoRpc'
import { Empty } from './proto/google/protobuf/empty'
import { MethodOptions, ServerRegistry } from './ServerRegistry'
import EventEmitter from 'eventemitter3'
import { DeferredState } from '@protobuf-ts/runtime-rpc'
import { ServerCallContext } from '@protobuf-ts/runtime-rpc'
import { Logger } from '@streamr/utils'
import { ProtoCallContext, ProtoRpcOptions } from './ProtoCallContext'
import { Any } from './proto/google/protobuf/any'
import { IMessageType } from '@protobuf-ts/runtime'

export enum StatusCode {
    OK = 'OK',
    STOPPED = 'STOPPED',
    DEADLINE_EXCEEDED = 'DEADLINE_EXCEEDED',
    SERVER_ERROR = 'SERVER_ERROR'
}

interface RpcCommunicatorEvents {
    outgoingMessage: (message: RpcMessage, requestId: string, callContext?: ProtoCallContext) => void
}

export interface RpcCommunicatorConfig {
    rpcRequestTimeout?: number
}

class OngoingRequest {

    private deferredPromises: ResultParts
    private timeoutRef: NodeJS.Timeout

    constructor(deferredPromises: ResultParts,
        timeout: number) {
        this.deferredPromises = deferredPromises
        this.timeoutRef = setTimeout(() => {
            const error = new Err.RpcTimeout('Rpc request timed out', new Error())
            this.rejectDeferredPromises(error, StatusCode.DEADLINE_EXCEEDED)
        }, timeout)
    }

    public resolveRequest(response: RpcMessage) {
        if (this.timeoutRef) {
            clearTimeout(this.timeoutRef)
        }
        this.resolveDeferredPromises(response)
    }

    public resolveNotification() {
        if (this.timeoutRef) {
            clearTimeout(this.timeoutRef)
        }
        if (this.deferredPromises.message.state === DeferredState.PENDING) {
            this.deferredPromises.message.resolve({})
            this.deferredPromises.header.resolve({})
            this.deferredPromises.status.resolve({ code: StatusCode.OK, detail: '' })
            this.deferredPromises.trailer.resolve({})
        }
    }

    public rejectRequest(error: Error, code: string) {
        if (this.timeoutRef) {
            clearTimeout(this.timeoutRef)
        }
        this.rejectDeferredPromises(error, code)
    }

    private resolveDeferredPromises(response: RpcMessage): void {
        if (this.deferredPromises.message.state === DeferredState.PENDING) {
            try {
                const parsedResponse = this.deferredPromises.messageParser(response.body!.value)
                this.deferredPromises.message.resolve(parsedResponse)
                this.deferredPromises.header.resolve({})
                this.deferredPromises.status.resolve({ code: StatusCode.OK, detail: '' })
                this.deferredPromises.trailer.resolve({})
            } catch (err) {
                logger.debug(`Could not parse response, received message is likely `)
                const error = new Err.FailedToParse(`Failed to parse received response, network protocol version likely is likely incompatible`, err)
                this.rejectDeferredPromises(error, StatusCode.SERVER_ERROR)
            }
        }
    }

    private rejectDeferredPromises(error: Error, code: string): void {
        if (this.deferredPromises.message.state === DeferredState.PENDING) {
            this.deferredPromises.message.reject(error)
            this.deferredPromises.header.reject(error)
            this.deferredPromises.status.reject({ code, detail: error.message })
            this.deferredPromises.trailer.reject(error)
        }
    }
}

const logger = new Logger(module)

interface RpcResponseParams {
    request: RpcMessage
    body?: Any
    errorType?: RpcErrorType
    errorClassName?: string
    errorCode?: string
    errorMessage?: string
}

type OutgoingMessageListener = (message: RpcMessage, requestId: string, callContext?: ProtoCallContext) => Promise<void>

export class RpcCommunicator extends EventEmitter<RpcCommunicatorEvents> {
    private stopped = false
    private readonly rpcClientTransport: ClientTransport
    private readonly rpcServerRegistry: ServerRegistry
    private readonly ongoingRequests: Map<string, OngoingRequest>
    private readonly rpcRequestTimeout: number
    private outgoingMessageListener?: OutgoingMessageListener

    constructor(params?: RpcCommunicatorConfig) {
        super()

        this.rpcRequestTimeout = params?.rpcRequestTimeout ?? 5000
        this.rpcClientTransport = new ClientTransport(this.rpcRequestTimeout)
        this.rpcServerRegistry = new ServerRegistry()
        this.ongoingRequests = new Map()

        // Client side listener for outgoing request
        this.rpcClientTransport.on('rpcRequest', (
            rpcMessage: RpcMessage,
            options: ProtoRpcOptions,
            deferredPromises: ResultParts | undefined
        ) => {
            this.onOutgoingMessage(rpcMessage, deferredPromises, options as ProtoCallContext)
        })
    }

    public async handleIncomingMessage(message: RpcMessage, callContext?: ProtoCallContext): Promise<void> {
        if (this.stopped) {
            return
        }
        //const rpcCall = RpcMessage.fromBinary(message)
        return this.onIncomingMessage(message, callContext)
    }

    public registerRpcMethod<RequestClass extends IMessageType<RequestType>,
        ReturnClass extends IMessageType<ReturnType>,
        RequestType extends object,
        ReturnType extends object>(
        requestClass: RequestClass,
        returnClass: ReturnClass,
        name: string,
        fn: (rq: RequestType, _context: ServerCallContext) => Promise<ReturnType>,
        options: MethodOptions = {}
    ): void {
        this.rpcServerRegistry.registerRpcMethod(requestClass, returnClass, name, fn, options)
    }

    public registerRpcNotification<RequestClass extends IMessageType<RequestType>,
        RequestType extends object>(
        requestClass: RequestClass,
        name: string,
        fn: (rq: RequestType, _context: ServerCallContext) => Promise<Empty>,
        options: MethodOptions = {}
    ): void {
        this.rpcServerRegistry.registerRpcNotification(requestClass, name, fn, options)
    }

    public getRpcClientTransport(): ClientTransport {
        return this.rpcClientTransport
    }

    public stop(): void {
        this.stopped = true
        this.ongoingRequests.forEach((ongoingRequest: OngoingRequest) => {
            ongoingRequest.rejectRequest(new Error('stopped'), StatusCode.STOPPED)
        })
        this.removeAllListeners()
        this.ongoingRequests.clear()
        this.rpcClientTransport.stop()
    }

    private onOutgoingMessage(rpcMessage: RpcMessage, deferredPromises?: ResultParts, callContext?: ProtoCallContext): void {
        if (this.stopped) {
            if (deferredPromises) {
                const ongoingRequest = new OngoingRequest(deferredPromises, 1000)
                ongoingRequest.rejectRequest(new Error('stopped'), StatusCode.STOPPED)
            }
            return
        }
        const requestOptions = this.rpcClientTransport.mergeOptions(callContext)

        // do not register a notification
        if (deferredPromises && (!callContext || !callContext.notification)) {
            this.registerRequest(rpcMessage.requestId, deferredPromises, requestOptions.timeout as number)
        }

        logger.trace(`onOutGoingMessage, messageId: ${rpcMessage.requestId}`)

        this.emit('outgoingMessage', rpcMessage, rpcMessage.requestId, callContext)

        if (this.outgoingMessageListener) {
            this.outgoingMessageListener(rpcMessage, rpcMessage.requestId, callContext)
                .catch((clientSideException) => {
                    if (deferredPromises) {
                        if (this.ongoingRequests.has(rpcMessage.requestId)) {
                            this.handleClientError(rpcMessage.requestId, clientSideException)
                        } else {
                            const ongoingRequest = new OngoingRequest(deferredPromises, 1000)
                            ongoingRequest.rejectRequest(clientSideException, StatusCode.SERVER_ERROR)
                        }
                    }
                })
                .then(() => {
                    if (deferredPromises) {
                        if (!this.ongoingRequests.has(rpcMessage.requestId)) {
                            const ongoingRequest = new OngoingRequest(deferredPromises, 1000)
                            ongoingRequest.resolveNotification()
                        }
                    }
                    return
                })
        } else {
            if (deferredPromises) {
                if (!this.ongoingRequests.has(rpcMessage.requestId)) {
                    const ongoingRequest = new OngoingRequest(deferredPromises, 1000)
                    ongoingRequest.resolveNotification()
                }
            }
        }
    }

    private async onIncomingMessage(rpcMessage: RpcMessage, callContext?: ProtoCallContext): Promise<void> {
        logger.trace(`onIncomingMessage, requestId: ${rpcMessage.requestId}`)

        if (rpcMessage.header.response && this.ongoingRequests.has(rpcMessage.requestId)) {
            if (rpcMessage.errorType !== undefined) {
                this.rejectOngoingRequest(rpcMessage)
            } else {
                this.resolveOngoingRequest(rpcMessage)
            }
        } else if (rpcMessage.header.request && rpcMessage.header.method) {
            if (rpcMessage.header.notification) {
                await this.handleNotification(rpcMessage, callContext)
            } else {
                await this.handleRequest(rpcMessage, callContext)
            }
        }
    }

    private async handleRequest(rpcMessage: RpcMessage, callContext?: ProtoCallContext): Promise<void> {
        if (this.stopped) {
            return
        }
        let response: RpcMessage
        try {
            const bytes = await this.rpcServerRegistry.handleRequest(rpcMessage, callContext)
            response = this.createResponseRpcMessage({
                request: rpcMessage,
                body: bytes
            })
        } catch (err) {
            const errorParams: RpcResponseParams = { request: rpcMessage }
            if (err.code === ErrorCode.UNKNOWN_RPC_METHOD) {
                errorParams.errorType = RpcErrorType.UNKNOWN_RPC_METHOD
            } else if (err.code === ErrorCode.RPC_TIMEOUT) {
                errorParams.errorType = RpcErrorType.SERVER_TIMEOUT
            } else {
                errorParams.errorType = RpcErrorType.SERVER_ERROR
                if (err.className) {
                    errorParams.errorClassName = err.className
                }
                if (err.code) {
                    errorParams.errorCode = err.code
                }
                if (err.message) {
                    errorParams.errorMessage = err.message
                }
            }
            response = this.createResponseRpcMessage(errorParams)
        }
        this.onOutgoingMessage(response, undefined, callContext)
    }

    private async handleNotification(rpcMessage: RpcMessage,
        callContext?: ProtoCallContext): Promise<void> {
        if (this.stopped) {
            return
        }
        try {
            await this.rpcServerRegistry.handleNotification(rpcMessage, callContext)
        } catch (err) {
            logger.debug('error', { err })
        }
    }

    private registerRequest(requestId: string, deferredPromises: ResultParts, timeout = this.rpcRequestTimeout): void {
        if (this.stopped) {
            return
        }

        const ongoingRequest = new OngoingRequest(deferredPromises, timeout)

        this.ongoingRequests.set(requestId, ongoingRequest)
    }

    private resolveOngoingRequest(response: RpcMessage): void {
        if (this.stopped) {
            return
        }
        const ongoingRequest = this.ongoingRequests.get(response.requestId)!
        ongoingRequest.resolveRequest(response)

        this.ongoingRequests.delete(response.requestId)
    }

    private rejectOngoingRequest(response: RpcMessage): void {
        if (this.stopped) {
            return
        }
        const ongoingRequest = this.ongoingRequests.get(response.requestId)!

        let error
        if (response.errorType === RpcErrorType.SERVER_TIMEOUT) {
            error = new Err.RpcTimeout('Server timed out on request')
        } else if (response.errorType === RpcErrorType.UNKNOWN_RPC_METHOD) {
            error = new Err.UnknownRpcMethod(`Server does not implement method ${response.header.method}`)
        } else if (response.errorType === RpcErrorType.SERVER_ERROR) {
            error = new Err.RpcServerError(response.errorMessage, response.errorClassName, response.errorCode)
        } else {
            error = new Err.RpcRequest('Unknown RPC Error')
        }
        ongoingRequest.rejectRequest(error, StatusCode.SERVER_ERROR)
        this.ongoingRequests.delete(response.requestId)
    }

    public handleClientError(requestId: string, error: Error): void {
        if (this.stopped) {
            return
        }

        const ongoingRequest = this.ongoingRequests.get(requestId)

        if (ongoingRequest) {
            //error = new Err.RpcClientError('Rpc client error', error)
            ongoingRequest.rejectRequest(error, StatusCode.SERVER_ERROR)
            this.ongoingRequests.delete(requestId)
        }
    }

    public setOutgoingMessageListener(listener: OutgoingMessageListener): void {
        this.outgoingMessageListener = listener
    }

    // eslint-disable-next-line class-methods-use-this
    private createResponseRpcMessage(
        { request, body, errorType, errorClassName, errorCode, errorMessage }:
            RpcResponseParams
    ): RpcMessage {
        return {
            body,
            header: {
                response: 'response',
                method: request.header.method
            },
            requestId: request.requestId,
            errorType,
            errorClassName,
            errorCode,
            errorMessage
        }
    }
}
