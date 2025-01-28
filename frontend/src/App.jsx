import { useState, useEffect } from 'react'
import { ethers } from 'ethers'

function App() {
  const [creatorName, setCreatorName] = useState('')
  const [creatorDescription, setCreatorDescription] = useState('')
  const [tipAmount, setTipAmount] = useState('')
  const [creators, setCreators] = useState([])
  const [account, setAccount] = useState('')
  const [provider, setProvider] = useState(null)
  const [contract, setContract] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        alert('Please install MetaMask!')
        return
      }

      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
      setAccount(accounts[0])

      // Setup ethers provider and contract
      const provider = new ethers.BrowserProvider(window.ethereum)
      setProvider(provider)

      // Updated contract address
      const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"
      
      // Add your contract ABI
      const contractABI =  [
        {
          "anonymous": false,
          "inputs": [
            {
              "indexed": true,
              "internalType": "address",
              "name": "creator",
              "type": "address"
            },
            {
              "indexed": false,
              "internalType": "string",
              "name": "name",
              "type": "string"
            }
          ],
          "name": "CreatorRegistered",
          "type": "event"
        },
        {
          "anonymous": false,
          "inputs": [
            {
              "indexed": true,
              "internalType": "address",
              "name": "from",
              "type": "address"
            },
            {
              "indexed": true,
              "internalType": "address",
              "name": "to",
              "type": "address"
            },
            {
              "indexed": false,
              "internalType": "uint256",
              "name": "amount",
              "type": "uint256"
            }
          ],
          "name": "TipSent",
          "type": "event"
        },
        {
          "inputs": [
            {
              "internalType": "uint256",
              "name": "",
              "type": "uint256"
            }
          ],
          "name": "creatorAddresses",
          "outputs": [
            {
              "internalType": "address",
              "name": "",
              "type": "address"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "address",
              "name": "",
              "type": "address"
            }
          ],
          "name": "creators",
          "outputs": [
            {
              "internalType": "address payable",
              "name": "walletAddress",
              "type": "address"
            },
            {
              "internalType": "string",
              "name": "name",
              "type": "string"
            },
            {
              "internalType": "string",
              "name": "description",
              "type": "string"
            },
            {
              "internalType": "uint256",
              "name": "totalTips",
              "type": "uint256"
            },
            {
              "internalType": "bool",
              "name": "isRegistered",
              "type": "bool"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "getAllCreators",
          "outputs": [
            {
              "components": [
                {
                  "internalType": "address payable",
                  "name": "walletAddress",
                  "type": "address"
                },
                {
                  "internalType": "string",
                  "name": "name",
                  "type": "string"
                },
                {
                  "internalType": "string",
                  "name": "description",
                  "type": "string"
                },
                {
                  "internalType": "uint256",
                  "name": "totalTips",
                  "type": "uint256"
                },
                {
                  "internalType": "bool",
                  "name": "isRegistered",
                  "type": "bool"
                }
              ],
              "internalType": "struct SocialTipping.Creator[]",
              "name": "",
              "type": "tuple[]"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "address",
              "name": "_creator",
              "type": "address"
            }
          ],
          "name": "getCreator",
          "outputs": [
            {
              "components": [
                {
                  "internalType": "address payable",
                  "name": "walletAddress",
                  "type": "address"
                },
                {
                  "internalType": "string",
                  "name": "name",
                  "type": "string"
                },
                {
                  "internalType": "string",
                  "name": "description",
                  "type": "string"
                },
                {
                  "internalType": "uint256",
                  "name": "totalTips",
                  "type": "uint256"
                },
                {
                  "internalType": "bool",
                  "name": "isRegistered",
                  "type": "bool"
                }
              ],
              "internalType": "struct SocialTipping.Creator",
              "name": "",
              "type": "tuple"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "string",
              "name": "_name",
              "type": "string"
            },
            {
              "internalType": "string",
              "name": "_description",
              "type": "string"
            }
          ],
          "name": "registerCreator",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [
            {
              "internalType": "address",
              "name": "_creator",
              "type": "address"
            }
          ],
          "name": "tipCreator",
          "outputs": [],
          "stateMutability": "payable",
          "type": "function"
        }
      ]
      
      const contract = new ethers.Contract(contractAddress, contractABI, await provider.getSigner())
      setContract(contract)

      // Load creators after connecting
      loadCreators()
    } catch (error) {
      console.error('Error connecting wallet:', error)
    }
  }

  const registerAsCreator = async () => {
    try {
      if (!contract) return
      const tx = await contract.registerCreator(creatorName, creatorDescription)
      await tx.wait()
      // Reset form and reload creators
      setCreatorName('')
      setCreatorDescription('')
      loadCreators()
    } catch (error) {
      console.error('Error registering creator:', error)
    }
  }

  const sendTip = async (creatorAddress, amount) => {
    try {
      if (!contract) return
      // Updated to use parseEther from ethers v6
      const tipAmountWei = ethers.parseEther(amount)
      const tx = await contract.tipCreator(creatorAddress, { value: tipAmountWei })
      await tx.wait()
      loadCreators()
    } catch (error) {
      console.error('Error sending tip:', error)
    }
  }

  const loadCreators = async () => {
    try {
      if (!contract) return
      setIsLoading(true)
      const allCreators = await contract.getAllCreators()
      setCreators(allCreators)
    } catch (error) {
      console.error('Error loading creators:', error)
      setCreators([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (contract) {
      loadCreators()
    }
  }, [contract])

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-gray-800 p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tighter">Social Tipping</h1>
            <p className="text-gray-400 mt-2">Support your favorite creators with ETH</p>
          </div>
          <button
            onClick={connectWallet}
            className="bg-white text-black px-4 py-2 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
          >
            {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : 'Connect Wallet'}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto p-6 space-y-12">
        {/* Creator Registration */}
        <section className="bg-gray-900 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Become a Creator</h2>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Creator Name"
              className="w-full bg-black border border-gray-800 rounded-lg p-3 focus:ring-2 focus:ring-white"
              value={creatorName}
              onChange={(e) => setCreatorName(e.target.value)}
            />
            <textarea
              placeholder="Description"
              className="w-full bg-black border border-gray-800 rounded-lg p-3 focus:ring-2 focus:ring-white"
              value={creatorDescription}
              onChange={(e) => setCreatorDescription(e.target.value)}
            />
            <button 
              onClick={registerAsCreator}
              className="w-full bg-white text-black py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
            >
              Register as Creator
            </button>
          </div>
        </section>

        {/* Creators List */}
        <section className="space-y-6">
          <h2 className="text-xl font-semibold">Featured Creators</h2>
          {isLoading ? (
            <div className="text-center py-4">Loading creators...</div>
          ) : creators.length === 0 ? (
            <div className="text-center py-4 text-gray-400">No creators found. Be the first to register!</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {creators.map((creator, index) => (
                <div key={index} className="bg-gray-900 rounded-xl p-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{creator.name}</h3>
                      <p className="text-gray-400 text-sm">
                        {creator.walletAddress.slice(0, 6)}...{creator.walletAddress.slice(-4)}
                      </p>
                    </div>
                    <span className="bg-gray-800 px-3 py-1 rounded-full text-sm">
                      💎 {ethers.formatEther(creator.totalTips)} ETH
                    </span>
                  </div>
                  <p className="text-gray-300">{creator.description}</p>
                  <div className="space-y-2">
                    <input
                      type="number"
                      step="0.001"
                      placeholder="Amount in ETH"
                      className="w-full bg-black border border-gray-800 rounded-lg p-3 focus:ring-2 focus:ring-white"
                      onChange={(e) => setTipAmount(e.target.value)}
                    />
                    <button 
                      onClick={() => sendTip(creator.walletAddress, tipAmount)}
                      className="w-full bg-white text-black py-2 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                    >
                      Send Tip
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 p-6 mt-12">
        <p className="text-center text-gray-400">
          Built with Ethereum Smart Contracts & React
        </p>
      </footer>
    </div>
  )
}

export default App
