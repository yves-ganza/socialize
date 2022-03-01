import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.css'
import { useEffect, useState } from 'react'

import { InitNode, Dial } from '../utils'

export default function Home() {
  const [online, setOnline] = useState(false)
  const [status, setStatus] = useState('')
  const [peerId, setPeerId] = useState('')
  const [dialId,setDialId] = useState('')
  const [connectedPs, setConnectedPs] = useState([])
  const [node, setNode] = useState(null)

  const init = async () => {
    const node = await InitNode()
    setNode(node)

    node.on('error', err => {
      console.log(err)
    })

    // Listen for new peers
    node.on('peer:discovery', (peerId) => {
      // console.log(`Found peer ${peerId.toB58String()}`)
    })
    
    // Listen for new connections to peers
    node.connectionManager.on('peer:connect', (connection) => {
      setConnectedPs(prev => [...prev, connection.remotePeer.toB58String()])
    })
    
    // Listen for peers disconnecting
    node.connectionManager.on('peer:disconnect', (connection) => {
      const id = connection.remotePeer.toB58String()
      const temp = new Set(connectedPs)
      temp.delete(id)
      setConnectedPs(Array.from(temp))
    })

    await node.start()
    node.multiaddrs.forEach(addr => {
      console.log(addr.toString())
    })
    setOnline(node.isStarted())
    setPeerId(node.peerId.toB58String())
  }

  const handleDial = async e => {
    e.preventDefault()
    
    if(!online) return

    const conn = await Dial(dialId, node)
    console.log(conn)
  }

  useEffect(() => {
    init()
  }, [])

  return (
    <div className={styles.container}>
      <header className={styles.header}>
          <h1>Socialize - p2p</h1>
          <section>
              {status && <p>{status}</p>}
              {peerId && <p id="peer-id">Peer id: {peerId}</p>}
          </section>
      </header>
      <main>
          <section>
              <form>
                  <input 
                    type="text" 
                    placeholder="Enter peer id" 
                    value={dialId} 
                    onChange={e => setDialId(e.target.value)}
                  />
                  <button onClick={handleDial}>Dial</button>
              </form>
          </section>
          <section>
              <h3>Connected Peers</h3>
              <ul>
                {
                  Array.from(connectedPs).map((v, k) => <li key={k}>{v}</li>)
                }
              </ul>
          </section>
      </main>
      <footer className={styles.footer}>
          <p>2022 &#169; All rights Reserved</p>
      </footer>
    </div>
  )
}
