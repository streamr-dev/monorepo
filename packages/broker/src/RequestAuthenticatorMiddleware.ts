import { Request, Response, NextFunction } from 'express'
import { HttpError } from './errors/HttpError'
import { Logger } from 'streamr-network'
import { StreamFetcher } from './StreamFetcher'

const logger = new Logger(module)

export type AuthenticatedRequest = Request & { stream?: Record<string, unknown> }

/**
 * Middleware used to authenticate REST API requests
 */
export const authenticator = (
    streamFetcher: StreamFetcher,
    permission = 'stream_subscribe'
) => (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    let sessionToken

    // Try to parse authorization header if defined
    if (req.headers.authorization !== undefined) {
        const sessionTokenHeaderValid = req.headers.authorization.toLowerCase().startsWith('bearer ')
        if (!sessionTokenHeaderValid) {
            const errMsg = 'Authorization header malformed. Should be of form "Bearer session-token".'
            logger.debug(errMsg)

            res.status(400).send({
                error: errMsg
            })
            return
        }
        sessionToken = req.headers.authorization
            .substring(7)
            .trim()
    }

    streamFetcher.authenticate(req.params.id, sessionToken, permission)
        .then((streamJson: Record<string, unknown>) => {
            req.stream = streamJson
            next()
        })
        .catch((err: any) => {
            let errorMsg
            if (err instanceof HttpError && err.code === 403) {
                errorMsg = 'Authentication failed.'
            } else if (err instanceof HttpError && err.code === 404) {
                errorMsg = `Stream ${req.params.id} not found.`
            } else {
                errorMsg = 'Request failed.'
            }

            logger.error(err)
            logger.error(errorMsg)

            res.status(err.code || 503).send({
                error: errorMsg,
            })
        })
}
