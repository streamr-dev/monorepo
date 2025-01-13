'use strict'
module.exports = validate10
module.exports.default = validate10
const schema11 = {
    $id: 'config.schema.json',
    $schema: 'http://json-schema.org/draft-07/schema#',
    description: 'Client configuration format',
    type: 'object',
    additionalProperties: false,
    properties: {
        environment: {
            type: 'string',
            enum: ['polygon', 'polygonAmoy', 'dev2'],
            description: 'applies all environment-specific defaults for the given environment'
        },
        id: { type: 'string' },
        logLevel: { type: 'string', enum: ['silent', 'fatal', 'error', 'warn', 'info', 'debug', 'trace'], default: 'info' },
        auth: {
            type: 'object',
            additionalProperties: false,
            properties: {
                privateKey: { type: 'string', format: 'ethereum-private-key' },
                address: { type: 'string', format: 'ethereum-address' },
                ethereum: { type: 'object' }
            }
        },
        orderMessages: { type: 'boolean', default: true },
        gapFill: { type: 'boolean', default: true },
        maxGapRequests: { type: 'number', default: 5 },
        retryResendAfter: { type: 'number', default: 5000 },
        gapFillTimeout: { type: 'number', default: 5000 },
        gapFillStrategy: { type: 'string', enum: ['light', 'full'], default: 'light' },
        network: {
            type: 'object',
            additionalProperties: false,
            required: [],
            properties: {
                controlLayer: {
                    type: 'object',
                    additionalProperties: false,
                    properties: {
                        entryPoints: { type: 'array', items: { $ref: '#/definitions/peerDescriptor' } },
                        entryPointDiscovery: {
                            type: 'object',
                            additionalProperties: false,
                            properties: {
                                enabled: { type: 'boolean' },
                                maxEntryPoints: { type: 'number' },
                                maxQueryResults: { type: 'number' },
                                maxHeartbeatAgeHours: { type: 'number' }
                            },
                            default: { enabled: true, maxEntryPoints: 5, maxQueryResults: 50, maxHeartbeatAgeHours: 24 }
                        },
                        websocketPortRange: { anyOf: [{ type: 'null' }, { $ref: '#/definitions/portRange' }], default: { min: 32200, max: 32250 } },
                        websocketHost: { type: 'string', format: 'hostname' },
                        peerDescriptor: { $ref: '#/definitions/peerDescriptor' },
                        maxConnections: { type: 'number', default: 80 },
                        tlsCertificate: {
                            description: 'Files to use for TLS',
                            type: 'object',
                            required: ['certFileName', 'privateKeyFileName'],
                            additionalProperties: false,
                            properties: {
                                certFileName: { type: 'string', description: 'Path of certificate file' },
                                privateKeyFileName: { type: 'string', description: 'Path of private key file' }
                            }
                        },
                        iceServers: {
                            type: 'array',
                            items: {
                                type: 'object',
                                required: ['url', 'port'],
                                additionalProperties: false,
                                properties: {
                                    url: { type: 'string' },
                                    port: { type: 'number' },
                                    username: { type: 'string' },
                                    password: { type: 'string' },
                                    tcp: { type: 'boolean' }
                                }
                            },
                            default: [
                                { url: 'stun:stun.streamr.network', port: 5349 },
                                { url: 'turn:turn.streamr.network', port: 5349, username: 'BrubeckTurn1', password: 'MIlbgtMw4nhpmbgqRrht1Q==' },
                                {
                                    url: 'turn:turn.streamr.network',
                                    port: 5349,
                                    username: 'BrubeckTurn1',
                                    password: 'MIlbgtMw4nhpmbgqRrht1Q==',
                                    tcp: true
                                }
                            ]
                        },
                        webrtcAllowPrivateAddresses: { type: 'boolean', default: false },
                        webrtcDatachannelBufferThresholdLow: { type: 'number', default: 32768 },
                        webrtcDatachannelBufferThresholdHigh: { type: 'number', default: 131072 },
                        maxMessageSize: { type: 'number', default: 1048576 },
                        externalIp: { type: 'string', format: 'ipv4' },
                        webrtcPortRange: { $ref: '#/definitions/portRange', default: { min: 50000, max: 64000 } },
                        networkConnectivityTimeout: { type: 'number', default: 10000 },
                        websocketServerEnableTls: { type: 'boolean', default: true },
                        autoCertifierUrl: { type: 'string', default: 'https://ns1.streamr-nodes.xyz:59833' },
                        autoCertifierConfigFile: { type: 'string', default: '~/.streamr/certificate.json' },
                        geoIpDatabaseFolder: { type: 'string' }
                    },
                    default: {}
                },
                node: {
                    type: 'object',
                    additionalProperties: false,
                    properties: {
                        streamPartitionNeighborTargetCount: { type: 'number', default: 4 },
                        streamPartitionMinPropagationTargets: { type: 'number', default: 2 },
                        acceptProxyConnections: { type: 'boolean', default: false }
                    },
                    default: {}
                }
            },
            default: {}
        },
        contracts: {
            type: 'object',
            additionalProperties: false,
            properties: {
                ethereumNetwork: {
                    type: 'object',
                    additionalProperties: false,
                    properties: { chainId: { type: 'number' }, overrides: { type: 'object' }, highGasPriceStrategy: { type: 'boolean' } },
                    default: {}
                },
                streamRegistryChainAddress: { type: 'string', format: 'ethereum-address' },
                streamStorageRegistryChainAddress: { type: 'string', format: 'ethereum-address' },
                storageNodeRegistryChainAddress: { type: 'string', format: 'ethereum-address' },
                rpcs: { type: 'array', items: { type: 'object', $ref: '#/definitions/rpcProviderConfig' }, minItems: 1 },
                rpcQuorum: { type: 'number', default: 2 },
                theGraphUrl: { type: 'string', format: 'uri' },
                maxConcurrentCalls: { type: 'number', default: 10 },
                pollInterval: { type: 'number', default: 4000 }
            },
            default: {}
        },
        encryption: {
            type: 'object',
            additionalProperties: false,
            properties: {
                litProtocolEnabled: { type: 'boolean', default: false },
                litProtocolLogging: { type: 'boolean', default: false },
                keyRequestTimeout: { type: 'number', default: 30000 },
                maxKeyRequestsPerSecond: { type: 'number', default: 20 },
                rsaKeyLength: { type: 'number', default: 4096 }
            },
            default: {}
        },
        metrics: {
            anyOf: [
                { type: 'boolean' },
                {
                    type: 'object',
                    additionalProperties: false,
                    properties: {
                        periods: {
                            type: 'array',
                            items: {
                                type: 'object',
                                required: ['streamId', 'duration'],
                                properties: { id: { type: 'string' }, duration: { type: 'number' } }
                            }
                        },
                        maxPublishDelay: { type: 'number' }
                    }
                }
            ]
        },
        cache: {
            type: 'object',
            additionalProperties: false,
            properties: { maxSize: { type: 'number', default: 10000 }, maxAge: { type: 'number', default: 86400000 } },
            default: {}
        },
        _timeouts: {
            type: 'object',
            additionalProperties: false,
            properties: {
                theGraph: {
                    type: 'object',
                    additionalProperties: false,
                    properties: {
                        indexTimeout: { type: 'number', default: 60000 },
                        indexPollInterval: { type: 'number', default: 1000 },
                        fetchTimeout: { type: 'number', default: 30000 }
                    },
                    default: {}
                },
                storageNode: {
                    type: 'object',
                    additionalProperties: false,
                    properties: { timeout: { type: 'number', default: 30000 }, retryInterval: { type: 'number', default: 1000 } },
                    default: {}
                },
                ensStreamCreation: {
                    type: 'object',
                    additionalProperties: false,
                    properties: { timeout: { type: 'number', default: 180000 }, retryInterval: { type: 'number', default: 1000 } },
                    default: {}
                },
                jsonRpcTimeout: { type: 'number', default: 30000 }
            },
            default: {}
        }
    },
    definitions: {
        rpcProviderConfig: { type: 'object', required: ['url'], properties: { url: { type: 'string', format: 'uri' } } },
        peerDescriptor: {
            type: 'object',
            additionalProperties: false,
            properties: {
                nodeId: { type: 'string' },
                id: { type: 'string', description: 'legacy: remove this property and make nodeId required' },
                type: { $ref: '#/definitions/nodeType' },
                websocket: { $ref: '#/definitions/connectivityMethod' }
            }
        },
        nodeType: { type: 'string', enum: ['browser', 'nodejs'] },
        connectivityMethod: {
            type: 'object',
            additionalProperties: false,
            required: ['host', 'port', 'tls'],
            properties: { host: { type: 'string' }, port: { type: 'number' }, tls: { type: 'boolean' } }
        },
        portRange: {
            type: 'object',
            additionalProperties: false,
            required: ['min', 'max'],
            properties: { min: { type: 'number' }, max: { type: 'number' } }
        }
    }
}
const schema15 = {
    type: 'object',
    additionalProperties: false,
    required: ['min', 'max'],
    properties: { min: { type: 'number' }, max: { type: 'number' } }
}
const schema17 = { type: 'object', required: ['url'], properties: { url: { type: 'string', format: 'uri' } } }
const func2 = Object.prototype.hasOwnProperty
const formats0 = /^(0x)?[a-zA-Z0-9]{64}$/
const formats2 = /^0x[a-zA-Z0-9]{40}$/
const formats4 = /^(?=.{1,253}\.?$)[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[-0-9a-z]{0,61}[0-9a-z])?)*\.?$/i
const formats6 = /^(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/
const formats14 = /^(?:[a-z][a-z0-9+\-.]*:)(?:\/?\/)?[^\s]*$/i
const schema12 = {
    type: 'object',
    additionalProperties: false,
    properties: {
        nodeId: { type: 'string' },
        id: { type: 'string', description: 'legacy: remove this property and make nodeId required' },
        type: { $ref: '#/definitions/nodeType' },
        websocket: { $ref: '#/definitions/connectivityMethod' }
    }
}
const schema13 = { type: 'string', enum: ['browser', 'nodejs'] }
const schema14 = {
    type: 'object',
    additionalProperties: false,
    required: ['host', 'port', 'tls'],
    properties: { host: { type: 'string' }, port: { type: 'number' }, tls: { type: 'boolean' } }
}
function validate11(data, { instancePath = '', parentData, parentDataProperty, rootData = data } = {}) {
    let vErrors = null
    let errors = 0
    if (errors === 0) {
        if (data && typeof data == 'object' && !Array.isArray(data)) {
            const _errs1 = errors
            for (const key0 in data) {
                if (!(key0 === 'nodeId' || key0 === 'id' || key0 === 'type' || key0 === 'websocket')) {
                    validate11.errors = [
                        {
                            instancePath,
                            schemaPath: '#/additionalProperties',
                            keyword: 'additionalProperties',
                            params: { additionalProperty: key0 },
                            message: 'must NOT have additional properties'
                        }
                    ]
                    return false
                    break
                }
            }
            if (_errs1 === errors) {
                if (data.nodeId !== undefined) {
                    const _errs2 = errors
                    if (typeof data.nodeId !== 'string') {
                        validate11.errors = [
                            {
                                instancePath: instancePath + '/nodeId',
                                schemaPath: '#/properties/nodeId/type',
                                keyword: 'type',
                                params: { type: 'string' },
                                message: 'must be string'
                            }
                        ]
                        return false
                    }
                    var valid0 = _errs2 === errors
                } else {
                    var valid0 = true
                }
                if (valid0) {
                    if (data.id !== undefined) {
                        const _errs4 = errors
                        if (typeof data.id !== 'string') {
                            validate11.errors = [
                                {
                                    instancePath: instancePath + '/id',
                                    schemaPath: '#/properties/id/type',
                                    keyword: 'type',
                                    params: { type: 'string' },
                                    message: 'must be string'
                                }
                            ]
                            return false
                        }
                        var valid0 = _errs4 === errors
                    } else {
                        var valid0 = true
                    }
                    if (valid0) {
                        if (data.type !== undefined) {
                            let data2 = data.type
                            const _errs6 = errors
                            if (typeof data2 !== 'string') {
                                validate11.errors = [
                                    {
                                        instancePath: instancePath + '/type',
                                        schemaPath: '#/definitions/nodeType/type',
                                        keyword: 'type',
                                        params: { type: 'string' },
                                        message: 'must be string'
                                    }
                                ]
                                return false
                            }
                            if (!(data2 === 'browser' || data2 === 'nodejs')) {
                                validate11.errors = [
                                    {
                                        instancePath: instancePath + '/type',
                                        schemaPath: '#/definitions/nodeType/enum',
                                        keyword: 'enum',
                                        params: { allowedValues: schema13.enum },
                                        message: 'must be equal to one of the allowed values'
                                    }
                                ]
                                return false
                            }
                            var valid0 = _errs6 === errors
                        } else {
                            var valid0 = true
                        }
                        if (valid0) {
                            if (data.websocket !== undefined) {
                                let data3 = data.websocket
                                const _errs9 = errors
                                const _errs10 = errors
                                if (errors === _errs10) {
                                    if (data3 && typeof data3 == 'object' && !Array.isArray(data3)) {
                                        let missing0
                                        if (
                                            (data3.host === undefined && (missing0 = 'host')) ||
                                            (data3.port === undefined && (missing0 = 'port')) ||
                                            (data3.tls === undefined && (missing0 = 'tls'))
                                        ) {
                                            validate11.errors = [
                                                {
                                                    instancePath: instancePath + '/websocket',
                                                    schemaPath: '#/definitions/connectivityMethod/required',
                                                    keyword: 'required',
                                                    params: { missingProperty: missing0 },
                                                    message: "must have required property '" + missing0 + "'"
                                                }
                                            ]
                                            return false
                                        } else {
                                            const _errs12 = errors
                                            for (const key1 in data3) {
                                                if (!(key1 === 'host' || key1 === 'port' || key1 === 'tls')) {
                                                    validate11.errors = [
                                                        {
                                                            instancePath: instancePath + '/websocket',
                                                            schemaPath: '#/definitions/connectivityMethod/additionalProperties',
                                                            keyword: 'additionalProperties',
                                                            params: { additionalProperty: key1 },
                                                            message: 'must NOT have additional properties'
                                                        }
                                                    ]
                                                    return false
                                                    break
                                                }
                                            }
                                            if (_errs12 === errors) {
                                                if (data3.host !== undefined) {
                                                    const _errs13 = errors
                                                    if (typeof data3.host !== 'string') {
                                                        validate11.errors = [
                                                            {
                                                                instancePath: instancePath + '/websocket/host',
                                                                schemaPath: '#/definitions/connectivityMethod/properties/host/type',
                                                                keyword: 'type',
                                                                params: { type: 'string' },
                                                                message: 'must be string'
                                                            }
                                                        ]
                                                        return false
                                                    }
                                                    var valid3 = _errs13 === errors
                                                } else {
                                                    var valid3 = true
                                                }
                                                if (valid3) {
                                                    if (data3.port !== undefined) {
                                                        let data5 = data3.port
                                                        const _errs15 = errors
                                                        if (!(typeof data5 == 'number' && isFinite(data5))) {
                                                            validate11.errors = [
                                                                {
                                                                    instancePath: instancePath + '/websocket/port',
                                                                    schemaPath: '#/definitions/connectivityMethod/properties/port/type',
                                                                    keyword: 'type',
                                                                    params: { type: 'number' },
                                                                    message: 'must be number'
                                                                }
                                                            ]
                                                            return false
                                                        }
                                                        var valid3 = _errs15 === errors
                                                    } else {
                                                        var valid3 = true
                                                    }
                                                    if (valid3) {
                                                        if (data3.tls !== undefined) {
                                                            const _errs17 = errors
                                                            if (typeof data3.tls !== 'boolean') {
                                                                validate11.errors = [
                                                                    {
                                                                        instancePath: instancePath + '/websocket/tls',
                                                                        schemaPath: '#/definitions/connectivityMethod/properties/tls/type',
                                                                        keyword: 'type',
                                                                        params: { type: 'boolean' },
                                                                        message: 'must be boolean'
                                                                    }
                                                                ]
                                                                return false
                                                            }
                                                            var valid3 = _errs17 === errors
                                                        } else {
                                                            var valid3 = true
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    } else {
                                        validate11.errors = [
                                            {
                                                instancePath: instancePath + '/websocket',
                                                schemaPath: '#/definitions/connectivityMethod/type',
                                                keyword: 'type',
                                                params: { type: 'object' },
                                                message: 'must be object'
                                            }
                                        ]
                                        return false
                                    }
                                }
                                var valid0 = _errs9 === errors
                            } else {
                                var valid0 = true
                            }
                        }
                    }
                }
            }
        } else {
            validate11.errors = [{ instancePath, schemaPath: '#/type', keyword: 'type', params: { type: 'object' }, message: 'must be object' }]
            return false
        }
    }
    validate11.errors = vErrors
    return errors === 0
}
function validate10(data, { instancePath = '', parentData, parentDataProperty, rootData = data } = {}) {
    /*# sourceURL="config.schema.json" */ let vErrors = null
    let errors = 0
    if (errors === 0) {
        if (data && typeof data == 'object' && !Array.isArray(data)) {
            if (data.logLevel === undefined) {
                data.logLevel = 'info'
            }
            if (data.orderMessages === undefined) {
                data.orderMessages = true
            }
            if (data.gapFill === undefined) {
                data.gapFill = true
            }
            if (data.maxGapRequests === undefined) {
                data.maxGapRequests = 5
            }
            if (data.retryResendAfter === undefined) {
                data.retryResendAfter = 5000
            }
            if (data.gapFillTimeout === undefined) {
                data.gapFillTimeout = 5000
            }
            if (data.gapFillStrategy === undefined) {
                data.gapFillStrategy = 'light'
            }
            if (data.network === undefined) {
                data.network = {}
            }
            if (data.contracts === undefined) {
                data.contracts = {}
            }
            if (data.encryption === undefined) {
                data.encryption = {}
            }
            if (data.cache === undefined) {
                data.cache = {}
            }
            if (data._timeouts === undefined) {
                data._timeouts = {}
            }
            const _errs1 = errors
            for (const key0 in data) {
                if (!func2.call(schema11.properties, key0)) {
                    validate10.errors = [
                        {
                            instancePath,
                            schemaPath: '#/additionalProperties',
                            keyword: 'additionalProperties',
                            params: { additionalProperty: key0 },
                            message: 'must NOT have additional properties'
                        }
                    ]
                    return false
                    break
                }
            }
            if (_errs1 === errors) {
                if (data.environment !== undefined) {
                    let data0 = data.environment
                    const _errs2 = errors
                    if (typeof data0 !== 'string') {
                        validate10.errors = [
                            {
                                instancePath: instancePath + '/environment',
                                schemaPath: '#/properties/environment/type',
                                keyword: 'type',
                                params: { type: 'string' },
                                message: 'must be string'
                            }
                        ]
                        return false
                    }
                    if (!(data0 === 'polygon' || data0 === 'polygonAmoy' || data0 === 'dev2')) {
                        validate10.errors = [
                            {
                                instancePath: instancePath + '/environment',
                                schemaPath: '#/properties/environment/enum',
                                keyword: 'enum',
                                params: { allowedValues: schema11.properties.environment.enum },
                                message: 'must be equal to one of the allowed values'
                            }
                        ]
                        return false
                    }
                    var valid0 = _errs2 === errors
                } else {
                    var valid0 = true
                }
                if (valid0) {
                    if (data.id !== undefined) {
                        const _errs4 = errors
                        if (typeof data.id !== 'string') {
                            validate10.errors = [
                                {
                                    instancePath: instancePath + '/id',
                                    schemaPath: '#/properties/id/type',
                                    keyword: 'type',
                                    params: { type: 'string' },
                                    message: 'must be string'
                                }
                            ]
                            return false
                        }
                        var valid0 = _errs4 === errors
                    } else {
                        var valid0 = true
                    }
                    if (valid0) {
                        let data2 = data.logLevel
                        const _errs6 = errors
                        if (typeof data2 !== 'string') {
                            validate10.errors = [
                                {
                                    instancePath: instancePath + '/logLevel',
                                    schemaPath: '#/properties/logLevel/type',
                                    keyword: 'type',
                                    params: { type: 'string' },
                                    message: 'must be string'
                                }
                            ]
                            return false
                        }
                        if (
                            !(
                                data2 === 'silent' ||
                                data2 === 'fatal' ||
                                data2 === 'error' ||
                                data2 === 'warn' ||
                                data2 === 'info' ||
                                data2 === 'debug' ||
                                data2 === 'trace'
                            )
                        ) {
                            validate10.errors = [
                                {
                                    instancePath: instancePath + '/logLevel',
                                    schemaPath: '#/properties/logLevel/enum',
                                    keyword: 'enum',
                                    params: { allowedValues: schema11.properties.logLevel.enum },
                                    message: 'must be equal to one of the allowed values'
                                }
                            ]
                            return false
                        }
                        var valid0 = _errs6 === errors
                        if (valid0) {
                            if (data.auth !== undefined) {
                                let data3 = data.auth
                                const _errs8 = errors
                                if (errors === _errs8) {
                                    if (data3 && typeof data3 == 'object' && !Array.isArray(data3)) {
                                        const _errs10 = errors
                                        for (const key1 in data3) {
                                            if (!(key1 === 'privateKey' || key1 === 'address' || key1 === 'ethereum')) {
                                                validate10.errors = [
                                                    {
                                                        instancePath: instancePath + '/auth',
                                                        schemaPath: '#/properties/auth/additionalProperties',
                                                        keyword: 'additionalProperties',
                                                        params: { additionalProperty: key1 },
                                                        message: 'must NOT have additional properties'
                                                    }
                                                ]
                                                return false
                                                break
                                            }
                                        }
                                        if (_errs10 === errors) {
                                            if (data3.privateKey !== undefined) {
                                                let data4 = data3.privateKey
                                                const _errs11 = errors
                                                if (errors === _errs11) {
                                                    if (errors === _errs11) {
                                                        if (typeof data4 === 'string') {
                                                            if (!formats0.test(data4)) {
                                                                validate10.errors = [
                                                                    {
                                                                        instancePath: instancePath + '/auth/privateKey',
                                                                        schemaPath: '#/properties/auth/properties/privateKey/format',
                                                                        keyword: 'format',
                                                                        params: { format: 'ethereum-private-key' },
                                                                        message: 'must match format "' + 'ethereum-private-key' + '"'
                                                                    }
                                                                ]
                                                                return false
                                                            }
                                                        } else {
                                                            validate10.errors = [
                                                                {
                                                                    instancePath: instancePath + '/auth/privateKey',
                                                                    schemaPath: '#/properties/auth/properties/privateKey/type',
                                                                    keyword: 'type',
                                                                    params: { type: 'string' },
                                                                    message: 'must be string'
                                                                }
                                                            ]
                                                            return false
                                                        }
                                                    }
                                                }
                                                var valid1 = _errs11 === errors
                                            } else {
                                                var valid1 = true
                                            }
                                            if (valid1) {
                                                if (data3.address !== undefined) {
                                                    let data5 = data3.address
                                                    const _errs13 = errors
                                                    if (errors === _errs13) {
                                                        if (errors === _errs13) {
                                                            if (typeof data5 === 'string') {
                                                                if (!formats2.test(data5)) {
                                                                    validate10.errors = [
                                                                        {
                                                                            instancePath: instancePath + '/auth/address',
                                                                            schemaPath: '#/properties/auth/properties/address/format',
                                                                            keyword: 'format',
                                                                            params: { format: 'ethereum-address' },
                                                                            message: 'must match format "' + 'ethereum-address' + '"'
                                                                        }
                                                                    ]
                                                                    return false
                                                                }
                                                            } else {
                                                                validate10.errors = [
                                                                    {
                                                                        instancePath: instancePath + '/auth/address',
                                                                        schemaPath: '#/properties/auth/properties/address/type',
                                                                        keyword: 'type',
                                                                        params: { type: 'string' },
                                                                        message: 'must be string'
                                                                    }
                                                                ]
                                                                return false
                                                            }
                                                        }
                                                    }
                                                    var valid1 = _errs13 === errors
                                                } else {
                                                    var valid1 = true
                                                }
                                                if (valid1) {
                                                    if (data3.ethereum !== undefined) {
                                                        let data6 = data3.ethereum
                                                        const _errs15 = errors
                                                        if (!(data6 && typeof data6 == 'object' && !Array.isArray(data6))) {
                                                            validate10.errors = [
                                                                {
                                                                    instancePath: instancePath + '/auth/ethereum',
                                                                    schemaPath: '#/properties/auth/properties/ethereum/type',
                                                                    keyword: 'type',
                                                                    params: { type: 'object' },
                                                                    message: 'must be object'
                                                                }
                                                            ]
                                                            return false
                                                        }
                                                        var valid1 = _errs15 === errors
                                                    } else {
                                                        var valid1 = true
                                                    }
                                                }
                                            }
                                        }
                                    } else {
                                        validate10.errors = [
                                            {
                                                instancePath: instancePath + '/auth',
                                                schemaPath: '#/properties/auth/type',
                                                keyword: 'type',
                                                params: { type: 'object' },
                                                message: 'must be object'
                                            }
                                        ]
                                        return false
                                    }
                                }
                                var valid0 = _errs8 === errors
                            } else {
                                var valid0 = true
                            }
                            if (valid0) {
                                const _errs17 = errors
                                if (typeof data.orderMessages !== 'boolean') {
                                    validate10.errors = [
                                        {
                                            instancePath: instancePath + '/orderMessages',
                                            schemaPath: '#/properties/orderMessages/type',
                                            keyword: 'type',
                                            params: { type: 'boolean' },
                                            message: 'must be boolean'
                                        }
                                    ]
                                    return false
                                }
                                var valid0 = _errs17 === errors
                                if (valid0) {
                                    const _errs19 = errors
                                    if (typeof data.gapFill !== 'boolean') {
                                        validate10.errors = [
                                            {
                                                instancePath: instancePath + '/gapFill',
                                                schemaPath: '#/properties/gapFill/type',
                                                keyword: 'type',
                                                params: { type: 'boolean' },
                                                message: 'must be boolean'
                                            }
                                        ]
                                        return false
                                    }
                                    var valid0 = _errs19 === errors
                                    if (valid0) {
                                        let data9 = data.maxGapRequests
                                        const _errs21 = errors
                                        if (!(typeof data9 == 'number' && isFinite(data9))) {
                                            validate10.errors = [
                                                {
                                                    instancePath: instancePath + '/maxGapRequests',
                                                    schemaPath: '#/properties/maxGapRequests/type',
                                                    keyword: 'type',
                                                    params: { type: 'number' },
                                                    message: 'must be number'
                                                }
                                            ]
                                            return false
                                        }
                                        var valid0 = _errs21 === errors
                                        if (valid0) {
                                            let data10 = data.retryResendAfter
                                            const _errs23 = errors
                                            if (!(typeof data10 == 'number' && isFinite(data10))) {
                                                validate10.errors = [
                                                    {
                                                        instancePath: instancePath + '/retryResendAfter',
                                                        schemaPath: '#/properties/retryResendAfter/type',
                                                        keyword: 'type',
                                                        params: { type: 'number' },
                                                        message: 'must be number'
                                                    }
                                                ]
                                                return false
                                            }
                                            var valid0 = _errs23 === errors
                                            if (valid0) {
                                                let data11 = data.gapFillTimeout
                                                const _errs25 = errors
                                                if (!(typeof data11 == 'number' && isFinite(data11))) {
                                                    validate10.errors = [
                                                        {
                                                            instancePath: instancePath + '/gapFillTimeout',
                                                            schemaPath: '#/properties/gapFillTimeout/type',
                                                            keyword: 'type',
                                                            params: { type: 'number' },
                                                            message: 'must be number'
                                                        }
                                                    ]
                                                    return false
                                                }
                                                var valid0 = _errs25 === errors
                                                if (valid0) {
                                                    let data12 = data.gapFillStrategy
                                                    const _errs27 = errors
                                                    if (typeof data12 !== 'string') {
                                                        validate10.errors = [
                                                            {
                                                                instancePath: instancePath + '/gapFillStrategy',
                                                                schemaPath: '#/properties/gapFillStrategy/type',
                                                                keyword: 'type',
                                                                params: { type: 'string' },
                                                                message: 'must be string'
                                                            }
                                                        ]
                                                        return false
                                                    }
                                                    if (!(data12 === 'light' || data12 === 'full')) {
                                                        validate10.errors = [
                                                            {
                                                                instancePath: instancePath + '/gapFillStrategy',
                                                                schemaPath: '#/properties/gapFillStrategy/enum',
                                                                keyword: 'enum',
                                                                params: { allowedValues: schema11.properties.gapFillStrategy.enum },
                                                                message: 'must be equal to one of the allowed values'
                                                            }
                                                        ]
                                                        return false
                                                    }
                                                    var valid0 = _errs27 === errors
                                                    if (valid0) {
                                                        let data13 = data.network
                                                        const _errs29 = errors
                                                        if (errors === _errs29) {
                                                            if (data13 && typeof data13 == 'object' && !Array.isArray(data13)) {
                                                                if (data13.controlLayer === undefined) {
                                                                    data13.controlLayer = {}
                                                                }
                                                                if (data13.node === undefined) {
                                                                    data13.node = {}
                                                                }
                                                                const _errs31 = errors
                                                                for (const key2 in data13) {
                                                                    if (!(key2 === 'controlLayer' || key2 === 'node')) {
                                                                        validate10.errors = [
                                                                            {
                                                                                instancePath: instancePath + '/network',
                                                                                schemaPath: '#/properties/network/additionalProperties',
                                                                                keyword: 'additionalProperties',
                                                                                params: { additionalProperty: key2 },
                                                                                message: 'must NOT have additional properties'
                                                                            }
                                                                        ]
                                                                        return false
                                                                        break
                                                                    }
                                                                }
                                                                if (_errs31 === errors) {
                                                                    let data14 = data13.controlLayer
                                                                    const _errs32 = errors
                                                                    if (errors === _errs32) {
                                                                        if (data14 && typeof data14 == 'object' && !Array.isArray(data14)) {
                                                                            if (data14.entryPointDiscovery === undefined) {
                                                                                data14.entryPointDiscovery = {
                                                                                    enabled: true,
                                                                                    maxEntryPoints: 5,
                                                                                    maxQueryResults: 50,
                                                                                    maxHeartbeatAgeHours: 24
                                                                                }
                                                                            }
                                                                            if (data14.websocketPortRange === undefined) {
                                                                                data14.websocketPortRange = { min: 32200, max: 32250 }
                                                                            }
                                                                            if (data14.maxConnections === undefined) {
                                                                                data14.maxConnections = 80
                                                                            }
                                                                            if (data14.iceServers === undefined) {
                                                                                data14.iceServers = [
                                                                                    { url: 'stun:stun.streamr.network', port: 5349 },
                                                                                    {
                                                                                        url: 'turn:turn.streamr.network',
                                                                                        port: 5349,
                                                                                        username: 'BrubeckTurn1',
                                                                                        password: 'MIlbgtMw4nhpmbgqRrht1Q=='
                                                                                    },
                                                                                    {
                                                                                        url: 'turn:turn.streamr.network',
                                                                                        port: 5349,
                                                                                        username: 'BrubeckTurn1',
                                                                                        password: 'MIlbgtMw4nhpmbgqRrht1Q==',
                                                                                        tcp: true
                                                                                    }
                                                                                ]
                                                                            }
                                                                            if (data14.webrtcAllowPrivateAddresses === undefined) {
                                                                                data14.webrtcAllowPrivateAddresses = false
                                                                            }
                                                                            if (data14.webrtcDatachannelBufferThresholdLow === undefined) {
                                                                                data14.webrtcDatachannelBufferThresholdLow = 32768
                                                                            }
                                                                            if (data14.webrtcDatachannelBufferThresholdHigh === undefined) {
                                                                                data14.webrtcDatachannelBufferThresholdHigh = 131072
                                                                            }
                                                                            if (data14.maxMessageSize === undefined) {
                                                                                data14.maxMessageSize = 1048576
                                                                            }
                                                                            if (data14.webrtcPortRange === undefined) {
                                                                                data14.webrtcPortRange = { min: 50000, max: 64000 }
                                                                            }
                                                                            if (data14.networkConnectivityTimeout === undefined) {
                                                                                data14.networkConnectivityTimeout = 10000
                                                                            }
                                                                            if (data14.websocketServerEnableTls === undefined) {
                                                                                data14.websocketServerEnableTls = true
                                                                            }
                                                                            if (data14.autoCertifierUrl === undefined) {
                                                                                data14.autoCertifierUrl = 'https://ns1.streamr-nodes.xyz:59833'
                                                                            }
                                                                            if (data14.autoCertifierConfigFile === undefined) {
                                                                                data14.autoCertifierConfigFile = '~/.streamr/certificate.json'
                                                                            }
                                                                            const _errs34 = errors
                                                                            for (const key3 in data14) {
                                                                                if (
                                                                                    !func2.call(
                                                                                        schema11.properties.network.properties.controlLayer
                                                                                            .properties,
                                                                                        key3
                                                                                    )
                                                                                ) {
                                                                                    validate10.errors = [
                                                                                        {
                                                                                            instancePath: instancePath + '/network/controlLayer',
                                                                                            schemaPath:
                                                                                                '#/properties/network/properties/controlLayer/additionalProperties',
                                                                                            keyword: 'additionalProperties',
                                                                                            params: { additionalProperty: key3 },
                                                                                            message: 'must NOT have additional properties'
                                                                                        }
                                                                                    ]
                                                                                    return false
                                                                                    break
                                                                                }
                                                                            }
                                                                            if (_errs34 === errors) {
                                                                                if (data14.entryPoints !== undefined) {
                                                                                    let data15 = data14.entryPoints
                                                                                    const _errs35 = errors
                                                                                    if (errors === _errs35) {
                                                                                        if (Array.isArray(data15)) {
                                                                                            var valid4 = true
                                                                                            const len0 = data15.length
                                                                                            for (let i0 = 0; i0 < len0; i0++) {
                                                                                                const _errs37 = errors
                                                                                                if (
                                                                                                    !validate11(data15[i0], {
                                                                                                        instancePath:
                                                                                                            instancePath +
                                                                                                            '/network/controlLayer/entryPoints/' +
                                                                                                            i0,
                                                                                                        parentData: data15,
                                                                                                        parentDataProperty: i0,
                                                                                                        rootData
                                                                                                    })
                                                                                                ) {
                                                                                                    vErrors =
                                                                                                        vErrors === null
                                                                                                            ? validate11.errors
                                                                                                            : vErrors.concat(validate11.errors)
                                                                                                    errors = vErrors.length
                                                                                                }
                                                                                                var valid4 = _errs37 === errors
                                                                                                if (!valid4) {
                                                                                                    break
                                                                                                }
                                                                                            }
                                                                                        } else {
                                                                                            validate10.errors = [
                                                                                                {
                                                                                                    instancePath:
                                                                                                        instancePath +
                                                                                                        '/network/controlLayer/entryPoints',
                                                                                                    schemaPath:
                                                                                                        '#/properties/network/properties/controlLayer/properties/entryPoints/type',
                                                                                                    keyword: 'type',
                                                                                                    params: { type: 'array' },
                                                                                                    message: 'must be array'
                                                                                                }
                                                                                            ]
                                                                                            return false
                                                                                        }
                                                                                    }
                                                                                    var valid3 = _errs35 === errors
                                                                                } else {
                                                                                    var valid3 = true
                                                                                }
                                                                                if (valid3) {
                                                                                    let data17 = data14.entryPointDiscovery
                                                                                    const _errs38 = errors
                                                                                    if (errors === _errs38) {
                                                                                        if (
                                                                                            data17 &&
                                                                                            typeof data17 == 'object' &&
                                                                                            !Array.isArray(data17)
                                                                                        ) {
                                                                                            const _errs40 = errors
                                                                                            for (const key4 in data17) {
                                                                                                if (
                                                                                                    !(
                                                                                                        key4 === 'enabled' ||
                                                                                                        key4 === 'maxEntryPoints' ||
                                                                                                        key4 === 'maxQueryResults' ||
                                                                                                        key4 === 'maxHeartbeatAgeHours'
                                                                                                    )
                                                                                                ) {
                                                                                                    validate10.errors = [
                                                                                                        {
                                                                                                            instancePath:
                                                                                                                instancePath +
                                                                                                                '/network/controlLayer/entryPointDiscovery',
                                                                                                            schemaPath:
                                                                                                                '#/properties/network/properties/controlLayer/properties/entryPointDiscovery/additionalProperties',
                                                                                                            keyword: 'additionalProperties',
                                                                                                            params: { additionalProperty: key4 },
                                                                                                            message:
                                                                                                                'must NOT have additional properties'
                                                                                                        }
                                                                                                    ]
                                                                                                    return false
                                                                                                    break
                                                                                                }
                                                                                            }
                                                                                            if (_errs40 === errors) {
                                                                                                if (data17.enabled !== undefined) {
                                                                                                    const _errs41 = errors
                                                                                                    if (typeof data17.enabled !== 'boolean') {
                                                                                                        validate10.errors = [
                                                                                                            {
                                                                                                                instancePath:
                                                                                                                    instancePath +
                                                                                                                    '/network/controlLayer/entryPointDiscovery/enabled',
                                                                                                                schemaPath:
                                                                                                                    '#/properties/network/properties/controlLayer/properties/entryPointDiscovery/properties/enabled/type',
                                                                                                                keyword: 'type',
                                                                                                                params: { type: 'boolean' },
                                                                                                                message: 'must be boolean'
                                                                                                            }
                                                                                                        ]
                                                                                                        return false
                                                                                                    }
                                                                                                    var valid5 = _errs41 === errors
                                                                                                } else {
                                                                                                    var valid5 = true
                                                                                                }
                                                                                                if (valid5) {
                                                                                                    if (data17.maxEntryPoints !== undefined) {
                                                                                                        let data19 = data17.maxEntryPoints
                                                                                                        const _errs43 = errors
                                                                                                        if (
                                                                                                            !(
                                                                                                                typeof data19 == 'number' &&
                                                                                                                isFinite(data19)
                                                                                                            )
                                                                                                        ) {
                                                                                                            validate10.errors = [
                                                                                                                {
                                                                                                                    instancePath:
                                                                                                                        instancePath +
                                                                                                                        '/network/controlLayer/entryPointDiscovery/maxEntryPoints',
                                                                                                                    schemaPath:
                                                                                                                        '#/properties/network/properties/controlLayer/properties/entryPointDiscovery/properties/maxEntryPoints/type',
                                                                                                                    keyword: 'type',
                                                                                                                    params: { type: 'number' },
                                                                                                                    message: 'must be number'
                                                                                                                }
                                                                                                            ]
                                                                                                            return false
                                                                                                        }
                                                                                                        var valid5 = _errs43 === errors
                                                                                                    } else {
                                                                                                        var valid5 = true
                                                                                                    }
                                                                                                    if (valid5) {
                                                                                                        if (data17.maxQueryResults !== undefined) {
                                                                                                            let data20 = data17.maxQueryResults
                                                                                                            const _errs45 = errors
                                                                                                            if (
                                                                                                                !(
                                                                                                                    typeof data20 == 'number' &&
                                                                                                                    isFinite(data20)
                                                                                                                )
                                                                                                            ) {
                                                                                                                validate10.errors = [
                                                                                                                    {
                                                                                                                        instancePath:
                                                                                                                            instancePath +
                                                                                                                            '/network/controlLayer/entryPointDiscovery/maxQueryResults',
                                                                                                                        schemaPath:
                                                                                                                            '#/properties/network/properties/controlLayer/properties/entryPointDiscovery/properties/maxQueryResults/type',
                                                                                                                        keyword: 'type',
                                                                                                                        params: { type: 'number' },
                                                                                                                        message: 'must be number'
                                                                                                                    }
                                                                                                                ]
                                                                                                                return false
                                                                                                            }
                                                                                                            var valid5 = _errs45 === errors
                                                                                                        } else {
                                                                                                            var valid5 = true
                                                                                                        }
                                                                                                        if (valid5) {
                                                                                                            if (
                                                                                                                data17.maxHeartbeatAgeHours !==
                                                                                                                undefined
                                                                                                            ) {
                                                                                                                let data21 =
                                                                                                                    data17.maxHeartbeatAgeHours
                                                                                                                const _errs47 = errors
                                                                                                                if (
                                                                                                                    !(
                                                                                                                        typeof data21 == 'number' &&
                                                                                                                        isFinite(data21)
                                                                                                                    )
                                                                                                                ) {
                                                                                                                    validate10.errors = [
                                                                                                                        {
                                                                                                                            instancePath:
                                                                                                                                instancePath +
                                                                                                                                '/network/controlLayer/entryPointDiscovery/maxHeartbeatAgeHours',
                                                                                                                            schemaPath:
                                                                                                                                '#/properties/network/properties/controlLayer/properties/entryPointDiscovery/properties/maxHeartbeatAgeHours/type',
                                                                                                                            keyword: 'type',
                                                                                                                            params: {
                                                                                                                                type: 'number'
                                                                                                                            },
                                                                                                                            message: 'must be number'
                                                                                                                        }
                                                                                                                    ]
                                                                                                                    return false
                                                                                                                }
                                                                                                                var valid5 = _errs47 === errors
                                                                                                            } else {
                                                                                                                var valid5 = true
                                                                                                            }
                                                                                                        }
                                                                                                    }
                                                                                                }
                                                                                            }
                                                                                        } else {
                                                                                            validate10.errors = [
                                                                                                {
                                                                                                    instancePath:
                                                                                                        instancePath +
                                                                                                        '/network/controlLayer/entryPointDiscovery',
                                                                                                    schemaPath:
                                                                                                        '#/properties/network/properties/controlLayer/properties/entryPointDiscovery/type',
                                                                                                    keyword: 'type',
                                                                                                    params: { type: 'object' },
                                                                                                    message: 'must be object'
                                                                                                }
                                                                                            ]
                                                                                            return false
                                                                                        }
                                                                                    }
                                                                                    var valid3 = _errs38 === errors
                                                                                    if (valid3) {
                                                                                        let data22 = data14.websocketPortRange
                                                                                        const _errs49 = errors
                                                                                        const _errs50 = errors
                                                                                        let valid6 = false
                                                                                        const _errs51 = errors
                                                                                        if (data22 !== null) {
                                                                                            const err0 = {
                                                                                                instancePath:
                                                                                                    instancePath +
                                                                                                    '/network/controlLayer/websocketPortRange',
                                                                                                schemaPath:
                                                                                                    '#/properties/network/properties/controlLayer/properties/websocketPortRange/anyOf/0/type',
                                                                                                keyword: 'type',
                                                                                                params: { type: 'null' },
                                                                                                message: 'must be null'
                                                                                            }
                                                                                            if (vErrors === null) {
                                                                                                vErrors = [err0]
                                                                                            } else {
                                                                                                vErrors.push(err0)
                                                                                            }
                                                                                            errors++
                                                                                        }
                                                                                        var _valid0 = _errs51 === errors
                                                                                        valid6 = valid6 || _valid0
                                                                                        if (!valid6) {
                                                                                            const _errs53 = errors
                                                                                            const _errs54 = errors
                                                                                            if (errors === _errs54) {
                                                                                                if (
                                                                                                    data22 &&
                                                                                                    typeof data22 == 'object' &&
                                                                                                    !Array.isArray(data22)
                                                                                                ) {
                                                                                                    let missing0
                                                                                                    if (
                                                                                                        (data22.min === undefined &&
                                                                                                            (missing0 = 'min')) ||
                                                                                                        (data22.max === undefined &&
                                                                                                            (missing0 = 'max'))
                                                                                                    ) {
                                                                                                        const err1 = {
                                                                                                            instancePath:
                                                                                                                instancePath +
                                                                                                                '/network/controlLayer/websocketPortRange',
                                                                                                            schemaPath:
                                                                                                                '#/definitions/portRange/required',
                                                                                                            keyword: 'required',
                                                                                                            params: { missingProperty: missing0 },
                                                                                                            message:
                                                                                                                "must have required property '" +
                                                                                                                missing0 +
                                                                                                                "'"
                                                                                                        }
                                                                                                        if (vErrors === null) {
                                                                                                            vErrors = [err1]
                                                                                                        } else {
                                                                                                            vErrors.push(err1)
                                                                                                        }
                                                                                                        errors++
                                                                                                    } else {
                                                                                                        const _errs56 = errors
                                                                                                        for (const key5 in data22) {
                                                                                                            if (!(key5 === 'min' || key5 === 'max')) {
                                                                                                                const err2 = {
                                                                                                                    instancePath:
                                                                                                                        instancePath +
                                                                                                                        '/network/controlLayer/websocketPortRange',
                                                                                                                    schemaPath:
                                                                                                                        '#/definitions/portRange/additionalProperties',
                                                                                                                    keyword: 'additionalProperties',
                                                                                                                    params: {
                                                                                                                        additionalProperty: key5
                                                                                                                    },
                                                                                                                    message:
                                                                                                                        'must NOT have additional properties'
                                                                                                                }
                                                                                                                if (vErrors === null) {
                                                                                                                    vErrors = [err2]
                                                                                                                } else {
                                                                                                                    vErrors.push(err2)
                                                                                                                }
                                                                                                                errors++
                                                                                                                break
                                                                                                            }
                                                                                                        }
                                                                                                        if (_errs56 === errors) {
                                                                                                            if (data22.min !== undefined) {
                                                                                                                let data23 = data22.min
                                                                                                                const _errs57 = errors
                                                                                                                if (
                                                                                                                    !(
                                                                                                                        typeof data23 == 'number' &&
                                                                                                                        isFinite(data23)
                                                                                                                    )
                                                                                                                ) {
                                                                                                                    const err3 = {
                                                                                                                        instancePath:
                                                                                                                            instancePath +
                                                                                                                            '/network/controlLayer/websocketPortRange/min',
                                                                                                                        schemaPath:
                                                                                                                            '#/definitions/portRange/properties/min/type',
                                                                                                                        keyword: 'type',
                                                                                                                        params: { type: 'number' },
                                                                                                                        message: 'must be number'
                                                                                                                    }
                                                                                                                    if (vErrors === null) {
                                                                                                                        vErrors = [err3]
                                                                                                                    } else {
                                                                                                                        vErrors.push(err3)
                                                                                                                    }
                                                                                                                    errors++
                                                                                                                }
                                                                                                                var valid8 = _errs57 === errors
                                                                                                            } else {
                                                                                                                var valid8 = true
                                                                                                            }
                                                                                                            if (valid8) {
                                                                                                                if (data22.max !== undefined) {
                                                                                                                    let data24 = data22.max
                                                                                                                    const _errs59 = errors
                                                                                                                    if (
                                                                                                                        !(
                                                                                                                            typeof data24 ==
                                                                                                                                'number' &&
                                                                                                                            isFinite(data24)
                                                                                                                        )
                                                                                                                    ) {
                                                                                                                        const err4 = {
                                                                                                                            instancePath:
                                                                                                                                instancePath +
                                                                                                                                '/network/controlLayer/websocketPortRange/max',
                                                                                                                            schemaPath:
                                                                                                                                '#/definitions/portRange/properties/max/type',
                                                                                                                            keyword: 'type',
                                                                                                                            params: {
                                                                                                                                type: 'number'
                                                                                                                            },
                                                                                                                            message: 'must be number'
                                                                                                                        }
                                                                                                                        if (vErrors === null) {
                                                                                                                            vErrors = [err4]
                                                                                                                        } else {
                                                                                                                            vErrors.push(err4)
                                                                                                                        }
                                                                                                                        errors++
                                                                                                                    }
                                                                                                                    var valid8 = _errs59 === errors
                                                                                                                } else {
                                                                                                                    var valid8 = true
                                                                                                                }
                                                                                                            }
                                                                                                        }
                                                                                                    }
                                                                                                } else {
                                                                                                    const err5 = {
                                                                                                        instancePath:
                                                                                                            instancePath +
                                                                                                            '/network/controlLayer/websocketPortRange',
                                                                                                        schemaPath: '#/definitions/portRange/type',
                                                                                                        keyword: 'type',
                                                                                                        params: { type: 'object' },
                                                                                                        message: 'must be object'
                                                                                                    }
                                                                                                    if (vErrors === null) {
                                                                                                        vErrors = [err5]
                                                                                                    } else {
                                                                                                        vErrors.push(err5)
                                                                                                    }
                                                                                                    errors++
                                                                                                }
                                                                                            }
                                                                                            var _valid0 = _errs53 === errors
                                                                                            valid6 = valid6 || _valid0
                                                                                        }
                                                                                        if (!valid6) {
                                                                                            const err6 = {
                                                                                                instancePath:
                                                                                                    instancePath +
                                                                                                    '/network/controlLayer/websocketPortRange',
                                                                                                schemaPath:
                                                                                                    '#/properties/network/properties/controlLayer/properties/websocketPortRange/anyOf',
                                                                                                keyword: 'anyOf',
                                                                                                params: {},
                                                                                                message: 'must match a schema in anyOf'
                                                                                            }
                                                                                            if (vErrors === null) {
                                                                                                vErrors = [err6]
                                                                                            } else {
                                                                                                vErrors.push(err6)
                                                                                            }
                                                                                            errors++
                                                                                            validate10.errors = vErrors
                                                                                            return false
                                                                                        } else {
                                                                                            errors = _errs50
                                                                                            if (vErrors !== null) {
                                                                                                if (_errs50) {
                                                                                                    vErrors.length = _errs50
                                                                                                } else {
                                                                                                    vErrors = null
                                                                                                }
                                                                                            }
                                                                                        }
                                                                                        var valid3 = _errs49 === errors
                                                                                        if (valid3) {
                                                                                            if (data14.websocketHost !== undefined) {
                                                                                                let data25 = data14.websocketHost
                                                                                                const _errs61 = errors
                                                                                                if (errors === _errs61) {
                                                                                                    if (errors === _errs61) {
                                                                                                        if (typeof data25 === 'string') {
                                                                                                            if (!formats4.test(data25)) {
                                                                                                                validate10.errors = [
                                                                                                                    {
                                                                                                                        instancePath:
                                                                                                                            instancePath +
                                                                                                                            '/network/controlLayer/websocketHost',
                                                                                                                        schemaPath:
                                                                                                                            '#/properties/network/properties/controlLayer/properties/websocketHost/format',
                                                                                                                        keyword: 'format',
                                                                                                                        params: {
                                                                                                                            format: 'hostname'
                                                                                                                        },
                                                                                                                        message:
                                                                                                                            'must match format "' +
                                                                                                                            'hostname' +
                                                                                                                            '"'
                                                                                                                    }
                                                                                                                ]
                                                                                                                return false
                                                                                                            }
                                                                                                        } else {
                                                                                                            validate10.errors = [
                                                                                                                {
                                                                                                                    instancePath:
                                                                                                                        instancePath +
                                                                                                                        '/network/controlLayer/websocketHost',
                                                                                                                    schemaPath:
                                                                                                                        '#/properties/network/properties/controlLayer/properties/websocketHost/type',
                                                                                                                    keyword: 'type',
                                                                                                                    params: { type: 'string' },
                                                                                                                    message: 'must be string'
                                                                                                                }
                                                                                                            ]
                                                                                                            return false
                                                                                                        }
                                                                                                    }
                                                                                                }
                                                                                                var valid3 = _errs61 === errors
                                                                                            } else {
                                                                                                var valid3 = true
                                                                                            }
                                                                                            if (valid3) {
                                                                                                if (data14.peerDescriptor !== undefined) {
                                                                                                    const _errs63 = errors
                                                                                                    if (
                                                                                                        !validate11(data14.peerDescriptor, {
                                                                                                            instancePath:
                                                                                                                instancePath +
                                                                                                                '/network/controlLayer/peerDescriptor',
                                                                                                            parentData: data14,
                                                                                                            parentDataProperty: 'peerDescriptor',
                                                                                                            rootData
                                                                                                        })
                                                                                                    ) {
                                                                                                        vErrors =
                                                                                                            vErrors === null
                                                                                                                ? validate11.errors
                                                                                                                : vErrors.concat(validate11.errors)
                                                                                                        errors = vErrors.length
                                                                                                    }
                                                                                                    var valid3 = _errs63 === errors
                                                                                                } else {
                                                                                                    var valid3 = true
                                                                                                }
                                                                                                if (valid3) {
                                                                                                    let data27 = data14.maxConnections
                                                                                                    const _errs64 = errors
                                                                                                    if (
                                                                                                        !(
                                                                                                            typeof data27 == 'number' &&
                                                                                                            isFinite(data27)
                                                                                                        )
                                                                                                    ) {
                                                                                                        validate10.errors = [
                                                                                                            {
                                                                                                                instancePath:
                                                                                                                    instancePath +
                                                                                                                    '/network/controlLayer/maxConnections',
                                                                                                                schemaPath:
                                                                                                                    '#/properties/network/properties/controlLayer/properties/maxConnections/type',
                                                                                                                keyword: 'type',
                                                                                                                params: { type: 'number' },
                                                                                                                message: 'must be number'
                                                                                                            }
                                                                                                        ]
                                                                                                        return false
                                                                                                    }
                                                                                                    var valid3 = _errs64 === errors
                                                                                                    if (valid3) {
                                                                                                        if (data14.tlsCertificate !== undefined) {
                                                                                                            let data28 = data14.tlsCertificate
                                                                                                            const _errs66 = errors
                                                                                                            if (errors === _errs66) {
                                                                                                                if (
                                                                                                                    data28 &&
                                                                                                                    typeof data28 == 'object' &&
                                                                                                                    !Array.isArray(data28)
                                                                                                                ) {
                                                                                                                    let missing1
                                                                                                                    if (
                                                                                                                        (data28.certFileName ===
                                                                                                                            undefined &&
                                                                                                                            (missing1 =
                                                                                                                                'certFileName')) ||
                                                                                                                        (data28.privateKeyFileName ===
                                                                                                                            undefined &&
                                                                                                                            (missing1 =
                                                                                                                                'privateKeyFileName'))
                                                                                                                    ) {
                                                                                                                        validate10.errors = [
                                                                                                                            {
                                                                                                                                instancePath:
                                                                                                                                    instancePath +
                                                                                                                                    '/network/controlLayer/tlsCertificate',
                                                                                                                                schemaPath:
                                                                                                                                    '#/properties/network/properties/controlLayer/properties/tlsCertificate/required',
                                                                                                                                keyword: 'required',
                                                                                                                                params: {
                                                                                                                                    missingProperty:
                                                                                                                                        missing1
                                                                                                                                },
                                                                                                                                message:
                                                                                                                                    "must have required property '" +
                                                                                                                                    missing1 +
                                                                                                                                    "'"
                                                                                                                            }
                                                                                                                        ]
                                                                                                                        return false
                                                                                                                    } else {
                                                                                                                        const _errs68 = errors
                                                                                                                        for (const key6 in data28) {
                                                                                                                            if (
                                                                                                                                !(
                                                                                                                                    key6 ===
                                                                                                                                        'certFileName' ||
                                                                                                                                    key6 ===
                                                                                                                                        'privateKeyFileName'
                                                                                                                                )
                                                                                                                            ) {
                                                                                                                                validate10.errors = [
                                                                                                                                    {
                                                                                                                                        instancePath:
                                                                                                                                            instancePath +
                                                                                                                                            '/network/controlLayer/tlsCertificate',
                                                                                                                                        schemaPath:
                                                                                                                                            '#/properties/network/properties/controlLayer/properties/tlsCertificate/additionalProperties',
                                                                                                                                        keyword:
                                                                                                                                            'additionalProperties',
                                                                                                                                        params: {
                                                                                                                                            additionalProperty:
                                                                                                                                                key6
                                                                                                                                        },
                                                                                                                                        message:
                                                                                                                                            'must NOT have additional properties'
                                                                                                                                    }
                                                                                                                                ]
                                                                                                                                return false
                                                                                                                                break
                                                                                                                            }
                                                                                                                        }
                                                                                                                        if (_errs68 === errors) {
                                                                                                                            if (
                                                                                                                                data28.certFileName !==
                                                                                                                                undefined
                                                                                                                            ) {
                                                                                                                                const _errs69 = errors
                                                                                                                                if (
                                                                                                                                    typeof data28.certFileName !==
                                                                                                                                    'string'
                                                                                                                                ) {
                                                                                                                                    validate10.errors =
                                                                                                                                        [
                                                                                                                                            {
                                                                                                                                                instancePath:
                                                                                                                                                    instancePath +
                                                                                                                                                    '/network/controlLayer/tlsCertificate/certFileName',
                                                                                                                                                schemaPath:
                                                                                                                                                    '#/properties/network/properties/controlLayer/properties/tlsCertificate/properties/certFileName/type',
                                                                                                                                                keyword:
                                                                                                                                                    'type',
                                                                                                                                                params: {
                                                                                                                                                    type: 'string'
                                                                                                                                                },
                                                                                                                                                message:
                                                                                                                                                    'must be string'
                                                                                                                                            }
                                                                                                                                        ]
                                                                                                                                    return false
                                                                                                                                }
                                                                                                                                var valid9 =
                                                                                                                                    _errs69 === errors
                                                                                                                            } else {
                                                                                                                                var valid9 = true
                                                                                                                            }
                                                                                                                            if (valid9) {
                                                                                                                                if (
                                                                                                                                    data28.privateKeyFileName !==
                                                                                                                                    undefined
                                                                                                                                ) {
                                                                                                                                    const _errs71 =
                                                                                                                                        errors
                                                                                                                                    if (
                                                                                                                                        typeof data28.privateKeyFileName !==
                                                                                                                                        'string'
                                                                                                                                    ) {
                                                                                                                                        validate10.errors =
                                                                                                                                            [
                                                                                                                                                {
                                                                                                                                                    instancePath:
                                                                                                                                                        instancePath +
                                                                                                                                                        '/network/controlLayer/tlsCertificate/privateKeyFileName',
                                                                                                                                                    schemaPath:
                                                                                                                                                        '#/properties/network/properties/controlLayer/properties/tlsCertificate/properties/privateKeyFileName/type',
                                                                                                                                                    keyword:
                                                                                                                                                        'type',
                                                                                                                                                    params: {
                                                                                                                                                        type: 'string'
                                                                                                                                                    },
                                                                                                                                                    message:
                                                                                                                                                        'must be string'
                                                                                                                                                }
                                                                                                                                            ]
                                                                                                                                        return false
                                                                                                                                    }
                                                                                                                                    var valid9 =
                                                                                                                                        _errs71 ===
                                                                                                                                        errors
                                                                                                                                } else {
                                                                                                                                    var valid9 = true
                                                                                                                                }
                                                                                                                            }
                                                                                                                        }
                                                                                                                    }
                                                                                                                } else {
                                                                                                                    validate10.errors = [
                                                                                                                        {
                                                                                                                            instancePath:
                                                                                                                                instancePath +
                                                                                                                                '/network/controlLayer/tlsCertificate',
                                                                                                                            schemaPath:
                                                                                                                                '#/properties/network/properties/controlLayer/properties/tlsCertificate/type',
                                                                                                                            keyword: 'type',
                                                                                                                            params: {
                                                                                                                                type: 'object'
                                                                                                                            },
                                                                                                                            message: 'must be object'
                                                                                                                        }
                                                                                                                    ]
                                                                                                                    return false
                                                                                                                }
                                                                                                            }
                                                                                                            var valid3 = _errs66 === errors
                                                                                                        } else {
                                                                                                            var valid3 = true
                                                                                                        }
                                                                                                        if (valid3) {
                                                                                                            let data31 = data14.iceServers
                                                                                                            const _errs73 = errors
                                                                                                            if (errors === _errs73) {
                                                                                                                if (Array.isArray(data31)) {
                                                                                                                    var valid10 = true
                                                                                                                    const len1 = data31.length
                                                                                                                    for (
                                                                                                                        let i1 = 0;
                                                                                                                        i1 < len1;
                                                                                                                        i1++
                                                                                                                    ) {
                                                                                                                        let data32 = data31[i1]
                                                                                                                        const _errs75 = errors
                                                                                                                        if (errors === _errs75) {
                                                                                                                            if (
                                                                                                                                data32 &&
                                                                                                                                typeof data32 ==
                                                                                                                                    'object' &&
                                                                                                                                !Array.isArray(data32)
                                                                                                                            ) {
                                                                                                                                let missing2
                                                                                                                                if (
                                                                                                                                    (data32.url ===
                                                                                                                                        undefined &&
                                                                                                                                        (missing2 =
                                                                                                                                            'url')) ||
                                                                                                                                    (data32.port ===
                                                                                                                                        undefined &&
                                                                                                                                        (missing2 =
                                                                                                                                            'port'))
                                                                                                                                ) {
                                                                                                                                    validate10.errors =
                                                                                                                                        [
                                                                                                                                            {
                                                                                                                                                instancePath:
                                                                                                                                                    instancePath +
                                                                                                                                                    '/network/controlLayer/iceServers/' +
                                                                                                                                                    i1,
                                                                                                                                                schemaPath:
                                                                                                                                                    '#/properties/network/properties/controlLayer/properties/iceServers/items/required',
                                                                                                                                                keyword:
                                                                                                                                                    'required',
                                                                                                                                                params: {
                                                                                                                                                    missingProperty:
                                                                                                                                                        missing2
                                                                                                                                                },
                                                                                                                                                message:
                                                                                                                                                    "must have required property '" +
                                                                                                                                                    missing2 +
                                                                                                                                                    "'"
                                                                                                                                            }
                                                                                                                                        ]
                                                                                                                                    return false
                                                                                                                                } else {
                                                                                                                                    const _errs77 =
                                                                                                                                        errors
                                                                                                                                    for (const key7 in data32) {
                                                                                                                                        if (
                                                                                                                                            !(
                                                                                                                                                key7 ===
                                                                                                                                                    'url' ||
                                                                                                                                                key7 ===
                                                                                                                                                    'port' ||
                                                                                                                                                key7 ===
                                                                                                                                                    'username' ||
                                                                                                                                                key7 ===
                                                                                                                                                    'password' ||
                                                                                                                                                key7 ===
                                                                                                                                                    'tcp'
                                                                                                                                            )
                                                                                                                                        ) {
                                                                                                                                            validate10.errors =
                                                                                                                                                [
                                                                                                                                                    {
                                                                                                                                                        instancePath:
                                                                                                                                                            instancePath +
                                                                                                                                                            '/network/controlLayer/iceServers/' +
                                                                                                                                                            i1,
                                                                                                                                                        schemaPath:
                                                                                                                                                            '#/properties/network/properties/controlLayer/properties/iceServers/items/additionalProperties',
                                                                                                                                                        keyword:
                                                                                                                                                            'additionalProperties',
                                                                                                                                                        params: {
                                                                                                                                                            additionalProperty:
                                                                                                                                                                key7
                                                                                                                                                        },
                                                                                                                                                        message:
                                                                                                                                                            'must NOT have additional properties'
                                                                                                                                                    }
                                                                                                                                                ]
                                                                                                                                            return false
                                                                                                                                            break
                                                                                                                                        }
                                                                                                                                    }
                                                                                                                                    if (
                                                                                                                                        _errs77 ===
                                                                                                                                        errors
                                                                                                                                    ) {
                                                                                                                                        if (
                                                                                                                                            data32.url !==
                                                                                                                                            undefined
                                                                                                                                        ) {
                                                                                                                                            const _errs78 =
                                                                                                                                                errors
                                                                                                                                            if (
                                                                                                                                                typeof data32.url !==
                                                                                                                                                'string'
                                                                                                                                            ) {
                                                                                                                                                validate10.errors =
                                                                                                                                                    [
                                                                                                                                                        {
                                                                                                                                                            instancePath:
                                                                                                                                                                instancePath +
                                                                                                                                                                '/network/controlLayer/iceServers/' +
                                                                                                                                                                i1 +
                                                                                                                                                                '/url',
                                                                                                                                                            schemaPath:
                                                                                                                                                                '#/properties/network/properties/controlLayer/properties/iceServers/items/properties/url/type',
                                                                                                                                                            keyword:
                                                                                                                                                                'type',
                                                                                                                                                            params: {
                                                                                                                                                                type: 'string'
                                                                                                                                                            },
                                                                                                                                                            message:
                                                                                                                                                                'must be string'
                                                                                                                                                        }
                                                                                                                                                    ]
                                                                                                                                                return false
                                                                                                                                            }
                                                                                                                                            var valid11 =
                                                                                                                                                _errs78 ===
                                                                                                                                                errors
                                                                                                                                        } else {
                                                                                                                                            var valid11 = true
                                                                                                                                        }
                                                                                                                                        if (valid11) {
                                                                                                                                            if (
                                                                                                                                                data32.port !==
                                                                                                                                                undefined
                                                                                                                                            ) {
                                                                                                                                                let data34 =
                                                                                                                                                    data32.port
                                                                                                                                                const _errs80 =
                                                                                                                                                    errors
                                                                                                                                                if (
                                                                                                                                                    !(
                                                                                                                                                        typeof data34 ==
                                                                                                                                                            'number' &&
                                                                                                                                                        isFinite(
                                                                                                                                                            data34
                                                                                                                                                        )
                                                                                                                                                    )
                                                                                                                                                ) {
                                                                                                                                                    validate10.errors =
                                                                                                                                                        [
                                                                                                                                                            {
                                                                                                                                                                instancePath:
                                                                                                                                                                    instancePath +
                                                                                                                                                                    '/network/controlLayer/iceServers/' +
                                                                                                                                                                    i1 +
                                                                                                                                                                    '/port',
                                                                                                                                                                schemaPath:
                                                                                                                                                                    '#/properties/network/properties/controlLayer/properties/iceServers/items/properties/port/type',
                                                                                                                                                                keyword:
                                                                                                                                                                    'type',
                                                                                                                                                                params: {
                                                                                                                                                                    type: 'number'
                                                                                                                                                                },
                                                                                                                                                                message:
                                                                                                                                                                    'must be number'
                                                                                                                                                            }
                                                                                                                                                        ]
                                                                                                                                                    return false
                                                                                                                                                }
                                                                                                                                                var valid11 =
                                                                                                                                                    _errs80 ===
                                                                                                                                                    errors
                                                                                                                                            } else {
                                                                                                                                                var valid11 = true
                                                                                                                                            }
                                                                                                                                            if (
                                                                                                                                                valid11
                                                                                                                                            ) {
                                                                                                                                                if (
                                                                                                                                                    data32.username !==
                                                                                                                                                    undefined
                                                                                                                                                ) {
                                                                                                                                                    const _errs82 =
                                                                                                                                                        errors
                                                                                                                                                    if (
                                                                                                                                                        typeof data32.username !==
                                                                                                                                                        'string'
                                                                                                                                                    ) {
                                                                                                                                                        validate10.errors =
                                                                                                                                                            [
                                                                                                                                                                {
                                                                                                                                                                    instancePath:
                                                                                                                                                                        instancePath +
                                                                                                                                                                        '/network/controlLayer/iceServers/' +
                                                                                                                                                                        i1 +
                                                                                                                                                                        '/username',
                                                                                                                                                                    schemaPath:
                                                                                                                                                                        '#/properties/network/properties/controlLayer/properties/iceServers/items/properties/username/type',
                                                                                                                                                                    keyword:
                                                                                                                                                                        'type',
                                                                                                                                                                    params: {
                                                                                                                                                                        type: 'string'
                                                                                                                                                                    },
                                                                                                                                                                    message:
                                                                                                                                                                        'must be string'
                                                                                                                                                                }
                                                                                                                                                            ]
                                                                                                                                                        return false
                                                                                                                                                    }
                                                                                                                                                    var valid11 =
                                                                                                                                                        _errs82 ===
                                                                                                                                                        errors
                                                                                                                                                } else {
                                                                                                                                                    var valid11 = true
                                                                                                                                                }
                                                                                                                                                if (
                                                                                                                                                    valid11
                                                                                                                                                ) {
                                                                                                                                                    if (
                                                                                                                                                        data32.password !==
                                                                                                                                                        undefined
                                                                                                                                                    ) {
                                                                                                                                                        const _errs84 =
                                                                                                                                                            errors
                                                                                                                                                        if (
                                                                                                                                                            typeof data32.password !==
                                                                                                                                                            'string'
                                                                                                                                                        ) {
                                                                                                                                                            validate10.errors =
                                                                                                                                                                [
                                                                                                                                                                    {
                                                                                                                                                                        instancePath:
                                                                                                                                                                            instancePath +
                                                                                                                                                                            '/network/controlLayer/iceServers/' +
                                                                                                                                                                            i1 +
                                                                                                                                                                            '/password',
                                                                                                                                                                        schemaPath:
                                                                                                                                                                            '#/properties/network/properties/controlLayer/properties/iceServers/items/properties/password/type',
                                                                                                                                                                        keyword:
                                                                                                                                                                            'type',
                                                                                                                                                                        params: {
                                                                                                                                                                            type: 'string'
                                                                                                                                                                        },
                                                                                                                                                                        message:
                                                                                                                                                                            'must be string'
                                                                                                                                                                    }
                                                                                                                                                                ]
                                                                                                                                                            return false
                                                                                                                                                        }
                                                                                                                                                        var valid11 =
                                                                                                                                                            _errs84 ===
                                                                                                                                                            errors
                                                                                                                                                    } else {
                                                                                                                                                        var valid11 = true
                                                                                                                                                    }
                                                                                                                                                    if (
                                                                                                                                                        valid11
                                                                                                                                                    ) {
                                                                                                                                                        if (
                                                                                                                                                            data32.tcp !==
                                                                                                                                                            undefined
                                                                                                                                                        ) {
                                                                                                                                                            const _errs86 =
                                                                                                                                                                errors
                                                                                                                                                            if (
                                                                                                                                                                typeof data32.tcp !==
                                                                                                                                                                'boolean'
                                                                                                                                                            ) {
                                                                                                                                                                validate10.errors =
                                                                                                                                                                    [
                                                                                                                                                                        {
                                                                                                                                                                            instancePath:
                                                                                                                                                                                instancePath +
                                                                                                                                                                                '/network/controlLayer/iceServers/' +
                                                                                                                                                                                i1 +
                                                                                                                                                                                '/tcp',
                                                                                                                                                                            schemaPath:
                                                                                                                                                                                '#/properties/network/properties/controlLayer/properties/iceServers/items/properties/tcp/type',
                                                                                                                                                                            keyword:
                                                                                                                                                                                'type',
                                                                                                                                                                            params: {
                                                                                                                                                                                type: 'boolean'
                                                                                                                                                                            },
                                                                                                                                                                            message:
                                                                                                                                                                                'must be boolean'
                                                                                                                                                                        }
                                                                                                                                                                    ]
                                                                                                                                                                return false
                                                                                                                                                            }
                                                                                                                                                            var valid11 =
                                                                                                                                                                _errs86 ===
                                                                                                                                                                errors
                                                                                                                                                        } else {
                                                                                                                                                            var valid11 = true
                                                                                                                                                        }
                                                                                                                                                    }
                                                                                                                                                }
                                                                                                                                            }
                                                                                                                                        }
                                                                                                                                    }
                                                                                                                                }
                                                                                                                            } else {
                                                                                                                                validate10.errors = [
                                                                                                                                    {
                                                                                                                                        instancePath:
                                                                                                                                            instancePath +
                                                                                                                                            '/network/controlLayer/iceServers/' +
                                                                                                                                            i1,
                                                                                                                                        schemaPath:
                                                                                                                                            '#/properties/network/properties/controlLayer/properties/iceServers/items/type',
                                                                                                                                        keyword:
                                                                                                                                            'type',
                                                                                                                                        params: {
                                                                                                                                            type: 'object'
                                                                                                                                        },
                                                                                                                                        message:
                                                                                                                                            'must be object'
                                                                                                                                    }
                                                                                                                                ]
                                                                                                                                return false
                                                                                                                            }
                                                                                                                        }
                                                                                                                        var valid10 =
                                                                                                                            _errs75 === errors
                                                                                                                        if (!valid10) {
                                                                                                                            break
                                                                                                                        }
                                                                                                                    }
                                                                                                                } else {
                                                                                                                    validate10.errors = [
                                                                                                                        {
                                                                                                                            instancePath:
                                                                                                                                instancePath +
                                                                                                                                '/network/controlLayer/iceServers',
                                                                                                                            schemaPath:
                                                                                                                                '#/properties/network/properties/controlLayer/properties/iceServers/type',
                                                                                                                            keyword: 'type',
                                                                                                                            params: { type: 'array' },
                                                                                                                            message: 'must be array'
                                                                                                                        }
                                                                                                                    ]
                                                                                                                    return false
                                                                                                                }
                                                                                                            }
                                                                                                            var valid3 = _errs73 === errors
                                                                                                            if (valid3) {
                                                                                                                const _errs88 = errors
                                                                                                                if (
                                                                                                                    typeof data14.webrtcAllowPrivateAddresses !==
                                                                                                                    'boolean'
                                                                                                                ) {
                                                                                                                    validate10.errors = [
                                                                                                                        {
                                                                                                                            instancePath:
                                                                                                                                instancePath +
                                                                                                                                '/network/controlLayer/webrtcAllowPrivateAddresses',
                                                                                                                            schemaPath:
                                                                                                                                '#/properties/network/properties/controlLayer/properties/webrtcAllowPrivateAddresses/type',
                                                                                                                            keyword: 'type',
                                                                                                                            params: {
                                                                                                                                type: 'boolean'
                                                                                                                            },
                                                                                                                            message: 'must be boolean'
                                                                                                                        }
                                                                                                                    ]
                                                                                                                    return false
                                                                                                                }
                                                                                                                var valid3 = _errs88 === errors
                                                                                                                if (valid3) {
                                                                                                                    let data39 =
                                                                                                                        data14.webrtcDatachannelBufferThresholdLow
                                                                                                                    const _errs90 = errors
                                                                                                                    if (
                                                                                                                        !(
                                                                                                                            typeof data39 ==
                                                                                                                                'number' &&
                                                                                                                            isFinite(data39)
                                                                                                                        )
                                                                                                                    ) {
                                                                                                                        validate10.errors = [
                                                                                                                            {
                                                                                                                                instancePath:
                                                                                                                                    instancePath +
                                                                                                                                    '/network/controlLayer/webrtcDatachannelBufferThresholdLow',
                                                                                                                                schemaPath:
                                                                                                                                    '#/properties/network/properties/controlLayer/properties/webrtcDatachannelBufferThresholdLow/type',
                                                                                                                                keyword: 'type',
                                                                                                                                params: {
                                                                                                                                    type: 'number'
                                                                                                                                },
                                                                                                                                message:
                                                                                                                                    'must be number'
                                                                                                                            }
                                                                                                                        ]
                                                                                                                        return false
                                                                                                                    }
                                                                                                                    var valid3 = _errs90 === errors
                                                                                                                    if (valid3) {
                                                                                                                        let data40 =
                                                                                                                            data14.webrtcDatachannelBufferThresholdHigh
                                                                                                                        const _errs92 = errors
                                                                                                                        if (
                                                                                                                            !(
                                                                                                                                typeof data40 ==
                                                                                                                                    'number' &&
                                                                                                                                isFinite(data40)
                                                                                                                            )
                                                                                                                        ) {
                                                                                                                            validate10.errors = [
                                                                                                                                {
                                                                                                                                    instancePath:
                                                                                                                                        instancePath +
                                                                                                                                        '/network/controlLayer/webrtcDatachannelBufferThresholdHigh',
                                                                                                                                    schemaPath:
                                                                                                                                        '#/properties/network/properties/controlLayer/properties/webrtcDatachannelBufferThresholdHigh/type',
                                                                                                                                    keyword: 'type',
                                                                                                                                    params: {
                                                                                                                                        type: 'number'
                                                                                                                                    },
                                                                                                                                    message:
                                                                                                                                        'must be number'
                                                                                                                                }
                                                                                                                            ]
                                                                                                                            return false
                                                                                                                        }
                                                                                                                        var valid3 =
                                                                                                                            _errs92 === errors
                                                                                                                        if (valid3) {
                                                                                                                            let data41 =
                                                                                                                                data14.maxMessageSize
                                                                                                                            const _errs94 = errors
                                                                                                                            if (
                                                                                                                                !(
                                                                                                                                    typeof data41 ==
                                                                                                                                        'number' &&
                                                                                                                                    isFinite(data41)
                                                                                                                                )
                                                                                                                            ) {
                                                                                                                                validate10.errors = [
                                                                                                                                    {
                                                                                                                                        instancePath:
                                                                                                                                            instancePath +
                                                                                                                                            '/network/controlLayer/maxMessageSize',
                                                                                                                                        schemaPath:
                                                                                                                                            '#/properties/network/properties/controlLayer/properties/maxMessageSize/type',
                                                                                                                                        keyword:
                                                                                                                                            'type',
                                                                                                                                        params: {
                                                                                                                                            type: 'number'
                                                                                                                                        },
                                                                                                                                        message:
                                                                                                                                            'must be number'
                                                                                                                                    }
                                                                                                                                ]
                                                                                                                                return false
                                                                                                                            }
                                                                                                                            var valid3 =
                                                                                                                                _errs94 === errors
                                                                                                                            if (valid3) {
                                                                                                                                if (
                                                                                                                                    data14.externalIp !==
                                                                                                                                    undefined
                                                                                                                                ) {
                                                                                                                                    let data42 =
                                                                                                                                        data14.externalIp
                                                                                                                                    const _errs96 =
                                                                                                                                        errors
                                                                                                                                    if (
                                                                                                                                        errors ===
                                                                                                                                        _errs96
                                                                                                                                    ) {
                                                                                                                                        if (
                                                                                                                                            errors ===
                                                                                                                                            _errs96
                                                                                                                                        ) {
                                                                                                                                            if (
                                                                                                                                                typeof data42 ===
                                                                                                                                                'string'
                                                                                                                                            ) {
                                                                                                                                                if (
                                                                                                                                                    !formats6.test(
                                                                                                                                                        data42
                                                                                                                                                    )
                                                                                                                                                ) {
                                                                                                                                                    validate10.errors =
                                                                                                                                                        [
                                                                                                                                                            {
                                                                                                                                                                instancePath:
                                                                                                                                                                    instancePath +
                                                                                                                                                                    '/network/controlLayer/externalIp',
                                                                                                                                                                schemaPath:
                                                                                                                                                                    '#/properties/network/properties/controlLayer/properties/externalIp/format',
                                                                                                                                                                keyword:
                                                                                                                                                                    'format',
                                                                                                                                                                params: {
                                                                                                                                                                    format: 'ipv4'
                                                                                                                                                                },
                                                                                                                                                                message:
                                                                                                                                                                    'must match format "' +
                                                                                                                                                                    'ipv4' +
                                                                                                                                                                    '"'
                                                                                                                                                            }
                                                                                                                                                        ]
                                                                                                                                                    return false
                                                                                                                                                }
                                                                                                                                            } else {
                                                                                                                                                validate10.errors =
                                                                                                                                                    [
                                                                                                                                                        {
                                                                                                                                                            instancePath:
                                                                                                                                                                instancePath +
                                                                                                                                                                '/network/controlLayer/externalIp',
                                                                                                                                                            schemaPath:
                                                                                                                                                                '#/properties/network/properties/controlLayer/properties/externalIp/type',
                                                                                                                                                            keyword:
                                                                                                                                                                'type',
                                                                                                                                                            params: {
                                                                                                                                                                type: 'string'
                                                                                                                                                            },
                                                                                                                                                            message:
                                                                                                                                                                'must be string'
                                                                                                                                                        }
                                                                                                                                                    ]
                                                                                                                                                return false
                                                                                                                                            }
                                                                                                                                        }
                                                                                                                                    }
                                                                                                                                    var valid3 =
                                                                                                                                        _errs96 ===
                                                                                                                                        errors
                                                                                                                                } else {
                                                                                                                                    var valid3 = true
                                                                                                                                }
                                                                                                                                if (valid3) {
                                                                                                                                    let data43 =
                                                                                                                                        data14.webrtcPortRange
                                                                                                                                    const _errs98 =
                                                                                                                                        errors
                                                                                                                                    const _errs99 =
                                                                                                                                        errors
                                                                                                                                    if (
                                                                                                                                        errors ===
                                                                                                                                        _errs99
                                                                                                                                    ) {
                                                                                                                                        if (
                                                                                                                                            data43 &&
                                                                                                                                            typeof data43 ==
                                                                                                                                                'object' &&
                                                                                                                                            !Array.isArray(
                                                                                                                                                data43
                                                                                                                                            )
                                                                                                                                        ) {
                                                                                                                                            let missing3
                                                                                                                                            if (
                                                                                                                                                (data43.min ===
                                                                                                                                                    undefined &&
                                                                                                                                                    (missing3 =
                                                                                                                                                        'min')) ||
                                                                                                                                                (data43.max ===
                                                                                                                                                    undefined &&
                                                                                                                                                    (missing3 =
                                                                                                                                                        'max'))
                                                                                                                                            ) {
                                                                                                                                                validate10.errors =
                                                                                                                                                    [
                                                                                                                                                        {
                                                                                                                                                            instancePath:
                                                                                                                                                                instancePath +
                                                                                                                                                                '/network/controlLayer/webrtcPortRange',
                                                                                                                                                            schemaPath:
                                                                                                                                                                '#/definitions/portRange/required',
                                                                                                                                                            keyword:
                                                                                                                                                                'required',
                                                                                                                                                            params: {
                                                                                                                                                                missingProperty:
                                                                                                                                                                    missing3
                                                                                                                                                            },
                                                                                                                                                            message:
                                                                                                                                                                "must have required property '" +
                                                                                                                                                                missing3 +
                                                                                                                                                                "'"
                                                                                                                                                        }
                                                                                                                                                    ]
                                                                                                                                                return false
                                                                                                                                            } else {
                                                                                                                                                const _errs101 =
                                                                                                                                                    errors
                                                                                                                                                for (const key8 in data43) {
                                                                                                                                                    if (
                                                                                                                                                        !(
                                                                                                                                                            key8 ===
                                                                                                                                                                'min' ||
                                                                                                                                                            key8 ===
                                                                                                                                                                'max'
                                                                                                                                                        )
                                                                                                                                                    ) {
                                                                                                                                                        validate10.errors =
                                                                                                                                                            [
                                                                                                                                                                {
                                                                                                                                                                    instancePath:
                                                                                                                                                                        instancePath +
                                                                                                                                                                        '/network/controlLayer/webrtcPortRange',
                                                                                                                                                                    schemaPath:
                                                                                                                                                                        '#/definitions/portRange/additionalProperties',
                                                                                                                                                                    keyword:
                                                                                                                                                                        'additionalProperties',
                                                                                                                                                                    params: {
                                                                                                                                                                        additionalProperty:
                                                                                                                                                                            key8
                                                                                                                                                                    },
                                                                                                                                                                    message:
                                                                                                                                                                        'must NOT have additional properties'
                                                                                                                                                                }
                                                                                                                                                            ]
                                                                                                                                                        return false
                                                                                                                                                        break
                                                                                                                                                    }
                                                                                                                                                }
                                                                                                                                                if (
                                                                                                                                                    _errs101 ===
                                                                                                                                                    errors
                                                                                                                                                ) {
                                                                                                                                                    if (
                                                                                                                                                        data43.min !==
                                                                                                                                                        undefined
                                                                                                                                                    ) {
                                                                                                                                                        let data44 =
                                                                                                                                                            data43.min
                                                                                                                                                        const _errs102 =
                                                                                                                                                            errors
                                                                                                                                                        if (
                                                                                                                                                            !(
                                                                                                                                                                typeof data44 ==
                                                                                                                                                                    'number' &&
                                                                                                                                                                isFinite(
                                                                                                                                                                    data44
                                                                                                                                                                )
                                                                                                                                                            )
                                                                                                                                                        ) {
                                                                                                                                                            validate10.errors =
                                                                                                                                                                [
                                                                                                                                                                    {
                                                                                                                                                                        instancePath:
                                                                                                                                                                            instancePath +
                                                                                                                                                                            '/network/controlLayer/webrtcPortRange/min',
                                                                                                                                                                        schemaPath:
                                                                                                                                                                            '#/definitions/portRange/properties/min/type',
                                                                                                                                                                        keyword:
                                                                                                                                                                            'type',
                                                                                                                                                                        params: {
                                                                                                                                                                            type: 'number'
                                                                                                                                                                        },
                                                                                                                                                                        message:
                                                                                                                                                                            'must be number'
                                                                                                                                                                    }
                                                                                                                                                                ]
                                                                                                                                                            return false
                                                                                                                                                        }
                                                                                                                                                        var valid13 =
                                                                                                                                                            _errs102 ===
                                                                                                                                                            errors
                                                                                                                                                    } else {
                                                                                                                                                        var valid13 = true
                                                                                                                                                    }
                                                                                                                                                    if (
                                                                                                                                                        valid13
                                                                                                                                                    ) {
                                                                                                                                                        if (
                                                                                                                                                            data43.max !==
                                                                                                                                                            undefined
                                                                                                                                                        ) {
                                                                                                                                                            let data45 =
                                                                                                                                                                data43.max
                                                                                                                                                            const _errs104 =
                                                                                                                                                                errors
                                                                                                                                                            if (
                                                                                                                                                                !(
                                                                                                                                                                    typeof data45 ==
                                                                                                                                                                        'number' &&
                                                                                                                                                                    isFinite(
                                                                                                                                                                        data45
                                                                                                                                                                    )
                                                                                                                                                                )
                                                                                                                                                            ) {
                                                                                                                                                                validate10.errors =
                                                                                                                                                                    [
                                                                                                                                                                        {
                                                                                                                                                                            instancePath:
                                                                                                                                                                                instancePath +
                                                                                                                                                                                '/network/controlLayer/webrtcPortRange/max',
                                                                                                                                                                            schemaPath:
                                                                                                                                                                                '#/definitions/portRange/properties/max/type',
                                                                                                                                                                            keyword:
                                                                                                                                                                                'type',
                                                                                                                                                                            params: {
                                                                                                                                                                                type: 'number'
                                                                                                                                                                            },
                                                                                                                                                                            message:
                                                                                                                                                                                'must be number'
                                                                                                                                                                        }
                                                                                                                                                                    ]
                                                                                                                                                                return false
                                                                                                                                                            }
                                                                                                                                                            var valid13 =
                                                                                                                                                                _errs104 ===
                                                                                                                                                                errors
                                                                                                                                                        } else {
                                                                                                                                                            var valid13 = true
                                                                                                                                                        }
                                                                                                                                                    }
                                                                                                                                                }
                                                                                                                                            }
                                                                                                                                        } else {
                                                                                                                                            validate10.errors =
                                                                                                                                                [
                                                                                                                                                    {
                                                                                                                                                        instancePath:
                                                                                                                                                            instancePath +
                                                                                                                                                            '/network/controlLayer/webrtcPortRange',
                                                                                                                                                        schemaPath:
                                                                                                                                                            '#/definitions/portRange/type',
                                                                                                                                                        keyword:
                                                                                                                                                            'type',
                                                                                                                                                        params: {
                                                                                                                                                            type: 'object'
                                                                                                                                                        },
                                                                                                                                                        message:
                                                                                                                                                            'must be object'
                                                                                                                                                    }
                                                                                                                                                ]
                                                                                                                                            return false
                                                                                                                                        }
                                                                                                                                    }
                                                                                                                                    var valid3 =
                                                                                                                                        _errs98 ===
                                                                                                                                        errors
                                                                                                                                    if (valid3) {
                                                                                                                                        let data46 =
                                                                                                                                            data14.networkConnectivityTimeout
                                                                                                                                        const _errs106 =
                                                                                                                                            errors
                                                                                                                                        if (
                                                                                                                                            !(
                                                                                                                                                typeof data46 ==
                                                                                                                                                    'number' &&
                                                                                                                                                isFinite(
                                                                                                                                                    data46
                                                                                                                                                )
                                                                                                                                            )
                                                                                                                                        ) {
                                                                                                                                            validate10.errors =
                                                                                                                                                [
                                                                                                                                                    {
                                                                                                                                                        instancePath:
                                                                                                                                                            instancePath +
                                                                                                                                                            '/network/controlLayer/networkConnectivityTimeout',
                                                                                                                                                        schemaPath:
                                                                                                                                                            '#/properties/network/properties/controlLayer/properties/networkConnectivityTimeout/type',
                                                                                                                                                        keyword:
                                                                                                                                                            'type',
                                                                                                                                                        params: {
                                                                                                                                                            type: 'number'
                                                                                                                                                        },
                                                                                                                                                        message:
                                                                                                                                                            'must be number'
                                                                                                                                                    }
                                                                                                                                                ]
                                                                                                                                            return false
                                                                                                                                        }
                                                                                                                                        var valid3 =
                                                                                                                                            _errs106 ===
                                                                                                                                            errors
                                                                                                                                        if (valid3) {
                                                                                                                                            const _errs108 =
                                                                                                                                                errors
                                                                                                                                            if (
                                                                                                                                                typeof data14.websocketServerEnableTls !==
                                                                                                                                                'boolean'
                                                                                                                                            ) {
                                                                                                                                                validate10.errors =
                                                                                                                                                    [
                                                                                                                                                        {
                                                                                                                                                            instancePath:
                                                                                                                                                                instancePath +
                                                                                                                                                                '/network/controlLayer/websocketServerEnableTls',
                                                                                                                                                            schemaPath:
                                                                                                                                                                '#/properties/network/properties/controlLayer/properties/websocketServerEnableTls/type',
                                                                                                                                                            keyword:
                                                                                                                                                                'type',
                                                                                                                                                            params: {
                                                                                                                                                                type: 'boolean'
                                                                                                                                                            },
                                                                                                                                                            message:
                                                                                                                                                                'must be boolean'
                                                                                                                                                        }
                                                                                                                                                    ]
                                                                                                                                                return false
                                                                                                                                            }
                                                                                                                                            var valid3 =
                                                                                                                                                _errs108 ===
                                                                                                                                                errors
                                                                                                                                            if (
                                                                                                                                                valid3
                                                                                                                                            ) {
                                                                                                                                                const _errs110 =
                                                                                                                                                    errors
                                                                                                                                                if (
                                                                                                                                                    typeof data14.autoCertifierUrl !==
                                                                                                                                                    'string'
                                                                                                                                                ) {
                                                                                                                                                    validate10.errors =
                                                                                                                                                        [
                                                                                                                                                            {
                                                                                                                                                                instancePath:
                                                                                                                                                                    instancePath +
                                                                                                                                                                    '/network/controlLayer/autoCertifierUrl',
                                                                                                                                                                schemaPath:
                                                                                                                                                                    '#/properties/network/properties/controlLayer/properties/autoCertifierUrl/type',
                                                                                                                                                                keyword:
                                                                                                                                                                    'type',
                                                                                                                                                                params: {
                                                                                                                                                                    type: 'string'
                                                                                                                                                                },
                                                                                                                                                                message:
                                                                                                                                                                    'must be string'
                                                                                                                                                            }
                                                                                                                                                        ]
                                                                                                                                                    return false
                                                                                                                                                }
                                                                                                                                                var valid3 =
                                                                                                                                                    _errs110 ===
                                                                                                                                                    errors
                                                                                                                                                if (
                                                                                                                                                    valid3
                                                                                                                                                ) {
                                                                                                                                                    const _errs112 =
                                                                                                                                                        errors
                                                                                                                                                    if (
                                                                                                                                                        typeof data14.autoCertifierConfigFile !==
                                                                                                                                                        'string'
                                                                                                                                                    ) {
                                                                                                                                                        validate10.errors =
                                                                                                                                                            [
                                                                                                                                                                {
                                                                                                                                                                    instancePath:
                                                                                                                                                                        instancePath +
                                                                                                                                                                        '/network/controlLayer/autoCertifierConfigFile',
                                                                                                                                                                    schemaPath:
                                                                                                                                                                        '#/properties/network/properties/controlLayer/properties/autoCertifierConfigFile/type',
                                                                                                                                                                    keyword:
                                                                                                                                                                        'type',
                                                                                                                                                                    params: {
                                                                                                                                                                        type: 'string'
                                                                                                                                                                    },
                                                                                                                                                                    message:
                                                                                                                                                                        'must be string'
                                                                                                                                                                }
                                                                                                                                                            ]
                                                                                                                                                        return false
                                                                                                                                                    }
                                                                                                                                                    var valid3 =
                                                                                                                                                        _errs112 ===
                                                                                                                                                        errors
                                                                                                                                                    if (
                                                                                                                                                        valid3
                                                                                                                                                    ) {
                                                                                                                                                        if (
                                                                                                                                                            data14.geoIpDatabaseFolder !==
                                                                                                                                                            undefined
                                                                                                                                                        ) {
                                                                                                                                                            const _errs114 =
                                                                                                                                                                errors
                                                                                                                                                            if (
                                                                                                                                                                typeof data14.geoIpDatabaseFolder !==
                                                                                                                                                                'string'
                                                                                                                                                            ) {
                                                                                                                                                                validate10.errors =
                                                                                                                                                                    [
                                                                                                                                                                        {
                                                                                                                                                                            instancePath:
                                                                                                                                                                                instancePath +
                                                                                                                                                                                '/network/controlLayer/geoIpDatabaseFolder',
                                                                                                                                                                            schemaPath:
                                                                                                                                                                                '#/properties/network/properties/controlLayer/properties/geoIpDatabaseFolder/type',
                                                                                                                                                                            keyword:
                                                                                                                                                                                'type',
                                                                                                                                                                            params: {
                                                                                                                                                                                type: 'string'
                                                                                                                                                                            },
                                                                                                                                                                            message:
                                                                                                                                                                                'must be string'
                                                                                                                                                                        }
                                                                                                                                                                    ]
                                                                                                                                                                return false
                                                                                                                                                            }
                                                                                                                                                            var valid3 =
                                                                                                                                                                _errs114 ===
                                                                                                                                                                errors
                                                                                                                                                        } else {
                                                                                                                                                            var valid3 = true
                                                                                                                                                        }
                                                                                                                                                    }
                                                                                                                                                }
                                                                                                                                            }
                                                                                                                                        }
                                                                                                                                    }
                                                                                                                                }
                                                                                                                            }
                                                                                                                        }
                                                                                                                    }
                                                                                                                }
                                                                                                            }
                                                                                                        }
                                                                                                    }
                                                                                                }
                                                                                            }
                                                                                        }
                                                                                    }
                                                                                }
                                                                            }
                                                                        } else {
                                                                            validate10.errors = [
                                                                                {
                                                                                    instancePath: instancePath + '/network/controlLayer',
                                                                                    schemaPath: '#/properties/network/properties/controlLayer/type',
                                                                                    keyword: 'type',
                                                                                    params: { type: 'object' },
                                                                                    message: 'must be object'
                                                                                }
                                                                            ]
                                                                            return false
                                                                        }
                                                                    }
                                                                    var valid2 = _errs32 === errors
                                                                    if (valid2) {
                                                                        let data51 = data13.node
                                                                        const _errs116 = errors
                                                                        if (errors === _errs116) {
                                                                            if (data51 && typeof data51 == 'object' && !Array.isArray(data51)) {
                                                                                if (data51.streamPartitionNeighborTargetCount === undefined) {
                                                                                    data51.streamPartitionNeighborTargetCount = 4
                                                                                }
                                                                                if (data51.streamPartitionMinPropagationTargets === undefined) {
                                                                                    data51.streamPartitionMinPropagationTargets = 2
                                                                                }
                                                                                if (data51.acceptProxyConnections === undefined) {
                                                                                    data51.acceptProxyConnections = false
                                                                                }
                                                                                const _errs118 = errors
                                                                                for (const key9 in data51) {
                                                                                    if (
                                                                                        !(
                                                                                            key9 === 'streamPartitionNeighborTargetCount' ||
                                                                                            key9 === 'streamPartitionMinPropagationTargets' ||
                                                                                            key9 === 'acceptProxyConnections'
                                                                                        )
                                                                                    ) {
                                                                                        validate10.errors = [
                                                                                            {
                                                                                                instancePath: instancePath + '/network/node',
                                                                                                schemaPath:
                                                                                                    '#/properties/network/properties/node/additionalProperties',
                                                                                                keyword: 'additionalProperties',
                                                                                                params: { additionalProperty: key9 },
                                                                                                message: 'must NOT have additional properties'
                                                                                            }
                                                                                        ]
                                                                                        return false
                                                                                        break
                                                                                    }
                                                                                }
                                                                                if (_errs118 === errors) {
                                                                                    let data52 = data51.streamPartitionNeighborTargetCount
                                                                                    const _errs119 = errors
                                                                                    if (!(typeof data52 == 'number' && isFinite(data52))) {
                                                                                        validate10.errors = [
                                                                                            {
                                                                                                instancePath:
                                                                                                    instancePath +
                                                                                                    '/network/node/streamPartitionNeighborTargetCount',
                                                                                                schemaPath:
                                                                                                    '#/properties/network/properties/node/properties/streamPartitionNeighborTargetCount/type',
                                                                                                keyword: 'type',
                                                                                                params: { type: 'number' },
                                                                                                message: 'must be number'
                                                                                            }
                                                                                        ]
                                                                                        return false
                                                                                    }
                                                                                    var valid14 = _errs119 === errors
                                                                                    if (valid14) {
                                                                                        let data53 = data51.streamPartitionMinPropagationTargets
                                                                                        const _errs121 = errors
                                                                                        if (!(typeof data53 == 'number' && isFinite(data53))) {
                                                                                            validate10.errors = [
                                                                                                {
                                                                                                    instancePath:
                                                                                                        instancePath +
                                                                                                        '/network/node/streamPartitionMinPropagationTargets',
                                                                                                    schemaPath:
                                                                                                        '#/properties/network/properties/node/properties/streamPartitionMinPropagationTargets/type',
                                                                                                    keyword: 'type',
                                                                                                    params: { type: 'number' },
                                                                                                    message: 'must be number'
                                                                                                }
                                                                                            ]
                                                                                            return false
                                                                                        }
                                                                                        var valid14 = _errs121 === errors
                                                                                        if (valid14) {
                                                                                            const _errs123 = errors
                                                                                            if (typeof data51.acceptProxyConnections !== 'boolean') {
                                                                                                validate10.errors = [
                                                                                                    {
                                                                                                        instancePath:
                                                                                                            instancePath +
                                                                                                            '/network/node/acceptProxyConnections',
                                                                                                        schemaPath:
                                                                                                            '#/properties/network/properties/node/properties/acceptProxyConnections/type',
                                                                                                        keyword: 'type',
                                                                                                        params: { type: 'boolean' },
                                                                                                        message: 'must be boolean'
                                                                                                    }
                                                                                                ]
                                                                                                return false
                                                                                            }
                                                                                            var valid14 = _errs123 === errors
                                                                                        }
                                                                                    }
                                                                                }
                                                                            } else {
                                                                                validate10.errors = [
                                                                                    {
                                                                                        instancePath: instancePath + '/network/node',
                                                                                        schemaPath: '#/properties/network/properties/node/type',
                                                                                        keyword: 'type',
                                                                                        params: { type: 'object' },
                                                                                        message: 'must be object'
                                                                                    }
                                                                                ]
                                                                                return false
                                                                            }
                                                                        }
                                                                        var valid2 = _errs116 === errors
                                                                    }
                                                                }
                                                            } else {
                                                                validate10.errors = [
                                                                    {
                                                                        instancePath: instancePath + '/network',
                                                                        schemaPath: '#/properties/network/type',
                                                                        keyword: 'type',
                                                                        params: { type: 'object' },
                                                                        message: 'must be object'
                                                                    }
                                                                ]
                                                                return false
                                                            }
                                                        }
                                                        var valid0 = _errs29 === errors
                                                        if (valid0) {
                                                            let data55 = data.contracts
                                                            const _errs125 = errors
                                                            if (errors === _errs125) {
                                                                if (data55 && typeof data55 == 'object' && !Array.isArray(data55)) {
                                                                    if (data55.ethereumNetwork === undefined) {
                                                                        data55.ethereumNetwork = {}
                                                                    }
                                                                    if (data55.rpcQuorum === undefined) {
                                                                        data55.rpcQuorum = 2
                                                                    }
                                                                    if (data55.maxConcurrentCalls === undefined) {
                                                                        data55.maxConcurrentCalls = 10
                                                                    }
                                                                    if (data55.pollInterval === undefined) {
                                                                        data55.pollInterval = 4000
                                                                    }
                                                                    const _errs127 = errors
                                                                    for (const key10 in data55) {
                                                                        if (!func2.call(schema11.properties.contracts.properties, key10)) {
                                                                            validate10.errors = [
                                                                                {
                                                                                    instancePath: instancePath + '/contracts',
                                                                                    schemaPath: '#/properties/contracts/additionalProperties',
                                                                                    keyword: 'additionalProperties',
                                                                                    params: { additionalProperty: key10 },
                                                                                    message: 'must NOT have additional properties'
                                                                                }
                                                                            ]
                                                                            return false
                                                                            break
                                                                        }
                                                                    }
                                                                    if (_errs127 === errors) {
                                                                        let data56 = data55.ethereumNetwork
                                                                        const _errs128 = errors
                                                                        if (errors === _errs128) {
                                                                            if (data56 && typeof data56 == 'object' && !Array.isArray(data56)) {
                                                                                const _errs130 = errors
                                                                                for (const key11 in data56) {
                                                                                    if (
                                                                                        !(
                                                                                            key11 === 'chainId' ||
                                                                                            key11 === 'overrides' ||
                                                                                            key11 === 'highGasPriceStrategy'
                                                                                        )
                                                                                    ) {
                                                                                        validate10.errors = [
                                                                                            {
                                                                                                instancePath:
                                                                                                    instancePath + '/contracts/ethereumNetwork',
                                                                                                schemaPath:
                                                                                                    '#/properties/contracts/properties/ethereumNetwork/additionalProperties',
                                                                                                keyword: 'additionalProperties',
                                                                                                params: { additionalProperty: key11 },
                                                                                                message: 'must NOT have additional properties'
                                                                                            }
                                                                                        ]
                                                                                        return false
                                                                                        break
                                                                                    }
                                                                                }
                                                                                if (_errs130 === errors) {
                                                                                    if (data56.chainId !== undefined) {
                                                                                        let data57 = data56.chainId
                                                                                        const _errs131 = errors
                                                                                        if (!(typeof data57 == 'number' && isFinite(data57))) {
                                                                                            validate10.errors = [
                                                                                                {
                                                                                                    instancePath:
                                                                                                        instancePath +
                                                                                                        '/contracts/ethereumNetwork/chainId',
                                                                                                    schemaPath:
                                                                                                        '#/properties/contracts/properties/ethereumNetwork/properties/chainId/type',
                                                                                                    keyword: 'type',
                                                                                                    params: { type: 'number' },
                                                                                                    message: 'must be number'
                                                                                                }
                                                                                            ]
                                                                                            return false
                                                                                        }
                                                                                        var valid16 = _errs131 === errors
                                                                                    } else {
                                                                                        var valid16 = true
                                                                                    }
                                                                                    if (valid16) {
                                                                                        if (data56.overrides !== undefined) {
                                                                                            let data58 = data56.overrides
                                                                                            const _errs133 = errors
                                                                                            if (
                                                                                                !(
                                                                                                    data58 &&
                                                                                                    typeof data58 == 'object' &&
                                                                                                    !Array.isArray(data58)
                                                                                                )
                                                                                            ) {
                                                                                                validate10.errors = [
                                                                                                    {
                                                                                                        instancePath:
                                                                                                            instancePath +
                                                                                                            '/contracts/ethereumNetwork/overrides',
                                                                                                        schemaPath:
                                                                                                            '#/properties/contracts/properties/ethereumNetwork/properties/overrides/type',
                                                                                                        keyword: 'type',
                                                                                                        params: { type: 'object' },
                                                                                                        message: 'must be object'
                                                                                                    }
                                                                                                ]
                                                                                                return false
                                                                                            }
                                                                                            var valid16 = _errs133 === errors
                                                                                        } else {
                                                                                            var valid16 = true
                                                                                        }
                                                                                        if (valid16) {
                                                                                            if (data56.highGasPriceStrategy !== undefined) {
                                                                                                const _errs135 = errors
                                                                                                if (
                                                                                                    typeof data56.highGasPriceStrategy !== 'boolean'
                                                                                                ) {
                                                                                                    validate10.errors = [
                                                                                                        {
                                                                                                            instancePath:
                                                                                                                instancePath +
                                                                                                                '/contracts/ethereumNetwork/highGasPriceStrategy',
                                                                                                            schemaPath:
                                                                                                                '#/properties/contracts/properties/ethereumNetwork/properties/highGasPriceStrategy/type',
                                                                                                            keyword: 'type',
                                                                                                            params: { type: 'boolean' },
                                                                                                            message: 'must be boolean'
                                                                                                        }
                                                                                                    ]
                                                                                                    return false
                                                                                                }
                                                                                                var valid16 = _errs135 === errors
                                                                                            } else {
                                                                                                var valid16 = true
                                                                                            }
                                                                                        }
                                                                                    }
                                                                                }
                                                                            } else {
                                                                                validate10.errors = [
                                                                                    {
                                                                                        instancePath: instancePath + '/contracts/ethereumNetwork',
                                                                                        schemaPath:
                                                                                            '#/properties/contracts/properties/ethereumNetwork/type',
                                                                                        keyword: 'type',
                                                                                        params: { type: 'object' },
                                                                                        message: 'must be object'
                                                                                    }
                                                                                ]
                                                                                return false
                                                                            }
                                                                        }
                                                                        var valid15 = _errs128 === errors
                                                                        if (valid15) {
                                                                            if (data55.streamRegistryChainAddress !== undefined) {
                                                                                let data60 = data55.streamRegistryChainAddress
                                                                                const _errs137 = errors
                                                                                if (errors === _errs137) {
                                                                                    if (errors === _errs137) {
                                                                                        if (typeof data60 === 'string') {
                                                                                            if (!formats2.test(data60)) {
                                                                                                validate10.errors = [
                                                                                                    {
                                                                                                        instancePath:
                                                                                                            instancePath +
                                                                                                            '/contracts/streamRegistryChainAddress',
                                                                                                        schemaPath:
                                                                                                            '#/properties/contracts/properties/streamRegistryChainAddress/format',
                                                                                                        keyword: 'format',
                                                                                                        params: { format: 'ethereum-address' },
                                                                                                        message:
                                                                                                            'must match format "' +
                                                                                                            'ethereum-address' +
                                                                                                            '"'
                                                                                                    }
                                                                                                ]
                                                                                                return false
                                                                                            }
                                                                                        } else {
                                                                                            validate10.errors = [
                                                                                                {
                                                                                                    instancePath:
                                                                                                        instancePath +
                                                                                                        '/contracts/streamRegistryChainAddress',
                                                                                                    schemaPath:
                                                                                                        '#/properties/contracts/properties/streamRegistryChainAddress/type',
                                                                                                    keyword: 'type',
                                                                                                    params: { type: 'string' },
                                                                                                    message: 'must be string'
                                                                                                }
                                                                                            ]
                                                                                            return false
                                                                                        }
                                                                                    }
                                                                                }
                                                                                var valid15 = _errs137 === errors
                                                                            } else {
                                                                                var valid15 = true
                                                                            }
                                                                            if (valid15) {
                                                                                if (data55.streamStorageRegistryChainAddress !== undefined) {
                                                                                    let data61 = data55.streamStorageRegistryChainAddress
                                                                                    const _errs139 = errors
                                                                                    if (errors === _errs139) {
                                                                                        if (errors === _errs139) {
                                                                                            if (typeof data61 === 'string') {
                                                                                                if (!formats2.test(data61)) {
                                                                                                    validate10.errors = [
                                                                                                        {
                                                                                                            instancePath:
                                                                                                                instancePath +
                                                                                                                '/contracts/streamStorageRegistryChainAddress',
                                                                                                            schemaPath:
                                                                                                                '#/properties/contracts/properties/streamStorageRegistryChainAddress/format',
                                                                                                            keyword: 'format',
                                                                                                            params: { format: 'ethereum-address' },
                                                                                                            message:
                                                                                                                'must match format "' +
                                                                                                                'ethereum-address' +
                                                                                                                '"'
                                                                                                        }
                                                                                                    ]
                                                                                                    return false
                                                                                                }
                                                                                            } else {
                                                                                                validate10.errors = [
                                                                                                    {
                                                                                                        instancePath:
                                                                                                            instancePath +
                                                                                                            '/contracts/streamStorageRegistryChainAddress',
                                                                                                        schemaPath:
                                                                                                            '#/properties/contracts/properties/streamStorageRegistryChainAddress/type',
                                                                                                        keyword: 'type',
                                                                                                        params: { type: 'string' },
                                                                                                        message: 'must be string'
                                                                                                    }
                                                                                                ]
                                                                                                return false
                                                                                            }
                                                                                        }
                                                                                    }
                                                                                    var valid15 = _errs139 === errors
                                                                                } else {
                                                                                    var valid15 = true
                                                                                }
                                                                                if (valid15) {
                                                                                    if (data55.storageNodeRegistryChainAddress !== undefined) {
                                                                                        let data62 = data55.storageNodeRegistryChainAddress
                                                                                        const _errs141 = errors
                                                                                        if (errors === _errs141) {
                                                                                            if (errors === _errs141) {
                                                                                                if (typeof data62 === 'string') {
                                                                                                    if (!formats2.test(data62)) {
                                                                                                        validate10.errors = [
                                                                                                            {
                                                                                                                instancePath:
                                                                                                                    instancePath +
                                                                                                                    '/contracts/storageNodeRegistryChainAddress',
                                                                                                                schemaPath:
                                                                                                                    '#/properties/contracts/properties/storageNodeRegistryChainAddress/format',
                                                                                                                keyword: 'format',
                                                                                                                params: {
                                                                                                                    format: 'ethereum-address'
                                                                                                                },
                                                                                                                message:
                                                                                                                    'must match format "' +
                                                                                                                    'ethereum-address' +
                                                                                                                    '"'
                                                                                                            }
                                                                                                        ]
                                                                                                        return false
                                                                                                    }
                                                                                                } else {
                                                                                                    validate10.errors = [
                                                                                                        {
                                                                                                            instancePath:
                                                                                                                instancePath +
                                                                                                                '/contracts/storageNodeRegistryChainAddress',
                                                                                                            schemaPath:
                                                                                                                '#/properties/contracts/properties/storageNodeRegistryChainAddress/type',
                                                                                                            keyword: 'type',
                                                                                                            params: { type: 'string' },
                                                                                                            message: 'must be string'
                                                                                                        }
                                                                                                    ]
                                                                                                    return false
                                                                                                }
                                                                                            }
                                                                                        }
                                                                                        var valid15 = _errs141 === errors
                                                                                    } else {
                                                                                        var valid15 = true
                                                                                    }
                                                                                    if (valid15) {
                                                                                        if (data55.rpcs !== undefined) {
                                                                                            let data63 = data55.rpcs
                                                                                            const _errs143 = errors
                                                                                            if (errors === _errs143) {
                                                                                                if (Array.isArray(data63)) {
                                                                                                    if (data63.length < 1) {
                                                                                                        validate10.errors = [
                                                                                                            {
                                                                                                                instancePath:
                                                                                                                    instancePath + '/contracts/rpcs',
                                                                                                                schemaPath:
                                                                                                                    '#/properties/contracts/properties/rpcs/minItems',
                                                                                                                keyword: 'minItems',
                                                                                                                params: { limit: 1 },
                                                                                                                message:
                                                                                                                    'must NOT have fewer than 1 items'
                                                                                                            }
                                                                                                        ]
                                                                                                        return false
                                                                                                    } else {
                                                                                                        var valid17 = true
                                                                                                        const len2 = data63.length
                                                                                                        for (let i2 = 0; i2 < len2; i2++) {
                                                                                                            let data64 = data63[i2]
                                                                                                            const _errs145 = errors
                                                                                                            if (
                                                                                                                !(
                                                                                                                    data64 &&
                                                                                                                    typeof data64 == 'object' &&
                                                                                                                    !Array.isArray(data64)
                                                                                                                )
                                                                                                            ) {
                                                                                                                validate10.errors = [
                                                                                                                    {
                                                                                                                        instancePath:
                                                                                                                            instancePath +
                                                                                                                            '/contracts/rpcs/' +
                                                                                                                            i2,
                                                                                                                        schemaPath:
                                                                                                                            '#/properties/contracts/properties/rpcs/items/type',
                                                                                                                        keyword: 'type',
                                                                                                                        params: { type: 'object' },
                                                                                                                        message: 'must be object'
                                                                                                                    }
                                                                                                                ]
                                                                                                                return false
                                                                                                            }
                                                                                                            const _errs146 = errors
                                                                                                            if (errors === _errs146) {
                                                                                                                if (
                                                                                                                    data64 &&
                                                                                                                    typeof data64 == 'object' &&
                                                                                                                    !Array.isArray(data64)
                                                                                                                ) {
                                                                                                                    let missing4
                                                                                                                    if (
                                                                                                                        data64.url === undefined &&
                                                                                                                        (missing4 = 'url')
                                                                                                                    ) {
                                                                                                                        validate10.errors = [
                                                                                                                            {
                                                                                                                                instancePath:
                                                                                                                                    instancePath +
                                                                                                                                    '/contracts/rpcs/' +
                                                                                                                                    i2,
                                                                                                                                schemaPath:
                                                                                                                                    '#/definitions/rpcProviderConfig/required',
                                                                                                                                keyword: 'required',
                                                                                                                                params: {
                                                                                                                                    missingProperty:
                                                                                                                                        missing4
                                                                                                                                },
                                                                                                                                message:
                                                                                                                                    "must have required property '" +
                                                                                                                                    missing4 +
                                                                                                                                    "'"
                                                                                                                            }
                                                                                                                        ]
                                                                                                                        return false
                                                                                                                    } else {
                                                                                                                        if (
                                                                                                                            data64.url !== undefined
                                                                                                                        ) {
                                                                                                                            let data65 = data64.url
                                                                                                                            const _errs148 = errors
                                                                                                                            if (errors === _errs148) {
                                                                                                                                if (
                                                                                                                                    errors ===
                                                                                                                                    _errs148
                                                                                                                                ) {
                                                                                                                                    if (
                                                                                                                                        typeof data65 ===
                                                                                                                                        'string'
                                                                                                                                    ) {
                                                                                                                                        if (
                                                                                                                                            !formats14.test(
                                                                                                                                                data65
                                                                                                                                            )
                                                                                                                                        ) {
                                                                                                                                            validate10.errors =
                                                                                                                                                [
                                                                                                                                                    {
                                                                                                                                                        instancePath:
                                                                                                                                                            instancePath +
                                                                                                                                                            '/contracts/rpcs/' +
                                                                                                                                                            i2 +
                                                                                                                                                            '/url',
                                                                                                                                                        schemaPath:
                                                                                                                                                            '#/definitions/rpcProviderConfig/properties/url/format',
                                                                                                                                                        keyword:
                                                                                                                                                            'format',
                                                                                                                                                        params: {
                                                                                                                                                            format: 'uri'
                                                                                                                                                        },
                                                                                                                                                        message:
                                                                                                                                                            'must match format "' +
                                                                                                                                                            'uri' +
                                                                                                                                                            '"'
                                                                                                                                                    }
                                                                                                                                                ]
                                                                                                                                            return false
                                                                                                                                        }
                                                                                                                                    } else {
                                                                                                                                        validate10.errors =
                                                                                                                                            [
                                                                                                                                                {
                                                                                                                                                    instancePath:
                                                                                                                                                        instancePath +
                                                                                                                                                        '/contracts/rpcs/' +
                                                                                                                                                        i2 +
                                                                                                                                                        '/url',
                                                                                                                                                    schemaPath:
                                                                                                                                                        '#/definitions/rpcProviderConfig/properties/url/type',
                                                                                                                                                    keyword:
                                                                                                                                                        'type',
                                                                                                                                                    params: {
                                                                                                                                                        type: 'string'
                                                                                                                                                    },
                                                                                                                                                    message:
                                                                                                                                                        'must be string'
                                                                                                                                                }
                                                                                                                                            ]
                                                                                                                                        return false
                                                                                                                                    }
                                                                                                                                }
                                                                                                                            }
                                                                                                                        }
                                                                                                                    }
                                                                                                                } else {
                                                                                                                    validate10.errors = [
                                                                                                                        {
                                                                                                                            instancePath:
                                                                                                                                instancePath +
                                                                                                                                '/contracts/rpcs/' +
                                                                                                                                i2,
                                                                                                                            schemaPath:
                                                                                                                                '#/definitions/rpcProviderConfig/type',
                                                                                                                            keyword: 'type',
                                                                                                                            params: {
                                                                                                                                type: 'object'
                                                                                                                            },
                                                                                                                            message: 'must be object'
                                                                                                                        }
                                                                                                                    ]
                                                                                                                    return false
                                                                                                                }
                                                                                                            }
                                                                                                            var valid17 = _errs145 === errors
                                                                                                            if (!valid17) {
                                                                                                                break
                                                                                                            }
                                                                                                        }
                                                                                                    }
                                                                                                } else {
                                                                                                    validate10.errors = [
                                                                                                        {
                                                                                                            instancePath:
                                                                                                                instancePath + '/contracts/rpcs',
                                                                                                            schemaPath:
                                                                                                                '#/properties/contracts/properties/rpcs/type',
                                                                                                            keyword: 'type',
                                                                                                            params: { type: 'array' },
                                                                                                            message: 'must be array'
                                                                                                        }
                                                                                                    ]
                                                                                                    return false
                                                                                                }
                                                                                            }
                                                                                            var valid15 = _errs143 === errors
                                                                                        } else {
                                                                                            var valid15 = true
                                                                                        }
                                                                                        if (valid15) {
                                                                                            let data66 = data55.rpcQuorum
                                                                                            const _errs151 = errors
                                                                                            if (!(typeof data66 == 'number' && isFinite(data66))) {
                                                                                                validate10.errors = [
                                                                                                    {
                                                                                                        instancePath:
                                                                                                            instancePath + '/contracts/rpcQuorum',
                                                                                                        schemaPath:
                                                                                                            '#/properties/contracts/properties/rpcQuorum/type',
                                                                                                        keyword: 'type',
                                                                                                        params: { type: 'number' },
                                                                                                        message: 'must be number'
                                                                                                    }
                                                                                                ]
                                                                                                return false
                                                                                            }
                                                                                            var valid15 = _errs151 === errors
                                                                                            if (valid15) {
                                                                                                if (data55.theGraphUrl !== undefined) {
                                                                                                    let data67 = data55.theGraphUrl
                                                                                                    const _errs153 = errors
                                                                                                    if (errors === _errs153) {
                                                                                                        if (errors === _errs153) {
                                                                                                            if (typeof data67 === 'string') {
                                                                                                                if (!formats14.test(data67)) {
                                                                                                                    validate10.errors = [
                                                                                                                        {
                                                                                                                            instancePath:
                                                                                                                                instancePath +
                                                                                                                                '/contracts/theGraphUrl',
                                                                                                                            schemaPath:
                                                                                                                                '#/properties/contracts/properties/theGraphUrl/format',
                                                                                                                            keyword: 'format',
                                                                                                                            params: { format: 'uri' },
                                                                                                                            message:
                                                                                                                                'must match format "' +
                                                                                                                                'uri' +
                                                                                                                                '"'
                                                                                                                        }
                                                                                                                    ]
                                                                                                                    return false
                                                                                                                }
                                                                                                            } else {
                                                                                                                validate10.errors = [
                                                                                                                    {
                                                                                                                        instancePath:
                                                                                                                            instancePath +
                                                                                                                            '/contracts/theGraphUrl',
                                                                                                                        schemaPath:
                                                                                                                            '#/properties/contracts/properties/theGraphUrl/type',
                                                                                                                        keyword: 'type',
                                                                                                                        params: { type: 'string' },
                                                                                                                        message: 'must be string'
                                                                                                                    }
                                                                                                                ]
                                                                                                                return false
                                                                                                            }
                                                                                                        }
                                                                                                    }
                                                                                                    var valid15 = _errs153 === errors
                                                                                                } else {
                                                                                                    var valid15 = true
                                                                                                }
                                                                                                if (valid15) {
                                                                                                    let data68 = data55.maxConcurrentCalls
                                                                                                    const _errs155 = errors
                                                                                                    if (
                                                                                                        !(
                                                                                                            typeof data68 == 'number' &&
                                                                                                            isFinite(data68)
                                                                                                        )
                                                                                                    ) {
                                                                                                        validate10.errors = [
                                                                                                            {
                                                                                                                instancePath:
                                                                                                                    instancePath +
                                                                                                                    '/contracts/maxConcurrentCalls',
                                                                                                                schemaPath:
                                                                                                                    '#/properties/contracts/properties/maxConcurrentCalls/type',
                                                                                                                keyword: 'type',
                                                                                                                params: { type: 'number' },
                                                                                                                message: 'must be number'
                                                                                                            }
                                                                                                        ]
                                                                                                        return false
                                                                                                    }
                                                                                                    var valid15 = _errs155 === errors
                                                                                                    if (valid15) {
                                                                                                        let data69 = data55.pollInterval
                                                                                                        const _errs157 = errors
                                                                                                        if (
                                                                                                            !(
                                                                                                                typeof data69 == 'number' &&
                                                                                                                isFinite(data69)
                                                                                                            )
                                                                                                        ) {
                                                                                                            validate10.errors = [
                                                                                                                {
                                                                                                                    instancePath:
                                                                                                                        instancePath +
                                                                                                                        '/contracts/pollInterval',
                                                                                                                    schemaPath:
                                                                                                                        '#/properties/contracts/properties/pollInterval/type',
                                                                                                                    keyword: 'type',
                                                                                                                    params: { type: 'number' },
                                                                                                                    message: 'must be number'
                                                                                                                }
                                                                                                            ]
                                                                                                            return false
                                                                                                        }
                                                                                                        var valid15 = _errs157 === errors
                                                                                                    }
                                                                                                }
                                                                                            }
                                                                                        }
                                                                                    }
                                                                                }
                                                                            }
                                                                        }
                                                                    }
                                                                } else {
                                                                    validate10.errors = [
                                                                        {
                                                                            instancePath: instancePath + '/contracts',
                                                                            schemaPath: '#/properties/contracts/type',
                                                                            keyword: 'type',
                                                                            params: { type: 'object' },
                                                                            message: 'must be object'
                                                                        }
                                                                    ]
                                                                    return false
                                                                }
                                                            }
                                                            var valid0 = _errs125 === errors
                                                            if (valid0) {
                                                                let data70 = data.encryption
                                                                const _errs159 = errors
                                                                if (errors === _errs159) {
                                                                    if (data70 && typeof data70 == 'object' && !Array.isArray(data70)) {
                                                                        if (data70.litProtocolEnabled === undefined) {
                                                                            data70.litProtocolEnabled = false
                                                                        }
                                                                        if (data70.litProtocolLogging === undefined) {
                                                                            data70.litProtocolLogging = false
                                                                        }
                                                                        if (data70.keyRequestTimeout === undefined) {
                                                                            data70.keyRequestTimeout = 30000
                                                                        }
                                                                        if (data70.maxKeyRequestsPerSecond === undefined) {
                                                                            data70.maxKeyRequestsPerSecond = 20
                                                                        }
                                                                        if (data70.rsaKeyLength === undefined) {
                                                                            data70.rsaKeyLength = 4096
                                                                        }
                                                                        const _errs161 = errors
                                                                        for (const key12 in data70) {
                                                                            if (
                                                                                !(
                                                                                    key12 === 'litProtocolEnabled' ||
                                                                                    key12 === 'litProtocolLogging' ||
                                                                                    key12 === 'keyRequestTimeout' ||
                                                                                    key12 === 'maxKeyRequestsPerSecond' ||
                                                                                    key12 === 'rsaKeyLength'
                                                                                )
                                                                            ) {
                                                                                validate10.errors = [
                                                                                    {
                                                                                        instancePath: instancePath + '/encryption',
                                                                                        schemaPath: '#/properties/encryption/additionalProperties',
                                                                                        keyword: 'additionalProperties',
                                                                                        params: { additionalProperty: key12 },
                                                                                        message: 'must NOT have additional properties'
                                                                                    }
                                                                                ]
                                                                                return false
                                                                                break
                                                                            }
                                                                        }
                                                                        if (_errs161 === errors) {
                                                                            const _errs162 = errors
                                                                            if (typeof data70.litProtocolEnabled !== 'boolean') {
                                                                                validate10.errors = [
                                                                                    {
                                                                                        instancePath: instancePath + '/encryption/litProtocolEnabled',
                                                                                        schemaPath:
                                                                                            '#/properties/encryption/properties/litProtocolEnabled/type',
                                                                                        keyword: 'type',
                                                                                        params: { type: 'boolean' },
                                                                                        message: 'must be boolean'
                                                                                    }
                                                                                ]
                                                                                return false
                                                                            }
                                                                            var valid20 = _errs162 === errors
                                                                            if (valid20) {
                                                                                const _errs164 = errors
                                                                                if (typeof data70.litProtocolLogging !== 'boolean') {
                                                                                    validate10.errors = [
                                                                                        {
                                                                                            instancePath:
                                                                                                instancePath + '/encryption/litProtocolLogging',
                                                                                            schemaPath:
                                                                                                '#/properties/encryption/properties/litProtocolLogging/type',
                                                                                            keyword: 'type',
                                                                                            params: { type: 'boolean' },
                                                                                            message: 'must be boolean'
                                                                                        }
                                                                                    ]
                                                                                    return false
                                                                                }
                                                                                var valid20 = _errs164 === errors
                                                                                if (valid20) {
                                                                                    let data73 = data70.keyRequestTimeout
                                                                                    const _errs166 = errors
                                                                                    if (!(typeof data73 == 'number' && isFinite(data73))) {
                                                                                        validate10.errors = [
                                                                                            {
                                                                                                instancePath:
                                                                                                    instancePath + '/encryption/keyRequestTimeout',
                                                                                                schemaPath:
                                                                                                    '#/properties/encryption/properties/keyRequestTimeout/type',
                                                                                                keyword: 'type',
                                                                                                params: { type: 'number' },
                                                                                                message: 'must be number'
                                                                                            }
                                                                                        ]
                                                                                        return false
                                                                                    }
                                                                                    var valid20 = _errs166 === errors
                                                                                    if (valid20) {
                                                                                        let data74 = data70.maxKeyRequestsPerSecond
                                                                                        const _errs168 = errors
                                                                                        if (!(typeof data74 == 'number' && isFinite(data74))) {
                                                                                            validate10.errors = [
                                                                                                {
                                                                                                    instancePath:
                                                                                                        instancePath +
                                                                                                        '/encryption/maxKeyRequestsPerSecond',
                                                                                                    schemaPath:
                                                                                                        '#/properties/encryption/properties/maxKeyRequestsPerSecond/type',
                                                                                                    keyword: 'type',
                                                                                                    params: { type: 'number' },
                                                                                                    message: 'must be number'
                                                                                                }
                                                                                            ]
                                                                                            return false
                                                                                        }
                                                                                        var valid20 = _errs168 === errors
                                                                                        if (valid20) {
                                                                                            let data75 = data70.rsaKeyLength
                                                                                            const _errs170 = errors
                                                                                            if (!(typeof data75 == 'number' && isFinite(data75))) {
                                                                                                validate10.errors = [
                                                                                                    {
                                                                                                        instancePath:
                                                                                                            instancePath + '/encryption/rsaKeyLength',
                                                                                                        schemaPath:
                                                                                                            '#/properties/encryption/properties/rsaKeyLength/type',
                                                                                                        keyword: 'type',
                                                                                                        params: { type: 'number' },
                                                                                                        message: 'must be number'
                                                                                                    }
                                                                                                ]
                                                                                                return false
                                                                                            }
                                                                                            var valid20 = _errs170 === errors
                                                                                        }
                                                                                    }
                                                                                }
                                                                            }
                                                                        }
                                                                    } else {
                                                                        validate10.errors = [
                                                                            {
                                                                                instancePath: instancePath + '/encryption',
                                                                                schemaPath: '#/properties/encryption/type',
                                                                                keyword: 'type',
                                                                                params: { type: 'object' },
                                                                                message: 'must be object'
                                                                            }
                                                                        ]
                                                                        return false
                                                                    }
                                                                }
                                                                var valid0 = _errs159 === errors
                                                                if (valid0) {
                                                                    if (data.metrics !== undefined) {
                                                                        let data76 = data.metrics
                                                                        const _errs172 = errors
                                                                        const _errs173 = errors
                                                                        let valid21 = false
                                                                        const _errs174 = errors
                                                                        if (typeof data76 !== 'boolean') {
                                                                            const err7 = {
                                                                                instancePath: instancePath + '/metrics',
                                                                                schemaPath: '#/properties/metrics/anyOf/0/type',
                                                                                keyword: 'type',
                                                                                params: { type: 'boolean' },
                                                                                message: 'must be boolean'
                                                                            }
                                                                            if (vErrors === null) {
                                                                                vErrors = [err7]
                                                                            } else {
                                                                                vErrors.push(err7)
                                                                            }
                                                                            errors++
                                                                        }
                                                                        var _valid1 = _errs174 === errors
                                                                        valid21 = valid21 || _valid1
                                                                        if (!valid21) {
                                                                            const _errs176 = errors
                                                                            if (errors === _errs176) {
                                                                                if (data76 && typeof data76 == 'object' && !Array.isArray(data76)) {
                                                                                    const _errs178 = errors
                                                                                    for (const key13 in data76) {
                                                                                        if (!(key13 === 'periods' || key13 === 'maxPublishDelay')) {
                                                                                            const err8 = {
                                                                                                instancePath: instancePath + '/metrics',
                                                                                                schemaPath:
                                                                                                    '#/properties/metrics/anyOf/1/additionalProperties',
                                                                                                keyword: 'additionalProperties',
                                                                                                params: { additionalProperty: key13 },
                                                                                                message: 'must NOT have additional properties'
                                                                                            }
                                                                                            if (vErrors === null) {
                                                                                                vErrors = [err8]
                                                                                            } else {
                                                                                                vErrors.push(err8)
                                                                                            }
                                                                                            errors++
                                                                                            break
                                                                                        }
                                                                                    }
                                                                                    if (_errs178 === errors) {
                                                                                        if (data76.periods !== undefined) {
                                                                                            let data77 = data76.periods
                                                                                            const _errs179 = errors
                                                                                            if (errors === _errs179) {
                                                                                                if (Array.isArray(data77)) {
                                                                                                    var valid23 = true
                                                                                                    const len3 = data77.length
                                                                                                    for (let i3 = 0; i3 < len3; i3++) {
                                                                                                        let data78 = data77[i3]
                                                                                                        const _errs181 = errors
                                                                                                        if (errors === _errs181) {
                                                                                                            if (
                                                                                                                data78 &&
                                                                                                                typeof data78 == 'object' &&
                                                                                                                !Array.isArray(data78)
                                                                                                            ) {
                                                                                                                let missing5
                                                                                                                if (
                                                                                                                    (data78.streamId === undefined &&
                                                                                                                        (missing5 = 'streamId')) ||
                                                                                                                    (data78.duration === undefined &&
                                                                                                                        (missing5 = 'duration'))
                                                                                                                ) {
                                                                                                                    const err9 = {
                                                                                                                        instancePath:
                                                                                                                            instancePath +
                                                                                                                            '/metrics/periods/' +
                                                                                                                            i3,
                                                                                                                        schemaPath:
                                                                                                                            '#/properties/metrics/anyOf/1/properties/periods/items/required',
                                                                                                                        keyword: 'required',
                                                                                                                        params: {
                                                                                                                            missingProperty: missing5
                                                                                                                        },
                                                                                                                        message:
                                                                                                                            "must have required property '" +
                                                                                                                            missing5 +
                                                                                                                            "'"
                                                                                                                    }
                                                                                                                    if (vErrors === null) {
                                                                                                                        vErrors = [err9]
                                                                                                                    } else {
                                                                                                                        vErrors.push(err9)
                                                                                                                    }
                                                                                                                    errors++
                                                                                                                } else {
                                                                                                                    if (data78.id !== undefined) {
                                                                                                                        const _errs183 = errors
                                                                                                                        if (
                                                                                                                            typeof data78.id !==
                                                                                                                            'string'
                                                                                                                        ) {
                                                                                                                            const err10 = {
                                                                                                                                instancePath:
                                                                                                                                    instancePath +
                                                                                                                                    '/metrics/periods/' +
                                                                                                                                    i3 +
                                                                                                                                    '/id',
                                                                                                                                schemaPath:
                                                                                                                                    '#/properties/metrics/anyOf/1/properties/periods/items/properties/id/type',
                                                                                                                                keyword: 'type',
                                                                                                                                params: {
                                                                                                                                    type: 'string'
                                                                                                                                },
                                                                                                                                message:
                                                                                                                                    'must be string'
                                                                                                                            }
                                                                                                                            if (vErrors === null) {
                                                                                                                                vErrors = [err10]
                                                                                                                            } else {
                                                                                                                                vErrors.push(err10)
                                                                                                                            }
                                                                                                                            errors++
                                                                                                                        }
                                                                                                                        var valid24 =
                                                                                                                            _errs183 === errors
                                                                                                                    } else {
                                                                                                                        var valid24 = true
                                                                                                                    }
                                                                                                                    if (valid24) {
                                                                                                                        if (
                                                                                                                            data78.duration !==
                                                                                                                            undefined
                                                                                                                        ) {
                                                                                                                            let data80 =
                                                                                                                                data78.duration
                                                                                                                            const _errs185 = errors
                                                                                                                            if (
                                                                                                                                !(
                                                                                                                                    typeof data80 ==
                                                                                                                                        'number' &&
                                                                                                                                    isFinite(data80)
                                                                                                                                )
                                                                                                                            ) {
                                                                                                                                const err11 = {
                                                                                                                                    instancePath:
                                                                                                                                        instancePath +
                                                                                                                                        '/metrics/periods/' +
                                                                                                                                        i3 +
                                                                                                                                        '/duration',
                                                                                                                                    schemaPath:
                                                                                                                                        '#/properties/metrics/anyOf/1/properties/periods/items/properties/duration/type',
                                                                                                                                    keyword: 'type',
                                                                                                                                    params: {
                                                                                                                                        type: 'number'
                                                                                                                                    },
                                                                                                                                    message:
                                                                                                                                        'must be number'
                                                                                                                                }
                                                                                                                                if (
                                                                                                                                    vErrors === null
                                                                                                                                ) {
                                                                                                                                    vErrors = [err11]
                                                                                                                                } else {
                                                                                                                                    vErrors.push(
                                                                                                                                        err11
                                                                                                                                    )
                                                                                                                                }
                                                                                                                                errors++
                                                                                                                            }
                                                                                                                            var valid24 =
                                                                                                                                _errs185 === errors
                                                                                                                        } else {
                                                                                                                            var valid24 = true
                                                                                                                        }
                                                                                                                    }
                                                                                                                }
                                                                                                            } else {
                                                                                                                const err12 = {
                                                                                                                    instancePath:
                                                                                                                        instancePath +
                                                                                                                        '/metrics/periods/' +
                                                                                                                        i3,
                                                                                                                    schemaPath:
                                                                                                                        '#/properties/metrics/anyOf/1/properties/periods/items/type',
                                                                                                                    keyword: 'type',
                                                                                                                    params: { type: 'object' },
                                                                                                                    message: 'must be object'
                                                                                                                }
                                                                                                                if (vErrors === null) {
                                                                                                                    vErrors = [err12]
                                                                                                                } else {
                                                                                                                    vErrors.push(err12)
                                                                                                                }
                                                                                                                errors++
                                                                                                            }
                                                                                                        }
                                                                                                        var valid23 = _errs181 === errors
                                                                                                        if (!valid23) {
                                                                                                            break
                                                                                                        }
                                                                                                    }
                                                                                                } else {
                                                                                                    const err13 = {
                                                                                                        instancePath:
                                                                                                            instancePath + '/metrics/periods',
                                                                                                        schemaPath:
                                                                                                            '#/properties/metrics/anyOf/1/properties/periods/type',
                                                                                                        keyword: 'type',
                                                                                                        params: { type: 'array' },
                                                                                                        message: 'must be array'
                                                                                                    }
                                                                                                    if (vErrors === null) {
                                                                                                        vErrors = [err13]
                                                                                                    } else {
                                                                                                        vErrors.push(err13)
                                                                                                    }
                                                                                                    errors++
                                                                                                }
                                                                                            }
                                                                                            var valid22 = _errs179 === errors
                                                                                        } else {
                                                                                            var valid22 = true
                                                                                        }
                                                                                        if (valid22) {
                                                                                            if (data76.maxPublishDelay !== undefined) {
                                                                                                let data81 = data76.maxPublishDelay
                                                                                                const _errs187 = errors
                                                                                                if (
                                                                                                    !(typeof data81 == 'number' && isFinite(data81))
                                                                                                ) {
                                                                                                    const err14 = {
                                                                                                        instancePath:
                                                                                                            instancePath + '/metrics/maxPublishDelay',
                                                                                                        schemaPath:
                                                                                                            '#/properties/metrics/anyOf/1/properties/maxPublishDelay/type',
                                                                                                        keyword: 'type',
                                                                                                        params: { type: 'number' },
                                                                                                        message: 'must be number'
                                                                                                    }
                                                                                                    if (vErrors === null) {
                                                                                                        vErrors = [err14]
                                                                                                    } else {
                                                                                                        vErrors.push(err14)
                                                                                                    }
                                                                                                    errors++
                                                                                                }
                                                                                                var valid22 = _errs187 === errors
                                                                                            } else {
                                                                                                var valid22 = true
                                                                                            }
                                                                                        }
                                                                                    }
                                                                                } else {
                                                                                    const err15 = {
                                                                                        instancePath: instancePath + '/metrics',
                                                                                        schemaPath: '#/properties/metrics/anyOf/1/type',
                                                                                        keyword: 'type',
                                                                                        params: { type: 'object' },
                                                                                        message: 'must be object'
                                                                                    }
                                                                                    if (vErrors === null) {
                                                                                        vErrors = [err15]
                                                                                    } else {
                                                                                        vErrors.push(err15)
                                                                                    }
                                                                                    errors++
                                                                                }
                                                                            }
                                                                            var _valid1 = _errs176 === errors
                                                                            valid21 = valid21 || _valid1
                                                                        }
                                                                        if (!valid21) {
                                                                            const err16 = {
                                                                                instancePath: instancePath + '/metrics',
                                                                                schemaPath: '#/properties/metrics/anyOf',
                                                                                keyword: 'anyOf',
                                                                                params: {},
                                                                                message: 'must match a schema in anyOf'
                                                                            }
                                                                            if (vErrors === null) {
                                                                                vErrors = [err16]
                                                                            } else {
                                                                                vErrors.push(err16)
                                                                            }
                                                                            errors++
                                                                            validate10.errors = vErrors
                                                                            return false
                                                                        } else {
                                                                            errors = _errs173
                                                                            if (vErrors !== null) {
                                                                                if (_errs173) {
                                                                                    vErrors.length = _errs173
                                                                                } else {
                                                                                    vErrors = null
                                                                                }
                                                                            }
                                                                        }
                                                                        var valid0 = _errs172 === errors
                                                                    } else {
                                                                        var valid0 = true
                                                                    }
                                                                    if (valid0) {
                                                                        let data82 = data.cache
                                                                        const _errs189 = errors
                                                                        if (errors === _errs189) {
                                                                            if (data82 && typeof data82 == 'object' && !Array.isArray(data82)) {
                                                                                if (data82.maxSize === undefined) {
                                                                                    data82.maxSize = 10000
                                                                                }
                                                                                if (data82.maxAge === undefined) {
                                                                                    data82.maxAge = 86400000
                                                                                }
                                                                                const _errs191 = errors
                                                                                for (const key14 in data82) {
                                                                                    if (!(key14 === 'maxSize' || key14 === 'maxAge')) {
                                                                                        validate10.errors = [
                                                                                            {
                                                                                                instancePath: instancePath + '/cache',
                                                                                                schemaPath: '#/properties/cache/additionalProperties',
                                                                                                keyword: 'additionalProperties',
                                                                                                params: { additionalProperty: key14 },
                                                                                                message: 'must NOT have additional properties'
                                                                                            }
                                                                                        ]
                                                                                        return false
                                                                                        break
                                                                                    }
                                                                                }
                                                                                if (_errs191 === errors) {
                                                                                    let data83 = data82.maxSize
                                                                                    const _errs192 = errors
                                                                                    if (!(typeof data83 == 'number' && isFinite(data83))) {
                                                                                        validate10.errors = [
                                                                                            {
                                                                                                instancePath: instancePath + '/cache/maxSize',
                                                                                                schemaPath:
                                                                                                    '#/properties/cache/properties/maxSize/type',
                                                                                                keyword: 'type',
                                                                                                params: { type: 'number' },
                                                                                                message: 'must be number'
                                                                                            }
                                                                                        ]
                                                                                        return false
                                                                                    }
                                                                                    var valid25 = _errs192 === errors
                                                                                    if (valid25) {
                                                                                        let data84 = data82.maxAge
                                                                                        const _errs194 = errors
                                                                                        if (!(typeof data84 == 'number' && isFinite(data84))) {
                                                                                            validate10.errors = [
                                                                                                {
                                                                                                    instancePath: instancePath + '/cache/maxAge',
                                                                                                    schemaPath:
                                                                                                        '#/properties/cache/properties/maxAge/type',
                                                                                                    keyword: 'type',
                                                                                                    params: { type: 'number' },
                                                                                                    message: 'must be number'
                                                                                                }
                                                                                            ]
                                                                                            return false
                                                                                        }
                                                                                        var valid25 = _errs194 === errors
                                                                                    }
                                                                                }
                                                                            } else {
                                                                                validate10.errors = [
                                                                                    {
                                                                                        instancePath: instancePath + '/cache',
                                                                                        schemaPath: '#/properties/cache/type',
                                                                                        keyword: 'type',
                                                                                        params: { type: 'object' },
                                                                                        message: 'must be object'
                                                                                    }
                                                                                ]
                                                                                return false
                                                                            }
                                                                        }
                                                                        var valid0 = _errs189 === errors
                                                                        if (valid0) {
                                                                            let data85 = data._timeouts
                                                                            const _errs196 = errors
                                                                            if (errors === _errs196) {
                                                                                if (data85 && typeof data85 == 'object' && !Array.isArray(data85)) {
                                                                                    if (data85.theGraph === undefined) {
                                                                                        data85.theGraph = {}
                                                                                    }
                                                                                    if (data85.storageNode === undefined) {
                                                                                        data85.storageNode = {}
                                                                                    }
                                                                                    if (data85.ensStreamCreation === undefined) {
                                                                                        data85.ensStreamCreation = {}
                                                                                    }
                                                                                    if (data85.jsonRpcTimeout === undefined) {
                                                                                        data85.jsonRpcTimeout = 30000
                                                                                    }
                                                                                    const _errs198 = errors
                                                                                    for (const key15 in data85) {
                                                                                        if (
                                                                                            !(
                                                                                                key15 === 'theGraph' ||
                                                                                                key15 === 'storageNode' ||
                                                                                                key15 === 'ensStreamCreation' ||
                                                                                                key15 === 'jsonRpcTimeout'
                                                                                            )
                                                                                        ) {
                                                                                            validate10.errors = [
                                                                                                {
                                                                                                    instancePath: instancePath + '/_timeouts',
                                                                                                    schemaPath:
                                                                                                        '#/properties/_timeouts/additionalProperties',
                                                                                                    keyword: 'additionalProperties',
                                                                                                    params: { additionalProperty: key15 },
                                                                                                    message: 'must NOT have additional properties'
                                                                                                }
                                                                                            ]
                                                                                            return false
                                                                                            break
                                                                                        }
                                                                                    }
                                                                                    if (_errs198 === errors) {
                                                                                        let data86 = data85.theGraph
                                                                                        const _errs199 = errors
                                                                                        if (errors === _errs199) {
                                                                                            if (
                                                                                                data86 &&
                                                                                                typeof data86 == 'object' &&
                                                                                                !Array.isArray(data86)
                                                                                            ) {
                                                                                                if (data86.indexTimeout === undefined) {
                                                                                                    data86.indexTimeout = 60000
                                                                                                }
                                                                                                if (data86.indexPollInterval === undefined) {
                                                                                                    data86.indexPollInterval = 1000
                                                                                                }
                                                                                                if (data86.fetchTimeout === undefined) {
                                                                                                    data86.fetchTimeout = 30000
                                                                                                }
                                                                                                const _errs201 = errors
                                                                                                for (const key16 in data86) {
                                                                                                    if (
                                                                                                        !(
                                                                                                            key16 === 'indexTimeout' ||
                                                                                                            key16 === 'indexPollInterval' ||
                                                                                                            key16 === 'fetchTimeout'
                                                                                                        )
                                                                                                    ) {
                                                                                                        validate10.errors = [
                                                                                                            {
                                                                                                                instancePath:
                                                                                                                    instancePath +
                                                                                                                    '/_timeouts/theGraph',
                                                                                                                schemaPath:
                                                                                                                    '#/properties/_timeouts/properties/theGraph/additionalProperties',
                                                                                                                keyword: 'additionalProperties',
                                                                                                                params: { additionalProperty: key16 },
                                                                                                                message:
                                                                                                                    'must NOT have additional properties'
                                                                                                            }
                                                                                                        ]
                                                                                                        return false
                                                                                                        break
                                                                                                    }
                                                                                                }
                                                                                                if (_errs201 === errors) {
                                                                                                    let data87 = data86.indexTimeout
                                                                                                    const _errs202 = errors
                                                                                                    if (
                                                                                                        !(
                                                                                                            typeof data87 == 'number' &&
                                                                                                            isFinite(data87)
                                                                                                        )
                                                                                                    ) {
                                                                                                        validate10.errors = [
                                                                                                            {
                                                                                                                instancePath:
                                                                                                                    instancePath +
                                                                                                                    '/_timeouts/theGraph/indexTimeout',
                                                                                                                schemaPath:
                                                                                                                    '#/properties/_timeouts/properties/theGraph/properties/indexTimeout/type',
                                                                                                                keyword: 'type',
                                                                                                                params: { type: 'number' },
                                                                                                                message: 'must be number'
                                                                                                            }
                                                                                                        ]
                                                                                                        return false
                                                                                                    }
                                                                                                    var valid27 = _errs202 === errors
                                                                                                    if (valid27) {
                                                                                                        let data88 = data86.indexPollInterval
                                                                                                        const _errs204 = errors
                                                                                                        if (
                                                                                                            !(
                                                                                                                typeof data88 == 'number' &&
                                                                                                                isFinite(data88)
                                                                                                            )
                                                                                                        ) {
                                                                                                            validate10.errors = [
                                                                                                                {
                                                                                                                    instancePath:
                                                                                                                        instancePath +
                                                                                                                        '/_timeouts/theGraph/indexPollInterval',
                                                                                                                    schemaPath:
                                                                                                                        '#/properties/_timeouts/properties/theGraph/properties/indexPollInterval/type',
                                                                                                                    keyword: 'type',
                                                                                                                    params: { type: 'number' },
                                                                                                                    message: 'must be number'
                                                                                                                }
                                                                                                            ]
                                                                                                            return false
                                                                                                        }
                                                                                                        var valid27 = _errs204 === errors
                                                                                                        if (valid27) {
                                                                                                            let data89 = data86.fetchTimeout
                                                                                                            const _errs206 = errors
                                                                                                            if (
                                                                                                                !(
                                                                                                                    typeof data89 == 'number' &&
                                                                                                                    isFinite(data89)
                                                                                                                )
                                                                                                            ) {
                                                                                                                validate10.errors = [
                                                                                                                    {
                                                                                                                        instancePath:
                                                                                                                            instancePath +
                                                                                                                            '/_timeouts/theGraph/fetchTimeout',
                                                                                                                        schemaPath:
                                                                                                                            '#/properties/_timeouts/properties/theGraph/properties/fetchTimeout/type',
                                                                                                                        keyword: 'type',
                                                                                                                        params: { type: 'number' },
                                                                                                                        message: 'must be number'
                                                                                                                    }
                                                                                                                ]
                                                                                                                return false
                                                                                                            }
                                                                                                            var valid27 = _errs206 === errors
                                                                                                        }
                                                                                                    }
                                                                                                }
                                                                                            } else {
                                                                                                validate10.errors = [
                                                                                                    {
                                                                                                        instancePath:
                                                                                                            instancePath + '/_timeouts/theGraph',
                                                                                                        schemaPath:
                                                                                                            '#/properties/_timeouts/properties/theGraph/type',
                                                                                                        keyword: 'type',
                                                                                                        params: { type: 'object' },
                                                                                                        message: 'must be object'
                                                                                                    }
                                                                                                ]
                                                                                                return false
                                                                                            }
                                                                                        }
                                                                                        var valid26 = _errs199 === errors
                                                                                        if (valid26) {
                                                                                            let data90 = data85.storageNode
                                                                                            const _errs208 = errors
                                                                                            if (errors === _errs208) {
                                                                                                if (
                                                                                                    data90 &&
                                                                                                    typeof data90 == 'object' &&
                                                                                                    !Array.isArray(data90)
                                                                                                ) {
                                                                                                    if (data90.timeout === undefined) {
                                                                                                        data90.timeout = 30000
                                                                                                    }
                                                                                                    if (data90.retryInterval === undefined) {
                                                                                                        data90.retryInterval = 1000
                                                                                                    }
                                                                                                    const _errs210 = errors
                                                                                                    for (const key17 in data90) {
                                                                                                        if (
                                                                                                            !(
                                                                                                                key17 === 'timeout' ||
                                                                                                                key17 === 'retryInterval'
                                                                                                            )
                                                                                                        ) {
                                                                                                            validate10.errors = [
                                                                                                                {
                                                                                                                    instancePath:
                                                                                                                        instancePath +
                                                                                                                        '/_timeouts/storageNode',
                                                                                                                    schemaPath:
                                                                                                                        '#/properties/_timeouts/properties/storageNode/additionalProperties',
                                                                                                                    keyword: 'additionalProperties',
                                                                                                                    params: {
                                                                                                                        additionalProperty: key17
                                                                                                                    },
                                                                                                                    message:
                                                                                                                        'must NOT have additional properties'
                                                                                                                }
                                                                                                            ]
                                                                                                            return false
                                                                                                            break
                                                                                                        }
                                                                                                    }
                                                                                                    if (_errs210 === errors) {
                                                                                                        let data91 = data90.timeout
                                                                                                        const _errs211 = errors
                                                                                                        if (
                                                                                                            !(
                                                                                                                typeof data91 == 'number' &&
                                                                                                                isFinite(data91)
                                                                                                            )
                                                                                                        ) {
                                                                                                            validate10.errors = [
                                                                                                                {
                                                                                                                    instancePath:
                                                                                                                        instancePath +
                                                                                                                        '/_timeouts/storageNode/timeout',
                                                                                                                    schemaPath:
                                                                                                                        '#/properties/_timeouts/properties/storageNode/properties/timeout/type',
                                                                                                                    keyword: 'type',
                                                                                                                    params: { type: 'number' },
                                                                                                                    message: 'must be number'
                                                                                                                }
                                                                                                            ]
                                                                                                            return false
                                                                                                        }
                                                                                                        var valid28 = _errs211 === errors
                                                                                                        if (valid28) {
                                                                                                            let data92 = data90.retryInterval
                                                                                                            const _errs213 = errors
                                                                                                            if (
                                                                                                                !(
                                                                                                                    typeof data92 == 'number' &&
                                                                                                                    isFinite(data92)
                                                                                                                )
                                                                                                            ) {
                                                                                                                validate10.errors = [
                                                                                                                    {
                                                                                                                        instancePath:
                                                                                                                            instancePath +
                                                                                                                            '/_timeouts/storageNode/retryInterval',
                                                                                                                        schemaPath:
                                                                                                                            '#/properties/_timeouts/properties/storageNode/properties/retryInterval/type',
                                                                                                                        keyword: 'type',
                                                                                                                        params: { type: 'number' },
                                                                                                                        message: 'must be number'
                                                                                                                    }
                                                                                                                ]
                                                                                                                return false
                                                                                                            }
                                                                                                            var valid28 = _errs213 === errors
                                                                                                        }
                                                                                                    }
                                                                                                } else {
                                                                                                    validate10.errors = [
                                                                                                        {
                                                                                                            instancePath:
                                                                                                                instancePath +
                                                                                                                '/_timeouts/storageNode',
                                                                                                            schemaPath:
                                                                                                                '#/properties/_timeouts/properties/storageNode/type',
                                                                                                            keyword: 'type',
                                                                                                            params: { type: 'object' },
                                                                                                            message: 'must be object'
                                                                                                        }
                                                                                                    ]
                                                                                                    return false
                                                                                                }
                                                                                            }
                                                                                            var valid26 = _errs208 === errors
                                                                                            if (valid26) {
                                                                                                let data93 = data85.ensStreamCreation
                                                                                                const _errs215 = errors
                                                                                                if (errors === _errs215) {
                                                                                                    if (
                                                                                                        data93 &&
                                                                                                        typeof data93 == 'object' &&
                                                                                                        !Array.isArray(data93)
                                                                                                    ) {
                                                                                                        if (data93.timeout === undefined) {
                                                                                                            data93.timeout = 180000
                                                                                                        }
                                                                                                        if (data93.retryInterval === undefined) {
                                                                                                            data93.retryInterval = 1000
                                                                                                        }
                                                                                                        const _errs217 = errors
                                                                                                        for (const key18 in data93) {
                                                                                                            if (
                                                                                                                !(
                                                                                                                    key18 === 'timeout' ||
                                                                                                                    key18 === 'retryInterval'
                                                                                                                )
                                                                                                            ) {
                                                                                                                validate10.errors = [
                                                                                                                    {
                                                                                                                        instancePath:
                                                                                                                            instancePath +
                                                                                                                            '/_timeouts/ensStreamCreation',
                                                                                                                        schemaPath:
                                                                                                                            '#/properties/_timeouts/properties/ensStreamCreation/additionalProperties',
                                                                                                                        keyword:
                                                                                                                            'additionalProperties',
                                                                                                                        params: {
                                                                                                                            additionalProperty: key18
                                                                                                                        },
                                                                                                                        message:
                                                                                                                            'must NOT have additional properties'
                                                                                                                    }
                                                                                                                ]
                                                                                                                return false
                                                                                                                break
                                                                                                            }
                                                                                                        }
                                                                                                        if (_errs217 === errors) {
                                                                                                            let data94 = data93.timeout
                                                                                                            const _errs218 = errors
                                                                                                            if (
                                                                                                                !(
                                                                                                                    typeof data94 == 'number' &&
                                                                                                                    isFinite(data94)
                                                                                                                )
                                                                                                            ) {
                                                                                                                validate10.errors = [
                                                                                                                    {
                                                                                                                        instancePath:
                                                                                                                            instancePath +
                                                                                                                            '/_timeouts/ensStreamCreation/timeout',
                                                                                                                        schemaPath:
                                                                                                                            '#/properties/_timeouts/properties/ensStreamCreation/properties/timeout/type',
                                                                                                                        keyword: 'type',
                                                                                                                        params: { type: 'number' },
                                                                                                                        message: 'must be number'
                                                                                                                    }
                                                                                                                ]
                                                                                                                return false
                                                                                                            }
                                                                                                            var valid29 = _errs218 === errors
                                                                                                            if (valid29) {
                                                                                                                let data95 = data93.retryInterval
                                                                                                                const _errs220 = errors
                                                                                                                if (
                                                                                                                    !(
                                                                                                                        typeof data95 == 'number' &&
                                                                                                                        isFinite(data95)
                                                                                                                    )
                                                                                                                ) {
                                                                                                                    validate10.errors = [
                                                                                                                        {
                                                                                                                            instancePath:
                                                                                                                                instancePath +
                                                                                                                                '/_timeouts/ensStreamCreation/retryInterval',
                                                                                                                            schemaPath:
                                                                                                                                '#/properties/_timeouts/properties/ensStreamCreation/properties/retryInterval/type',
                                                                                                                            keyword: 'type',
                                                                                                                            params: {
                                                                                                                                type: 'number'
                                                                                                                            },
                                                                                                                            message: 'must be number'
                                                                                                                        }
                                                                                                                    ]
                                                                                                                    return false
                                                                                                                }
                                                                                                                var valid29 = _errs220 === errors
                                                                                                            }
                                                                                                        }
                                                                                                    } else {
                                                                                                        validate10.errors = [
                                                                                                            {
                                                                                                                instancePath:
                                                                                                                    instancePath +
                                                                                                                    '/_timeouts/ensStreamCreation',
                                                                                                                schemaPath:
                                                                                                                    '#/properties/_timeouts/properties/ensStreamCreation/type',
                                                                                                                keyword: 'type',
                                                                                                                params: { type: 'object' },
                                                                                                                message: 'must be object'
                                                                                                            }
                                                                                                        ]
                                                                                                        return false
                                                                                                    }
                                                                                                }
                                                                                                var valid26 = _errs215 === errors
                                                                                                if (valid26) {
                                                                                                    let data96 = data85.jsonRpcTimeout
                                                                                                    const _errs222 = errors
                                                                                                    if (
                                                                                                        !(
                                                                                                            typeof data96 == 'number' &&
                                                                                                            isFinite(data96)
                                                                                                        )
                                                                                                    ) {
                                                                                                        validate10.errors = [
                                                                                                            {
                                                                                                                instancePath:
                                                                                                                    instancePath +
                                                                                                                    '/_timeouts/jsonRpcTimeout',
                                                                                                                schemaPath:
                                                                                                                    '#/properties/_timeouts/properties/jsonRpcTimeout/type',
                                                                                                                keyword: 'type',
                                                                                                                params: { type: 'number' },
                                                                                                                message: 'must be number'
                                                                                                            }
                                                                                                        ]
                                                                                                        return false
                                                                                                    }
                                                                                                    var valid26 = _errs222 === errors
                                                                                                }
                                                                                            }
                                                                                        }
                                                                                    }
                                                                                } else {
                                                                                    validate10.errors = [
                                                                                        {
                                                                                            instancePath: instancePath + '/_timeouts',
                                                                                            schemaPath: '#/properties/_timeouts/type',
                                                                                            keyword: 'type',
                                                                                            params: { type: 'object' },
                                                                                            message: 'must be object'
                                                                                        }
                                                                                    ]
                                                                                    return false
                                                                                }
                                                                            }
                                                                            var valid0 = _errs196 === errors
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        } else {
            validate10.errors = [{ instancePath, schemaPath: '#/type', keyword: 'type', params: { type: 'object' }, message: 'must be object' }]
            return false
        }
    }
    validate10.errors = vErrors
    return errors === 0
}
