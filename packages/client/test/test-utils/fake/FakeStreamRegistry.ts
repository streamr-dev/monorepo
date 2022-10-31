import { inject, scoped, Lifecycle } from 'tsyringe'
import { StreamID } from 'streamr-client-protocol'
import { Stream, StreamProperties } from '../../../src/Stream'
import {
    StreamPermission,
    isPublicPermissionAssignment,
    isPublicPermissionQuery,
    PermissionAssignment,
    PermissionQuery
} from '../../../src/permission'
import { StreamIDBuilder } from '../../../src/StreamIDBuilder'
import { StreamRegistry } from '../../../src/registry/StreamRegistry'
import { NotFoundError, SearchStreamsPermissionFilter } from '../../../src'
import { StreamRegistryCached } from '../../../src/registry/StreamRegistryCached'
import { Authentication, AuthenticationInjectionToken } from '../../../src/Authentication'
import { Methods } from '../types'
import { EthereumAddress, Multimap, toEthereumAddress } from '@streamr/utils'
import { FakeChain, PUBLIC_PERMISSION_TARGET, PublicPermissionTarget, StreamRegistryItem } from './FakeChain'
import { StreamFactory } from '../../../src/StreamFactory'

@scoped(Lifecycle.ContainerScoped)
export class FakeStreamRegistry implements Methods<StreamRegistry> {

    private readonly chain: FakeChain
    private readonly streamIdBuilder: StreamIDBuilder
    private readonly authentication: Authentication
    private readonly streamFactory: StreamFactory
    private readonly streamRegistryCached: StreamRegistryCached

    constructor(
        chain: FakeChain,
        streamIdBuilder: StreamIDBuilder,
        streamFactory: StreamFactory,
        streamRegistryCached: StreamRegistryCached,
        @inject(AuthenticationInjectionToken) authentication: Authentication
    ) {
        this.chain = chain
        this.streamIdBuilder = streamIdBuilder
        this.authentication = authentication
        this.streamFactory = streamFactory
        this.streamRegistryCached = streamRegistryCached
    }

    async createStream(propsOrStreamIdOrPath: StreamProperties | string): Promise<Stream> {
        if (!this.authentication.isAuthenticated()) {
            throw new Error('Not authenticated')
        }
        const props = typeof propsOrStreamIdOrPath === 'object' ? propsOrStreamIdOrPath : { id: propsOrStreamIdOrPath }
        props.partitions ??= 1
        const streamId = await this.streamIdBuilder.toStreamID(props.id)
        if (this.chain.streams.has(streamId)) {
            throw new Error(`Stream already exists: ${streamId}`)
        }
        const authenticatedUser: EthereumAddress = await this.authentication.getAddress()
        const permissions = new Multimap<EthereumAddress, StreamPermission>()
        permissions.addAll(authenticatedUser, Object.values(StreamPermission))
        const registryItem: StreamRegistryItem = {
            metadata: props,
            permissions
        }
        this.chain.streams.set(streamId, registryItem)
        return this.streamFactory.createStream({
            ...props,
            id: streamId
        })
    }

    async getStream(id: StreamID): Promise<Stream> {
        const registryItem = this.chain.streams.get(id)
        if (registryItem !== undefined) {
            return this.streamFactory.createStream({ ...registryItem.metadata, id })
        } else {
            throw new NotFoundError('Stream not found: id=' + id)
        }
    }

    // eslint-disable-next-line class-methods-use-this
    async updateStream(props: StreamProperties): Promise<Stream> {
        const streamId = await this.streamIdBuilder.toStreamID(props.id)
        const registryItem = this.chain.streams.get(streamId)
        if (registryItem === undefined) {
            throw new Error('Stream not found')
        } else {
            registryItem.metadata = props
        }
        return this.streamFactory.createStream({
            ...props,
            id: streamId
        })
    }

    async hasPermission(query: PermissionQuery): Promise<boolean> {
        const streamId = await this.streamIdBuilder.toStreamID(query.streamId)
        const registryItem = this.chain.streams.get(streamId)
        if (registryItem === undefined) {
            return false
        }
        const targets: Array<EthereumAddress | PublicPermissionTarget> = []
        if (isPublicPermissionQuery(query) || query.allowPublic) {
            targets.push(PUBLIC_PERMISSION_TARGET)
        }
        if ((query as any).user !== undefined) {
            targets.push(toEthereumAddress((query as any).user))
        }
        return targets.some((target) => registryItem.permissions.get(target).includes(query.permission))
    }

