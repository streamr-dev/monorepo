import { ConnectionType } from '../connection/IConnection'
import { ConnectivityMethod, NodeType, PeerDescriptor } from '../proto/packages/dht/protos/DhtRpc'
import { isPrivateIPv4 } from './AddressTools'

export const canOpenConnectionFromBrowser = (websocketServer: ConnectivityMethod): boolean => {
    const hasPrivateAddress = ((websocketServer.host === 'localhost') || isPrivateIPv4(websocketServer.host))
    return websocketServer.tls || hasPrivateAddress
}

export const expectedConnectionType = (localPeerDescriptor: PeerDescriptor, remotePeerDescriptor: PeerDescriptor): ConnectionType => {
    if (localPeerDescriptor.websocket === undefined && remotePeerDescriptor.websocket === undefined) {
        return ConnectionType.WEBRTC
    } if (remotePeerDescriptor.websocket 
        && (localPeerDescriptor!.type !== NodeType.BROWSER || canOpenConnectionFromBrowser(remotePeerDescriptor.websocket))) {
        return ConnectionType.WEBSOCKET_CLIENT
    } else if (localPeerDescriptor!.websocket 
        && (remotePeerDescriptor.type !== NodeType.BROWSER || canOpenConnectionFromBrowser(localPeerDescriptor!.websocket))) {
        return ConnectionType.WEBSOCKET_SERVER
    } 
    return ConnectionType.WEBRTC
}
