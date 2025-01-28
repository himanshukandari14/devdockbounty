import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { motion, AnimatePresence } from 'framer-motion'

function App() {
  const [creatorName, setCreatorName] = useState('')
  const [creatorDescription, setCreatorDescription] = useState('')
  const [tipAmount, setTipAmount] = useState('')
  const [creators, setCreators] = useState([])
  const [account, setAccount] = useState('')
  const [provider, setProvider] = useState(null)
  const [contract, setContract] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [aiSuggestion, setAiSuggestion] = useState('')
  const [showTutorial, setShowTutorial] = useState(false)

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

  // AI-like suggestion generator for descriptions
  const generateAISuggestion = () => {
    const suggestions = [
      "I create educational content about blockchain technology and Web3 development.",
      "Building the future of decentralized applications, one tutorial at a time.",
      "Sharing insights about smart contract development and cryptocurrency.",
      "Teaching others how to build on Ethereum and contribute to Web3.",
    ]
    setAiSuggestion(suggestions[Math.floor(Math.random() * suggestions.length)])
  }

  // Documentation modal component
  const DocModal = ({ isOpen, onClose }) => (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.95 }}
            className="bg-black/90 p-6 rounded-xl border border-white/10 max-w-2xl w-full"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
              Quick Start Guide
            </h3>
            <div className="space-y-4 text-gray-300">
              <div className="bg-white/5 p-4 rounded-lg">
                <h4 className="font-medium text-white mb-2">1. Connect Your Wallet</h4>
                <p className="text-sm">Click the "Connect Wallet" button to link your MetaMask wallet.</p>
              </div>
              <div className="bg-white/5 p-4 rounded-lg">
                <h4 className="font-medium text-white mb-2">2. Register as Creator</h4>
                <p className="text-sm">Fill in your details and click "Start Your Creator Journey".</p>
              </div>
              <div className="bg-white/5 p-4 rounded-lg">
                <h4 className="font-medium text-white mb-2">3. Receive Tips</h4>
                <p className="text-sm">Share your profile with supporters to receive ETH tips directly.</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="mt-6 w-full bg-gradient-to-r from-purple-600 to-pink-600 py-2 rounded-lg"
            >
              Got it!
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#000000] via-[#0a0a0a] to-[#000000] text-white">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(24,24,24,0.2),rgba(0,0,0,0.9))]" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent opacity-20" />
      </div>

      {/* Header */}
      <header className="backdrop-blur-sm border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto p-6">
          <div className="flex justify-between items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
                Social Tipping
              </h1>
              <div className="flex items-center gap-2">
                <p className="text-sm text-gray-400">Powered by AI Documentation</p>
                <button
                  onClick={() => setShowTutorial(true)}
                  className="text-xs bg-white/10 px-2 py-1 rounded-full hover:bg-white/20 transition-colors"
                >
                  View Guide
                </button>
              </div>
            </motion.div>
            <motion.button
              onClick={connectWallet}
              className="relative group px-6 py-3 rounded-lg overflow-hidden"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 transition-all duration-300 group-hover:opacity-90" />
              <span className="relative text-white font-medium">
                {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : 'Connect Wallet'}
              </span>
            </motion.button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto p-6 space-y-12">
        {/* Hero Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16 space-y-6"
        >
          <h2 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-red-500">
            Support Your Favorite Creators
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">
            Join the future of creator economy. Direct support with cryptocurrency, 
            no middlemen, instant payments.
          </p>
        </motion.section>

        {/* Creator Registration */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-purple-800/20 to-pink-800/20 rounded-xl blur-xl group-hover:blur-2xl transition-all duration-300" />
          <div className="relative bg-black/40 backdrop-blur-xl rounded-xl p-8 border border-white/10">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
                Become a Creator
              </h2>
              <button
                onClick={generateAISuggestion}
                className="text-sm bg-white/10 px-3 py-1.5 rounded-full hover:bg-white/20 transition-colors flex items-center gap-2"
              >
                <span className="animate-pulse">✨</span>
                AI Suggest
              </button>
            </div>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Creator Name"
                className="w-full bg-black/50 border border-white/10 rounded-lg p-4 text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                value={creatorName}
                onChange={(e) => setCreatorName(e.target.value)}
              />
              <div className="relative">
                <textarea
                  placeholder="Share your story..."
                  className="w-full bg-black/50 border border-white/10 rounded-lg p-4 text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 min-h-[120px]"
                  value={creatorDescription || aiSuggestion}
                  onChange={(e) => setCreatorDescription(e.target.value)}
                />
                {aiSuggestion && (
                  <div className="absolute bottom-2 right-2">
                    <span className="text-xs text-gray-500">AI Generated ✨</span>
                  </div>
                )}
              </div>
              <motion.button
                onClick={registerAsCreator}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 py-4 rounded-lg font-medium text-white shadow-lg shadow-purple-500/30"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Start Your Creator Journey
              </motion.button>
            </div>
          </div>
        </motion.section>

        {/* Creators List */}
        <section className="space-y-8">
          <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
            Featured Creators
          </h2>
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full border-t-2 border-purple-500 animate-spin" />
                <div className="absolute inset-2 rounded-full border-t-2 border-pink-500 animate-spin-slow" />
              </div>
            </div>
          ) : creators.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20 bg-black/40 backdrop-blur-xl rounded-xl border border-white/10"
            >
              <p className="text-gray-400 text-lg">Be the first creator to join our platform!</p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {creators.map((creator, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="group relative"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-800/20 to-pink-800/20 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-all duration-300" />
                  <div className="relative bg-black/40 backdrop-blur-xl rounded-xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h3 className="font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
                          {creator.name}
                        </h3>
                        <p className="text-gray-400 text-sm font-mono mt-1">
                          {creator.walletAddress.slice(0, 6)}...{creator.walletAddress.slice(-4)}
                        </p>
                      </div>
                      <div className="bg-black/60 px-4 py-2 rounded-full border border-white/10">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 font-bold">
                          {ethers.formatEther(creator.totalTips)} ETH
                        </span>
                      </div>
                    </div>
                    <p className="text-gray-300 mb-6">{creator.description}</p>
                    <div className="space-y-3">
                      <input
                        type="number"
                        step="0.001"
                        placeholder="Amount in ETH"
                        className="w-full bg-black/50 border border-white/10 rounded-lg p-4 text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                        onChange={(e) => setTipAmount(e.target.value)}
                      />
                      <motion.button
                        onClick={() => sendTip(creator.walletAddress, tipAmount)}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 py-3 rounded-lg font-medium text-white shadow-lg shadow-purple-500/30"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Support Creator
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Documentation Modal */}
      <DocModal isOpen={showTutorial} onClose={() => setShowTutorial(false)} />

      {/* Footer */}
      <footer className="border-t border-white/10 mt-20">
        <div className="max-w-6xl mx-auto py-12 px-6">
          <div className="text-center space-y-4">
            <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
              Social Tipping
            </h3>
            <p className="text-gray-400">
              Empowering creators through AI-enhanced decentralized support
            </p>
            <div className="flex justify-center gap-4 text-sm text-gray-500">
              <span>Built for DevDoc.ai Bounty</span>
              <span>•</span>
              <span>Documentation-First Approach</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