    async getPermissions(streamIdOrPath: string): Promise<PermissionAssignment[]> {
        const streamId = await this.streamIdBuilder.toStreamID(streamIdOrPath)
        const registryItem = this.chain.streams.get(streamId)
        if (registryItem === undefined) {
            return []
        }
        const targets = registryItem.permissions.keys()
        return targets.map((target) => {
            const permissions = registryItem.permissions.get(target)
            if (target === PUBLIC_PERMISSION_TARGET) {
                return {
                    public: true,
                    permissions
                }
            } else {
                return {
                    user: target,
                    permissions
                }
            }
        })
    }

    async grantPermissions(streamIdOrPath: string, ...assignments: PermissionAssignment[]): Promise<void> {
        return this.updatePermissions(
            streamIdOrPath,
            assignments,
            (registryItem: StreamRegistryItem, target: EthereumAddress | PublicPermissionTarget, permissions: StreamPermission[]) => {
                const nonExistingPermissions = permissions.filter((p) => !registryItem.permissions.has(target, p))
                registryItem.permissions.addAll(target, nonExistingPermissions)
            }
        )
    }

    async revokePermissions(streamIdOrPath: string, ...assignments: PermissionAssignment[]): Promise<void> {
        return this.updatePermissions(
            streamIdOrPath,
            assignments,
            (registryItem: StreamRegistryItem, target: EthereumAddress | PublicPermissionTarget, permissions: StreamPermission[]) => {
                registryItem.permissions.removeAll(target, permissions)
            }
        )
    }

    async updatePermissions(
        streamIdOrPath: string,
        assignments: PermissionAssignment[],
        modifyRegistryItem: (
            registryItem: StreamRegistryItem,
            target: EthereumAddress | PublicPermissionTarget,
            permissions: StreamPermission[]
        ) => void
    ): Promise<void> {
        const streamId = await this.streamIdBuilder.toStreamID(streamIdOrPath)
        this.streamRegistryCached.clearStream(streamId)
        const registryItem = this.chain.streams.get(streamId)
        if (registryItem === undefined) {
            throw new Error('Stream not found')
        } else {
            for (const assignment of assignments) {
                const target = isPublicPermissionAssignment(assignment)
                    ? PUBLIC_PERMISSION_TARGET
                    : toEthereumAddress(assignment.user)
                modifyRegistryItem(registryItem, target, assignment.permissions)
            }
        }
    }

    async setPermissions(...streams: {
        streamId: string
        assignments: PermissionAssignment[]
    }[]): Promise<void> {
        await Promise.all(streams.map(async (stream) => {
            await this.revokePermissions(stream.streamId, ...await this.getPermissions(stream.streamId))
            await this.grantPermissions(stream.streamId, ...stream.assignments)
        }))
    }

    async isStreamPublisher(streamIdOrPath: string, user: EthereumAddress): Promise<boolean> {
        return this.hasPermission({ streamId: streamIdOrPath, user, permission: StreamPermission.PUBLISH, allowPublic: true })
    }

    async isStreamSubscriber(streamIdOrPath: string, user: EthereumAddress): Promise<boolean> {
        return this.hasPermission({ streamId: streamIdOrPath, user, permission: StreamPermission.SUBSCRIBE, allowPublic: true })
    }

    // eslint-disable-next-line class-methods-use-this
    getOrCreateStream(_props: { id: string, partitions?: number }): Promise<Stream> {
        throw new Error('not implemented')
    }

    // eslint-disable-next-line class-methods-use-this
    deleteStream(_streamIdOrPath: string): Promise<void> {
        throw new Error('not implemented')
    }

    // eslint-disable-next-line class-methods-use-this
    getAllStreams(): AsyncGenerator<Stream, any, unknown> {
        throw new Error('not implemented')
    }

    // eslint-disable-next-line class-methods-use-this
    searchStreams(_term: string | undefined, _permissionFilter: SearchStreamsPermissionFilter | undefined): AsyncGenerator<Stream, any, unknown> {
        throw new Error('not implemented')
    }

    // eslint-disable-next-line class-methods-use-this
    getStreamPublishers(_streamIdOrPath: string): AsyncIterable<EthereumAddress> {
        throw new Error('not implemented')
    }

    // eslint-disable-next-line class-methods-use-this
    getStreamSubscribers(_streamIdOrPath: string): AsyncIterable<EthereumAddress> {
        throw new Error('not implemented')
    }
}
