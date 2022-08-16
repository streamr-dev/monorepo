import { UUID } from "../helpers/UUID"

export enum Event {
    DATA = 'streamr:dht:connection:data',
    CONNECTED = 'streamr:dht:connection:connected',
    DISCONNECTED = 'streamr:dht:connection:disconnected',
    ERROR = 'streamr:dht:connection:error'
}
export enum ConnectionType {
    WEBSOCKET_SERVER = 'websocket-server',
    WEBSOCKET_CLIENT = 'websocket-client',
    DEFERRED = 'deferred',
    WEBRTC = 'webrtc',
}

export type ConnectionIDKey = string & { readonly __brand: 'connectionIDKey' } // Nominal typing 

export class ConnectionID extends UUID {
    toMapKey(): ConnectionIDKey {
        return this.toString() as ConnectionIDKey
    }
}

export interface IConnection {
    
    on(event: Event.DATA, listener: (bytes: Uint8Array) => void): this
    on(event: Event.ERROR, listener: (name: string) => void): this
    on(event: Event.CONNECTED, listener: () => void): this
    on(event: Event.DISCONNECTED, listener: (code: number, reason: string) => void): this
    
    once(event: Event.DATA, listener: (bytes: Uint8Array) => void): this
    once(event: Event.ERROR, listener: (name: string) => void): this
    once(event: Event.CONNECTED, listener: () => void): this
    once(event: Event.DISCONNECTED, listener: (code: number, reason: string) => void): this

    send(data: Uint8Array): void
    close(): void
}
