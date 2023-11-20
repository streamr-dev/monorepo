import request from 'request'
import { Response } from 'request'
import { RestServer } from '../../src/RestServer'
import { CertifiedSubdomain } from '@streamr/autocertifier-client'
import { ApiError } from '@streamr/autocertifier-client'
import { Session } from '@streamr/autocertifier-client'
import { v4 } from 'uuid'
import path from 'path'

describe('RestServer', () => {
    let server: RestServer

    const certifiedSubdomain: CertifiedSubdomain = {
        fqdn: 'localhost',
        authenticationToken: 'token',
        certificate: 'certificate',
        privateKey: 'key'
    }
    const sessionId = v4()

    beforeAll(async () => {
        server = new RestServer(
            'localhost',
            9877,
            path.join(__dirname, '../utils/self-signed-certs/certificate.pem'),
            path.join(__dirname, '../utils/self-signed-certs/key.pem'),
            {
                async createSession(): Promise<Session> {
                    return { id: sessionId }
                },
                async createNewSubdomainAndCertificate(): Promise<CertifiedSubdomain> {
                    return certifiedSubdomain
                },
                async createNewCertificateForSubdomain(): Promise<CertifiedSubdomain> {

                    return certifiedSubdomain
                },
                async updateSubdomainIp() {
                    // do nothing
                }
            })
        await server.start()
    })

    afterAll(async () => {
        await server.stop()
    })

    describe('POST /sessions', () => {
        it('should return session with sessionId', (done) => {
            const options = {
                url: 'https://localhost:9877/sessions',
                method: 'POST',
                json: true,
                rejectUnauthorized: false
            }

            request(options, (error: any, response: Response, body: any) => {
                expect(error).toBeFalsy()
                expect(response.statusCode).toEqual(200)
                expect(body).toEqual({ id: sessionId })
                done()
            })
        })
    })

    describe('PATCH /certificates', () => {
        it('should return a certified subdomain', (done) => {
            const options = {
                url: 'https://localhost:9877/certificates',
                method: 'PATCH',
                json: {
                    streamrWebSocketPort: '1234',
                    peerId: 'e1'
                },
                rejectUnauthorized: false
            }

            request(options, (error: any, response: Response, body: any) => {
                expect(error).toBeFalsy()
                expect(response.statusCode).toEqual(200)
                expect(body).toEqual(certifiedSubdomain)
                done()
            })
        })

        it('should return an error if streamrWebSocketPort is missing', (done) => {
            const options = {
                url: 'https://localhost:9877/certificates',
                method: 'PATCH',
                json: true,
                rejectUnauthorized: false
            }

            request(options, (error: any, response: Response, body: any) => {
                expect(error).toBeFalsy()
                expect(response.statusCode).toEqual(400)
                const responseBody = body as ApiError
                expect(responseBody.code).toEqual('STREAMR_WEBSOCKET_PORT_MISSING')
                done()
            })
        })
    })

    describe('PUT /certificates/:subdomain/ip', () => {
        it('should update the subdomain IP and port', (done) => {
            const options = {
                url: 'https://localhost:9877/certificates/test/ip',
                method: 'PUT',
                json: {
                    streamrWebSocketPort: '1234',
                    token: 'token',
                    peerId: 'e1'
                },
                rejectUnauthorized: false
            }

            request(options, (error: any, response: Response, body: any) => {
                expect(error).toBeFalsy()
                expect(response.statusCode).toEqual(200)
                expect(body).toEqual({})
                done()
            })
        })

        it('should return an error if streamrWebSocketPort is missing', (done) => {
            const options = {
                url: 'https://localhost:9877/certificates/test/ip',
                method: 'PUT',
                json: {
                    token: 'token',
                    peerId: 'e1'
                },
                rejectUnauthorized: false
            }

            request(options, (error: any, response: Response, body: any) => {
                expect(error).toBeFalsy()
                expect(response.statusCode).toEqual(400)
                const responseBody = body as ApiError
                expect(responseBody.code).toEqual('STREAMR_WEBSOCKET_PORT_MISSING')
                done()
            })
        })

        it('should return an error if token is missing', (done) => {
            const options = {
                url: 'https://localhost:9877/certificates/test/ip',
                method: 'PUT',
                json: {
                    streamrWebSocketPort: '1234',
                    peerId: 'e1'
                },
                rejectUnauthorized: false
            }

            request(options, (error: any, response: Response, body: any) => {
                expect(error).toBeFalsy()
                expect(response.statusCode).toEqual(400)
                const responseBody = body as ApiError
                expect(responseBody.code).toEqual('TOKEN_MISSING')
                done()
            })
        })
    })

    it('should return an error if peerId is missing', (done) => {
        const options = {
            url: 'https://localhost:9877/certificates/test/ip',
            method: 'PUT',
            json: {
                streamrWebSocketPort: '1234',
                token: 'token'
            },
            rejectUnauthorized: false
        }

        request(options, (error: any, response: Response, body: any) => {
            expect(error).toBeFalsy()
            expect(response.statusCode).toEqual(400)
            const responseBody = body as ApiError
            expect(responseBody.code).toEqual('PEER_ID_MISSING')
            done()
        })
    })

    it('should return an error if peerId is not hex', (done) => {
        const options = {
            url: 'https://localhost:9877/certificates/test/ip',
            method: 'PUT',
            json: {
                streamrWebSocketPort: '1234',
                token: 'token',
                peerId: 'tttt'
            },
            rejectUnauthorized: false
        }

        request(options, (error: any, response: Response, body: any) => {
            expect(error).toBeFalsy()
            expect(response.statusCode).toEqual(400)
            const responseBody = body as ApiError
            expect(responseBody.code).toEqual('PEER_ID_MISSING')
            done()
        })
    })
})
