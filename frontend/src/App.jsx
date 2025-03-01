import { useState, useEffect, useCallback, memo } from 'react'
import { ethers } from 'ethers'
import { motion, AnimatePresence } from 'framer-motion'
import devdocLogo from './assets/logo.png'
import { HoverEffect } from "./components/ui/card-hover-effect";
import History from './components/History';

// Move CreatorCard outside of App component and memoize it
const CreatorCard = memo(({ item, onTip, isSending, currentTipAmount, onTipAmountChange }) => {
  return (
    <div className="p-4 flex flex-col h-full">
      <h3 className="text-lg font-bold text-zinc-100 tracking-wide">
        {item.title}
      </h3>
      <p className="text-zinc-400 text-sm font-mono mt-1">
        {item.address.slice(0, 6)}...{item.address.slice(-4)}
      </p>
      <p className="mt-4 text-zinc-400 tracking-wide leading-relaxed text-sm">
        {item.description}
      </p>
      <div className="mt-auto pt-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-zinc-400 text-sm">Total Tips:</span>
          <span className="text-zinc-100 font-semibold">{item.stats}</span>
        </div>
        <input
          type="text"
          inputMode="decimal"
          placeholder="Amount in ETH"
          className="w-full bg-black/50 border border-white/10 rounded-lg p-2 text-sm text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 mb-2"
          value={currentTipAmount}
          onChange={(e) => onTipAmountChange(item.address, e.target.value)}
          disabled={isSending}
        />
        <motion.button
          onClick={(e) => {
            e.stopPropagation();
            onTip(item.address, currentTipAmount);
          }}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 py-2 rounded-lg font-medium text-white text-sm shadow-lg shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
          whileHover={{ scale: isSending ? 1 : 1.02 }}
          whileTap={{ scale: isSending ? 1 : 0.98 }}
          disabled={isSending}
        >
          {isSending ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Sending...</span>
            </div>
          ) : (
            'Send Tip'
          )}
        </motion.button>
      </div>
    </div>
  );
});

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
  const [showExtensionPromo, setShowExtensionPromo] = useState(true)
  const [activeTab, setActiveTab] = useState('main')
  const [isConnecting, setIsConnecting] = useState(false)
  const [theme, setTheme] = useState('dark')
  const [viewMode, setViewMode] = useState('list')
  const [isCompact, setIsCompact] = useState(false)
  const [sendingTipTo, setSendingTipTo] = useState(null)
  const [tipAmounts, setTipAmounts] = useState({})
  const [showAlreadyRegistered, setShowAlreadyRegistered] = useState(false)
  const [leaderboardView, setLeaderboardView] = useState('grid')

  const themes = {
    dark: {
      bg: 'bg-black',
      text: 'text-white',
      border: 'border-white/10',
      card: 'bg-black/40',
      accent: 'text-green-400',
      hover: 'hover:border-white/20'
    },
   
    cyber: {
      bg: 'bg-slate-900',
      text: 'text-cyan-400',
      border: 'border-cyan-500/20',
      card: 'bg-slate-800/40',
      accent: 'text-cyan-400',
      hover: 'hover:border-cyan-500/40'
    }
  }

  const connectWallet = async () => {
    try {
      setIsConnecting(true)
      
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
      const contractAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"
      
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
            },
            {
              "indexed": false,
              "internalType": "uint256",
              "name": "timestamp",
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
            },
            {
              "internalType": "uint256",
              "name": "",
              "type": "uint256"
            }
          ],
          "name": "creatorTips",
          "outputs": [
            {
              "internalType": "uint256",
              "name": "",
              "type": "uint256"
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
          "inputs": [],
          "name": "getAllTips",
          "outputs": [
            {
              "components": [
                {
                  "internalType": "address",
                  "name": "from",
                  "type": "address"
                },
                {
                  "internalType": "address",
                  "name": "to",
                  "type": "address"
                },
                {
                  "internalType": "uint256",
                  "name": "amount",
                  "type": "uint256"
                },
                {
                  "internalType": "uint256",
                  "name": "timestamp",
                  "type": "uint256"
                }
              ],
              "internalType": "struct SocialTipping.Tip[]",
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
              "internalType": "address",
              "name": "_creator",
              "type": "address"
            }
          ],
          "name": "getCreatorTips",
          "outputs": [
            {
              "components": [
                {
                  "internalType": "address",
                  "name": "from",
                  "type": "address"
                },
                {
                  "internalType": "address",
                  "name": "to",
                  "type": "address"
                },
                {
                  "internalType": "uint256",
                  "name": "amount",
                  "type": "uint256"
                },
                {
                  "internalType": "uint256",
                  "name": "timestamp",
                  "type": "uint256"
                }
              ],
              "internalType": "struct SocialTipping.Tip[]",
              "name": "",
              "type": "tuple[]"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "getTotalTipsCount",
          "outputs": [
            {
              "internalType": "uint256",
              "name": "",
              "type": "uint256"
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
        },
        {
          "inputs": [
            {
              "internalType": "uint256",
              "name": "",
              "type": "uint256"
            }
          ],
          "name": "tips",
          "outputs": [
            {
              "internalType": "address",
              "name": "from",
              "type": "address"
            },
            {
              "internalType": "address",
              "name": "to",
              "type": "address"
            },
            {
              "internalType": "uint256",
              "name": "amount",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "timestamp",
              "type": "uint256"
            }
          ],
          "stateMutability": "view",
          "type": "function"
        }
      ]
      
      const contract = new ethers.Contract(contractAddress, contractABI, await provider.getSigner())
      setContract(contract)

      // Load creators after connecting
      loadCreators()
    } catch (error) {
      console.error('Error connecting wallet:', error)
    } finally {
      setIsConnecting(false)
    }
  }

  const registerAsCreator = async () => {
    try {
      if (!contract) return;
      
      // Check if user is already registered
      const creator = await contract.getCreator(account);
      if (creator && creator.isRegistered) {
        setShowAlreadyRegistered(true);
        // Auto-hide after 3 seconds
        setTimeout(() => setShowAlreadyRegistered(false), 3000);
        return;
      }

      const tx = await contract.registerCreator(creatorName, creatorDescription);
      await tx.wait();
      // Reset form and reload creators
      setCreatorName('');
      setCreatorDescription('');
      loadCreators();
    } catch (error) {
      console.error('Error registering creator:', error);
    }
  };

  const loadCreators = useCallback(async () => {
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
  }, [contract])

  const handleTipAmountChange = useCallback((creatorAddress, value) => {
    if (value === '' || value === '.') {
      setTipAmounts(prev => ({
        ...prev,
        [creatorAddress]: value
      }));
      return;
    }

    if (/^\d*\.?\d*$/.test(value)) {
      setTipAmounts(prev => ({
        ...prev,
        [creatorAddress]: value
      }));
    }
  }, []);

  const handleSendTip = useCallback(async (creatorAddress, amount) => {
    try {
      if (!contract) return
      setSendingTipTo(creatorAddress)
      const tipAmountWei = ethers.parseEther(amount)
      const tx = await contract.tipCreator(creatorAddress, { value: tipAmountWei })
      await tx.wait()
      await loadCreators()
      setTipAmounts(prev => ({
        ...prev,
        [creatorAddress]: ''
      }));
    } catch (error) {
      console.error('Error sending tip:', error)
    } finally {
      setSendingTipTo(null)
    }
  }, [contract, loadCreators])

  const renderCreatorCard = useCallback((item) => (
    <CreatorCard
      key={item.address}
      item={item}
      onTip={handleSendTip}
      isSending={sendingTipTo === item.address}
      currentTipAmount={tipAmounts[item.address] || ''}
      onTipAmountChange={handleTipAmountChange}
    />
  ), [handleSendTip, sendingTipTo, tipAmounts, handleTipAmountChange]);

  useEffect(() => {
    if (contract) {
      loadCreators()
    }
  }, [contract, loadCreators])

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

  // Extension Promo Component
  const ExtensionPromo = ({ isVisible, onClose }) => (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-6 right-6 z-50"
        >
          <div className="relative bg-black/90 backdrop-blur-xl p-6 rounded-xl border border-white/10 max-w-md shadow-2xl">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              ×
            </button>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br  flex items-center justify-center">
                <span className="text-2xl">
                  <img src={devdocLogo} alt="devdock logo" />
                </span>
              </div>
              <div className="space-y-2">
                <h4 className="font-bold text-lg bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
                  Enhance Your Dev Experience
                </h4>
                <p className="text-sm text-gray-300">
                  Get AI-powered documentation and code explanations right in your IDE with the DevDoc Extension.
                </p>
                <div className="flex gap-3 mt-4">
                  <motion.a
                    href="https://marketplace.visualstudio.com/items?itemName=agent.devdock"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-sm transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M23.15 2.587L18.21.21a1.494 1.494 0 0 0-1.705.29l-9.46 8.63-4.12-3.128a.999.999 0 0 0-1.276.057L.327 7.261A1 1 0 0 0 .326 8.74L3.899 12 .326 15.26a1 1 0 0 0 .001 1.479L1.65 17.94a.999.999 0 0 0 1.276.057l4.12-3.128 9.46 8.63a1.492 1.492 0 0 0 1.704.29l4.942-2.377A1.5 1.5 0 0 0 24 20.06V3.939a1.5 1.5 0 0 0-.85-1.352zm-5.146 14.861L10.826 12l7.178-5.448v10.896z"/>
                    </svg>
                    Install Extension
                  </motion.a>
                  <motion.a
                    href="https://devdock.ai"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Learn More →
                  </motion.a>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-white/10">
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  AI-Powered
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  Real-Time
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                  Free to Use
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  // Transform creators data for the HoverEffect component
  const getCreatorCards = () => {
    return creators.map(creator => ({
      title: creator.name,
      description: creator.description,
      link: "#", // We'll handle click differently
      stats: ethers.formatEther(creator.totalTips) + " ETH",
      address: creator.walletAddress
    }));
  };

  // UI Controls Component
  const UIControls = () => (
    <div className="flex items-center justify-between mb-6 bg-black/20 p-4 rounded-lg border border-white/10">
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-400">Theme:</span>
        <select
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          className="bg-black/40 border border-white/10 rounded-lg px-3 py-1 text-sm text-white"
        >
          <option value="dark">Dark</option>
        
          <option value="cyber">Cyber</option>
        </select>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
          className={`p-2 rounded-lg transition-all ${themes[theme].border} ${themes[theme].hover}`}
        >
         
        
        </button>

        <button
          onClick={() => setIsCompact(!isCompact)}
          className={`p-2 rounded-lg transition-all ${themes[theme].border} ${themes[theme].hover}`}
        >
         
        </button>
      </div>
    </div>
  );

  // Add this component near your other component definitions
  const AlreadyRegisteredPopup = memo(({ isVisible }) => (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-24 right-6 z-50"
        >
          <div className="bg-black/90 backdrop-blur-xl p-4 rounded-xl border border-white/10 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-blue-500"
                  viewBox="0 0 784 784"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M392 784C608.5 784 784 608.5 784 392C784 175.5 608.5 0 392 0C175.5 0 0 175.5 0 392C0 608.5 175.5 784 392 784Z"
                    fill="currentColor"
                    fillOpacity="0.1"
                  />
                  <path
                    d="M392 73.5L241.5 295.4L392 397.6L542.5 295.4L392 73.5Z"
                    fill="currentColor"
                  />
                  <path
                    d="M392 397.6V397.6L241.5 295.4L392 517.3L542.5 295.4L392 397.6Z"
                    fill="currentColor"
                    fillOpacity="0.8"
                  />
                  <path
                    d="M392 517.3V710.5L542.5 395.4L392 517.3Z"
                    fill="currentColor"
                    fillOpacity="0.6"
                  />
                  <path
                    d="M392 710.5V517.3L241.5 395.4L392 710.5Z"
                    fill="currentColor"
                    fillOpacity="0.6"
                  />
                </svg>
              </div>
              <div>
                <h4 className="font-medium text-white">Already Registered</h4>
                <p className="text-sm text-gray-400">You already have a creator account</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  ));

  // Update the Leaderboard component
  const Leaderboard = ({ creators, theme }) => {
    const sortedCreators = [...creators].sort((a, b) => 
      Number(b.totalTips) - Number(a.totalTips)
    );

    return (
      <motion.div
        key="leaderboard"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="max-w-6xl mx-auto p-6"
      >
        <div className="bg-black/40 backdrop-blur-xl rounded-xl border border-white/10 overflow-hidden">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
                Top Creators
              </h2>
              
              {/* View toggle button */}
              <button
                onClick={() => setLeaderboardView(prev => prev === 'grid' ? 'list' : 'grid')}
                className="p-2 rounded-lg transition-all bg-white/10 hover:bg-white/20"
                title={leaderboardView === 'grid' ? 'Switch to List View' : 'Switch to Grid View'}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {leaderboardView === 'grid' ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  )}
                </svg>
              </button>
            </div>
            
            <div className={`${
              leaderboardView === 'grid' 
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                : 'space-y-4'
            }`}>
              {sortedCreators.map((creator, index) => (
                <motion.div
                  key={creator.walletAddress}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ 
                    opacity: 1, 
                    x: 0,
                    transition: { delay: index * 0.1 }
                  }}
                  className="relative group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-800/20 to-pink-800/20 rounded-xl blur-xl group-hover:blur-2xl transition-all duration-300" />
                  <div className={`relative ${
                    leaderboardView === 'grid'
                      ? 'flex flex-col p-6'
                      : 'flex items-center p-4'
                  } bg-black/20 rounded-xl border border-white/10`}>
                    {/* Rank Medal */}
                    <div className={`${
                      leaderboardView === 'grid' ? 'mb-4' : 'mr-4'
                    } w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-full ${
                      index === 0 ? 'bg-yellow-500/20 text-yellow-500' :
                      index === 1 ? 'bg-gray-300/20 text-gray-300' :
                      index === 2 ? 'bg-amber-700/20 text-amber-700' :
                      'bg-white/10 text-gray-400'
                    }`}>
                      {index < 3 ? (
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                        </svg>
                      ) : (
                        <span className="text-lg font-bold">{index + 1}</span>
                      )}
                    </div>
                    
                    {/* Creator Info */}
                    <div className={leaderboardView === 'grid' ? '' : 'flex-1'}>
                      <h3 className="text-lg font-semibold text-white">
                        {creator.name}
                      </h3>
                      <p className="text-sm text-gray-400">
                        {creator.walletAddress.slice(0, 6)}...{creator.walletAddress.slice(-4)}
                      </p>
                      {leaderboardView === 'grid' && (
                        <div className="mt-4 pt-4 border-t border-white/10">
                          <p className="text-2xl font-bold text-white">
                            {ethers.formatEther(creator.totalTips)} ETH
                          </p>
                          <p className="text-sm text-gray-400">
                            Total Tips
                          </p>
                        </div>
                      )}
                    </div>
                    
                    {/* Stats - Only shown in list view */}
                    {leaderboardView === 'list' && (
                      <div className="text-right">
                        <p className="text-lg font-bold text-white">
                          {ethers.formatEther(creator.totalTips)} ETH
                        </p>
                        <p className="text-sm text-gray-400">
                          Total Tips
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}

              {creators.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-400">No creators yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className={`min-h-screen ${themes[theme].bg} ${themes[theme].text} transition-colors duration-300`}>
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(24,24,24,0.2),rgba(0,0,0,0.9))]" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent opacity-20" />
      </div>

      {/* Header */}
      <header className={`backdrop-blur-sm ${themes[theme].border} sticky top-0 z-40`}>
        <div className="max-w-6xl mx-auto p-6">
          <div className="flex justify-between items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
                Tip Karo
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
              disabled={isConnecting}
              className="relative group px-6 py-3 rounded-lg overflow-hidden"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 transition-all duration-300 group-hover:opacity-90" />
              <span className="relative text-white font-medium flex items-center gap-2">
                {isConnecting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Connecting...
                  </>
                ) : account ? (
                  `${account.slice(0, 6)}...${account.slice(-4)}`
                ) : (
                  'Connect Wallet'
                )}
              </span>
            </motion.button>
          </div>
          <UIControls />
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="max-w-6xl mx-auto px-6 mt-6">
        <motion.div 
          className="flex space-x-4 border-b border-white/10"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <button
            onClick={() => setActiveTab('main')}
            className={`px-4 py-2 font-medium text-sm transition-colors relative ${
              activeTab === 'main'
                ? 'text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <span>Creators</span>
            {activeTab === 'main' && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500"
                initial={false}
              />
            )}
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 font-medium text-sm transition-colors relative ${
              activeTab === 'history'
                ? 'text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <span>History</span>
            {activeTab === 'history' && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500"
                initial={false}
              />
            )}
          </button>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`px-4 py-2 font-medium text-sm transition-colors relative ${
              activeTab === 'leaderboard'
                ? 'text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <span>Leaderboard</span>
            {activeTab === 'leaderboard' && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500"
                initial={false}
              />
            )}
          </button>
        </motion.div>
      </div>

      {/* Main Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'main' ? (
          <motion.div
            key="main"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
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

              {/* Updated Creators List */}
              <section className="max-w-6xl mx-auto px-6">
                <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600 mb-8">
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
                  <HoverEffect
                    items={getCreatorCards()}
                    render={renderCreatorCard}
                  />
                )}
              </section>
            </main>
          </motion.div>
        ) : activeTab === 'history' ? (
          <motion.div
            key="history"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <History 
              contract={contract} 
              account={account}
              theme={themes[theme]}
              viewMode={viewMode}
              isCompact={isCompact}
            />
          </motion.div>
        ) : (
          <Leaderboard 
            creators={creators}
            theme={themes[theme]}
          />
        )}
      </AnimatePresence>

      {/* Documentation Modal */}
      <DocModal isOpen={showTutorial} onClose={() => setShowTutorial(false)} />

      {/* Footer */}
      <footer className={`${themes[theme].border} mt-20`}>
        <div className="max-w-6xl mx-auto py-12 px-6">
          <div className="text-center space-y-4">
            <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
              Tip Karo
            </h3>
            <p className="text-gray-400">
              Empowering creators through AI-enhanced decentralized support
            </p>
            <div className="flex justify-center gap-4 text-sm text-gray-500">
              <span>Built for DevDock.ai Bounty</span>
              <span>•</span>
              <span>Documentation-First Approach</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Add Extension Promo before closing div */}
      <ExtensionPromo 
        isVisible={showExtensionPromo} 
        onClose={() => setShowExtensionPromo(false)} 
      />

      <AlreadyRegisteredPopup isVisible={showAlreadyRegistered} />
    </div>
  )
}

export default App
