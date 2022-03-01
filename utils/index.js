import Libp2p from 'libp2p'
import Websockets from 'libp2p-websockets'
import filters from 'libp2p-websockets/src/filters'

import WebRTCStar from 'libp2p-webrtc-star'
import { NOISE } from '@chainsafe/libp2p-noise'
import Mplex from 'libp2p-mplex'
import Bootstrap from 'libp2p-bootstrap'
import PeerId from 'peer-id'
import { multiaddr } from 'multiaddr'


export const Dial = async (peerId, node) => {
  const addr = multiaddr(node.multiaddrs[0].toString() + '/p2p/' + peerId)
  const conn = await node.dialProtocol(addr, ['/echo/1.0.0'])
  return conn
}

export const InitNode = async () => {
  let id
  const local_id = window.localStorage.getItem('peer_id')

  if(local_id){
    id = await PeerId.createFromJSON(JSON.parse(local_id))
  }

  else {
    id = await PeerId.create({keyType: 'secp256k1'})
    window.localStorage.setItem('peer_id', JSON.stringify(id.toJSON()))
  }

  const transportKey = Websockets.prototype[Symbol.toStringTag]

  const libp2p = await Libp2p.create({
    peerId: id,
    addresses: {
      // Add the signaling server address, along with our PeerId to our multiaddrs list
      // libp2p will automatically attempt to dial to the signaling server so that it can
      // receive inbound connections from other peers
      listen: [
        '/dns4/0.tcp.ngrok.io/tcp/17880',
        '/dns4/wrtc-star1.par.dwebops.pub/tcp/443/wss/p2p-webrtc-star',
        '/dns4/wrtc-star2.sjc.dwebops.pub/tcp/443/wss/p2p-webrtc-star'
      ]
    },
    modules: {
      transport: [Websockets, WebRTCStar],
      connEncryption: [NOISE],
      streamMuxer: [Mplex],
      peerDiscovery: [Bootstrap]
    },
    config: {
      peerDiscovery: {
        autoDial: false,
        // The `tag` property will be searched when creating the instance of your Peer Discovery service.
        // The associated object, will be passed to the service when it is instantiated.
        [Bootstrap.tag]: {
          enabled: true,
          list: [
            '/dnsaddr/bootstrap.libp2p.io/p2p/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN',
            '/dnsaddr/bootstrap.libp2p.io/p2p/QmbLHAnMoJPWSCR5Zhtx6BHJX9KiKNN6tpvbUcqanj75Nb',
            '/dnsaddr/bootstrap.libp2p.io/p2p/QmZa1sAxajnQjVM8WjWXoMbmPd7NsWhfKsPkErzpm9wGkp',
            '/dnsaddr/bootstrap.libp2p.io/p2p/QmQCU2EcMqAqQPR2i9bChDtGNJchTbq5TbXJJ16u19uLTa',
            '/dnsaddr/bootstrap.libp2p.io/p2p/QmcZf59bWwK5XFi76CZX8cbJ4BhTzzA3gU1ZjYZcYW3dwt'
          ]
        }
      },

      transport: {
        [transportKey]: {
          filter: filters.dnsWsOrWss
        }
      }
    }
  })

  libp2p.handle('/echo/1.0.0', ({connection, stream, protocol}) => {
    console.log(stream)
  })

  return libp2p
}