import { useState } from 'react'
import './App.css'
import { CeramicClient } from '@ceramicnetwork/http-client'
import { EthereumAuthProvider, ThreeIdConnect } from '@3id/connect'
import { DID } from 'dids'
import { IDX } from '@ceramicstudio/idx'
import { ethers } from 'ethers'
import Web3Modal from 'web3modal';
import ThreeIdResolver from '@ceramicnetwork/3id-did-resolver';

const endpoint = "https://ceramic-clay.3boxlabs.com"
function App() {

  const [name, setName] = useState("")
  const [image, setImage] = useState("")
  const [loaded, setLoaded] = useState(false)

  async function connect() {
    const web3modal = new Web3Modal()
    const connection = await web3modal.connect()
    const provider = new ethers.providers.Web3Provider(connection)
    const signer = provider.getSigner()
    const address = await signer.getAddress()
    return address
  }

  async function readProfile() {
    if (typeof window.ethereum !== 'undefined') {
      const address = await connect()
      const ceramic = new CeramicClient(endpoint)
      const idx = new IDX({ceramic})

      if (typeof address !== 'undefined') {
        console.log(`reading: ${address}`)

        try {
          const data = await idx.get(
            'basicProfile',
            `${address}@eip155:1`
          )
          console.log(`data: ${data}`)
          if (data.name) setName(data.name)
          if (data.avatar) setImage(data.avatar)
        } catch(error) {
          console.log(error)
          setLoaded(true)
        }
      } else {
        window.alert('Please connect to your wallet')
      }
    } else {
      window.alert('Please connect to your wallet')
    }
  }


  async function updateProfile() {
    if (typeof window.ethereum !== 'undefined') {
      const address = await connect()

      const ceramic = new CeramicClient(endpoint)
      const threeIdConnect = new ThreeIdConnect()
      
      if (typeof address !== 'undefined') {
        const provider = new EthereumAuthProvider(window.ethereum, address)
        await threeIdConnect.connect(provider)
        const did = new DID({
          provider: threeIdConnect.getDidProvider(),
          resolver: {...ThreeIdResolver.getResolver(ceramic) }
        })
        ceramic.setDID(did)
        await ceramic.did.authenticate();
    
        const idx = new IDX({ceramic})
    
        await idx.set('basicProfile', {
          name,
          avatar: image
        })
        console.log("profile updated")
      } else {
        window.alert('Please connect to your wallet')
      }
    } else {
      window.alert('Please connect to your wallet')
    }
  }

  return (
    <div className="App">
      <input placeholder='name' onChange={e => setName(e.target.value)} type="text" />
      <input placeholder="Profile Image" onChange={e => setImage(e.target.value)} />

      <button onClick={updateProfile}>Set Profile</button>
      <button onClick={readProfile}>Read Profile</button>

      {name && <h3>{name}</h3>}
      {image && <img style={{width: '400px'}} src={image}/>}
      {(!image && !name && loaded) && <h4>No profile, please create one..</h4>}
    </div>
  )
}

export default App
