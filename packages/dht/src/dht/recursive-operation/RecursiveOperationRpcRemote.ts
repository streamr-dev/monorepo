import { Logger } from '@streamr/utils'
import { v4 } from 'uuid'
import { RouteMessageWrapper } from '../../proto/packages/dht/protos/DhtRpc'
import { RecursiveOperationRpcClient } from '../../proto/packages/dht/protos/DhtRpc.client'
import { RpcRemote } from '../contact/RpcRemote'
import { getPreviousPeer } from '../routing/getPreviousPeer'
import { getNodeIdFromPeerDescriptor } from '../../identifiers'

const logger = new Logger(module)

export class RecursiveOperationRpcRemote extends RpcRemote<RecursiveOperationRpcClient> {

    async routeRequest(params: RouteMessageWrapper): Promise<boolean> {
        const message: RouteMessageWrapper = {
            target: params.target,
            sourcePeer: params.sourcePeer,
            message: params.message,
            requestId: params.requestId ?? v4(),
            reachableThrough: params.reachableThrough ?? [],
            routingPath: params.routingPath,
            parallelRootNodeIds: params.parallelRootNodeIds
        }
        const options = this.formDhtRpcOptions({
            connect: false
        })
        try {
            const ack = await this.getClient().routeRequest(message, options)
            if (ack.error !== undefined) {
                logger.trace('Next hop responded with error ' + ack.error)
                return false
            }
        } catch (err) {
            const previousPeer = getPreviousPeer(params)
            const fromNode = previousPeer
                ? getNodeIdFromPeerDescriptor(previousPeer)
                : getNodeIdFromPeerDescriptor(params.sourcePeer!)
            const toNode = getNodeIdFromPeerDescriptor(this.getPeerDescriptor())
            logger.debug(`Failed to send routeRequest message from ${fromNode} to ${toNode}`, { err })
            return false
        }
        return true
    }
}
