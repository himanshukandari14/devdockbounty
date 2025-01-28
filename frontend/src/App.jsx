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
    <div className="min-h-screen bg-[#000000] text-white">
      {/* Header */}
      <header className="border-b border-[#333333] p-6">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              Social Tipping
            </h1>
            <p className="text-sm text-gray-400 mt-1">Support creators with ETH</p>
          </div>
          <button
            onClick={connectWallet}
            className="bg-white hover:bg-gray-100 text-black px-5 py-2 rounded-md text-sm font-medium transition-all duration-200 ease-in-out transform hover:scale-[1.02]"
          >
            {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : 'Connect Wallet'}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto p-6 space-y-10">
        {/* Creator Registration */}
        <section className="bg-gradient-to-b from-[#1a1a1a] to-[#0d0d0d] rounded-xl p-8 border border-[#333333]">
          <h2 className="text-xl font-semibold mb-6 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            Become a Creator
          </h2>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Creator Name"
              className="w-full bg-black/50 border border-[#333333] rounded-lg p-3 text-sm focus:ring-2 focus:ring-white/20 focus:border-transparent transition-all duration-200"
              value={creatorName}
              onChange={(e) => setCreatorName(e.target.value)}
            />
            <textarea
              placeholder="Description"
              className="w-full bg-black/50 border border-[#333333] rounded-lg p-3 text-sm focus:ring-2 focus:ring-white/20 focus:border-transparent transition-all duration-200 min-h-[100px]"
              value={creatorDescription}
              onChange={(e) => setCreatorDescription(e.target.value)}
            />
            <button 
              onClick={registerAsCreator}
              className="w-full bg-white hover:bg-gray-100 text-black py-3 rounded-lg font-medium transition-all duration-200 ease-in-out transform hover:scale-[1.02] text-sm"
            >
              Register as Creator
            </button>
          </div>
        </section>

        {/* Creators List */}
        <section className="space-y-6">
          <h2 className="text-xl font-semibold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            Featured Creators
          </h2>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
            </div>
          ) : creators.length === 0 ? (
            <div className="text-center py-12 bg-gradient-to-b from-[#1a1a1a] to-[#0d0d0d] rounded-xl border border-[#333333]">
              <p className="text-gray-400">No creators found. Be the first to register!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {creators.map((creator, index) => (
                <div key={index} className="bg-gradient-to-b from-[#1a1a1a] to-[#0d0d0d] rounded-xl p-6 border border-[#333333] hover:border-[#444444] transition-all duration-200">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-medium text-lg">{creator.name}</h3>
                      <p className="text-gray-400 text-sm font-mono">
                        {creator.walletAddress.slice(0, 6)}...{creator.walletAddress.slice(-4)}
                      </p>
                    </div>
                    <span className="bg-black/30 px-4 py-1.5 rounded-full text-sm border border-[#333333]">
                      💎 {ethers.formatEther(creator.totalTips)} ETH
                    </span>
                  </div>
                  <p className="text-gray-300 text-sm mb-6">{creator.description}</p>
                  <div className="space-y-3">
                    <input
                      type="number"
                      step="0.001"
                      placeholder="Amount in ETH"
                      className="w-full bg-black/50 border border-[#333333] rounded-lg p-3 text-sm focus:ring-2 focus:ring-white/20 focus:border-transparent transition-all duration-200"
                      onChange={(e) => setTipAmount(e.target.value)}
                    />
                    <button 
                      onClick={() => sendTip(creator.walletAddress, tipAmount)}
                      className="w-full bg-white hover:bg-gray-100 text-black py-2.5 rounded-lg font-medium transition-all duration-200 ease-in-out transform hover:scale-[1.02] text-sm"
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
      <footer className="border-t border-[#333333] p-6 mt-12">
        <p className="text-center text-sm text-gray-400">
          Built with Ethereum Smart Contracts & React
        </p>
      </footer>
    </div>
  )
}

export default App
