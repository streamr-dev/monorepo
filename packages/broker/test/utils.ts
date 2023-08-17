import StreamrClient, {
    CONFIG_TEST,
    Stream,
    StreamPermission,
    StreamMetadata,
    StreamrClientConfig,
    NetworkPeerDescriptor
} from 'streamr-client'
import padEnd from 'lodash/padEnd'
import { Wallet } from 'ethers'
import { Broker, createBroker } from '../src/broker'
import { Config } from '../src/config/config'
import { StreamPartID } from '@streamr/protocol'
import { EthereumAddress, toEthereumAddress, merge } from '@streamr/utils'
import { v4 as uuid } from 'uuid'

export const STREAMR_DOCKER_DEV_HOST = process.env.STREAMR_DOCKER_DEV_HOST || '127.0.0.1'

interface TestConfig {
    privateKey: string
    networkLayerWsServerPort?: number
    httpPort?: number
    extraPlugins?: Record<string, unknown>
    apiAuthentication?: Config['apiAuthentication']
    enableCassandra?: boolean
    storageConfigRefreshInterval?: number
    entryPoints?: NetworkPeerDescriptor[]
}

export const DEFAULT_ENTRYPOINTS = [{
    id: 'entrypoint',
    websocket: {
        ip: '127.0.0.1',
        port: 40500
    }
}]

export const formConfig = ({
    privateKey,
    httpPort,
    extraPlugins = {},
    apiAuthentication,
    enableCassandra = false,
    storageConfigRefreshInterval = 0,
    networkLayerWsServerPort,
    entryPoints = DEFAULT_ENTRYPOINTS
}: TestConfig): Config => {
    const plugins: Record<string, any> = { ...extraPlugins }
    if (httpPort) {
        if (enableCassandra) {
            plugins['storage'] = {
                cassandra: {
                    hosts: [STREAMR_DOCKER_DEV_HOST],
                    datacenter: 'datacenter1',
                    username: '',
                    password: '',
                    keyspace: 'streamr_dev_v2',
                },
                storageConfig: {
                    refreshInterval: storageConfigRefreshInterval
                }
            }
        }
    }
    const peerDescriptor = networkLayerWsServerPort ? {
        id: uuid(),
        websocket: {
            ip: '127.0.0.1',
            port: networkLayerWsServerPort
        }
    } : {
        id: uuid(),
    }

    return {
        client: {
            ...CONFIG_TEST,
            auth: {
                privateKey
            },
            network: {
                controlLayer: {
                    entryPoints,
                    peerDescriptor,
                },
                node: {
                    id: toEthereumAddress(new Wallet(privateKey).address),
                }
            }
        },
        httpServer: {
            port: httpPort ? httpPort : 7171
        },
        apiAuthentication,
        plugins
    }
}

export const startBroker = async (testConfig: TestConfig): Promise<Broker> => {
    const broker = await createBroker(formConfig(testConfig))
    await broker.start()
    return broker
}

export const createEthereumAddress = (id: number): EthereumAddress => {
    return toEthereumAddress('0x' + padEnd(String(id), 40, '0'))
}

export const createClient = (
    privateKey: string,
    clientOptions?: StreamrClientConfig
): StreamrClient => {
    const opts = merge(
        CONFIG_TEST,
        {
            auth: {
                privateKey
            },
            network: {
                controlLayer: {
                    ...CONFIG_TEST.network!.controlLayer!,
                    entryPoints: DEFAULT_ENTRYPOINTS
                },
                node:
                    merge(
                        CONFIG_TEST!.network!.node,
                        clientOptions?.network?.node
                    )
            }
        },
        clientOptions
    )
    return new StreamrClient(opts)
}

export const getTestName = (module: NodeModule): string => {
    const fileNamePattern = new RegExp('.*/(.*).test\\...')
    const groups = module.filename.match(fileNamePattern)
    return (groups !== null) ? groups[1] : module.filename
}

export const createTestStream = async (
    streamrClient: StreamrClient,
    module: NodeModule,
    props?: Partial<StreamMetadata>
): Promise<Stream> => {
    const id = `${await streamrClient.getAddress()}/test/${getTestName(module)}/${Date.now()}`
    const stream = await streamrClient.createStream({
        id,
        ...props
    })
    return stream
}

export const getStreamParts = async (broker: Broker): Promise<StreamPartID[]> => {
    const node = await broker.getNode()
    return Array.from(node.getStreamParts())
}

export async function startStorageNode(
    storageNodePrivateKey: string,
    httpPort: number,
    networkLayerWsServerPort: number,
    entryPoints?: NetworkPeerDescriptor[],
    extraPlugins = {}
): Promise<Broker> {
    const client = new StreamrClient({
        ...CONFIG_TEST,
        auth: {
            privateKey: storageNodePrivateKey
        }
    })
    try {
        await client.setStorageNodeMetadata({
            http: `http://127.0.0.1:${httpPort}`
        })
        await createAssignmentStream(client)
    } finally {
        client?.destroy()
    }
    return startBroker({
        privateKey: storageNodePrivateKey,
        httpPort,
        enableCassandra: true,
        networkLayerWsServerPort,
        entryPoints,
        extraPlugins
    })
}

async function createAssignmentStream(client: StreamrClient): Promise<Stream> {
    const stream = await client.getOrCreateStream({
        id: '/assignments',
        partitions: 1
    })
    await stream.grantPermissions({
        public: true,
        permissions: [StreamPermission.SUBSCRIBE]
    })
    return stream
}
