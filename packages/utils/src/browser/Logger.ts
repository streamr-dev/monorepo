import { type ILogger } from "../types"

export class Logger implements ILogger {
    fatal(msg: string, metadata: Record<string, unknown> = {}) {
        console.error(msg, metadata)
    }

    error(msg: string, metadata: Record<string, unknown> = {}) {
        console.error(msg, metadata)
    }

    warn(msg: string, metadata: Record<string, unknown> = {}) {
        console.warn(msg, metadata)
    }

    info(msg: string, metadata: Record<string, unknown> = {}) {
        console.info(msg, metadata)
    }

    debug(msg: string, metadata: Record<string, unknown> = {}) {
        console.log(msg, metadata)
    }

    trace(msg: string, metadata: Record<string, unknown> = {}) {
        console.log(msg, metadata)
    }
}
