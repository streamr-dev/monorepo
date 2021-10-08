import pino from 'pino'
import pinoPretty from 'pino-pretty'
import path from 'path'
import _ from 'lodash'

const parseBoolean = (value: string|undefined) => {
    switch (value) {
        case 'true':
            return true
        case 'false':
            return false
        case undefined:
            return undefined
        default:
            throw new Error('Invalid boolean value: ${value}')
    }
}

export class Logger {

    static NAME_LENGTH = 20

    private readonly logger: pino.Logger

    constructor(module: NodeJS.Module, context?: string, destinationStream?: { write(msg: string): void }) {
        const options: pino.LoggerOptions = {
            name: Logger.createName(module, context),
            enabled: !process.env.NOLOG,
            level: process.env.LOG_LEVEL || 'info',
            // explicitly pass prettifier, otherwise pino may try to lazy require it,
            // which can fail when under jest+typescript, due to some CJS/ESM
            // incompatibility leading to throwing an error like:
            // "prettyFactory is not a function"
            prettifier: process.env.NODE_ENV === 'production' ? undefined : pinoPretty,
            prettyPrint: process.env.NODE_ENV === 'production' ? false : {
                colorize: parseBoolean(process.env.LOG_COLORS) ?? true,
                translateTime: 'yyyy-mm-dd"T"HH:MM:ss.l',
                ignore: 'pid,hostname',
                levelFirst: true,
            }
        }
        this.logger = (destinationStream !== undefined) ? pino(options, destinationStream) : pino(options)
    }

    private static createName(module: NodeJS.Module, context?: string) {
    
        const parsedPath = path.parse(module.id)
        let fileId = parsedPath.name
        if (fileId === 'index') {
            // file with name "foobar/index.ts" -> "foobar"
            const parts = parsedPath.dir.split(path.sep)
            fileId = parts[parts.length - 1]
        }
        const appId = process.env.STREAMR_APPLICATION_ID
        const longName = _.without([appId, fileId, context], undefined).join(':')
        return _.padEnd(longName.substring(0, Logger.NAME_LENGTH), Logger.NAME_LENGTH, ' ')
    }

    fatal(msg: string, ...args: any[]): void {
        this.logger.fatal(msg, ...args)
    }

    error(msg: string, ...args: any[]): void {
        const errorInstance = args.find((arg) => (arg.constructor.name === 'Error'
            || arg.constructor.name === 'AggregateError'
            || arg.constructor.name === 'EvalError'
            || arg.constructor.name === 'RangeError' 
            || arg.constructor.name === 'ReferenceError'
            || arg.constructor.name === 'SyntaxError'
            || arg.constructor.name === 'TypeError' 
            || arg.constructor.name === 'URIError'
        ))
        if (errorInstance !== undefined) {
            this.logger.error({ err: errorInstance }, msg, ...args)
        } else {
            this.logger.error(msg, ...args)
        }
    }

    warn(msg: string, ...args: any[]): void {
        this.logger.warn(msg, ...args)
    }

    info(msg: string, ...args: any[]): void {
        this.logger.info(msg, ...args)
    }

    debug(msg: string, ...args: any[]): void {
        this.logger.debug(msg, ...args)
    }

    trace(msg: string, ...args: any[]): void {
        this.logger.trace(msg, ...args)
    }
    
    getFinalLogger(): { error: (error: any, origin?: string) => void } {
        const finalLogger = pino.final(this.logger)
        return {
            error: (error: any, origin?: string) => finalLogger.error(error, origin)
        }
    }
}
