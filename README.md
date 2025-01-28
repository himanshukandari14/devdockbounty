# Social Tipping Platform

<div align="center">
  <img src="frontend/src/assets/tipkaro.png" alt="Social Tipping Logo" width="200"/>
  <p>A decentralized platform that empowers content creators through direct cryptocurrency tips.</p>
</div>

## ✨ Key Features

- 👤 **Creator Registration**: Easy onboarding for content creators
- 💰 **ETH Tipping**: Send direct cryptocurrency tips
- 📊 **Real-time Updates**: Instant transaction confirmations
- 📈 **Creator Analytics**: Track earnings and supporter engagement
- 📝 **History Tracking**: Keep a record of all past transactions
- 🏆 **Leaderboard System**: Showcase top creators and supporters
- 📱 **Responsive Design**: Seamless experience across all devices
- 📊 **Tip Tracking**: Visualize tips with graphs and statistics, filtered by tags and other parameters


## 🛠 Technical Stack

- **Smart Contracts**: Solidity ^0.8.0
- **Development**: Hardhat
- **Frontend**: React + Vite
- **Blockchain**: ethers.js
- **Security**: OpenZeppelin
- **Styling**: TailwindCSS + Framer Motion

## 🚀 Getting Started

### Prerequisites

- Node.js (v14+ recommended)
- npm or yarn
- MetaMask wallet

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/himanshukandari14/devdockbounty.git
   ```

2. Install Dependencies:
   ```bash
   npm install
   ```

3. Configure Development Environment:
   ```bash
   # Hardhat network configuration is preset to:
   # URL: http://127.0.0.1:8545
   # Chain ID: 31337
   ```

4. Start the development environment:

   Terminal 1 - Start Hardhat node:
   ```bash
   npx hardhat node
   ```

   Terminal 2 - Deploy to local network:
   ```bash
    npx hardhat run scripts/deploy-social-tipping.js --network localhost
   ```

   Terminal 3 - Launch Vite dev server:
   ```bash
   cd frontend
   npm run dev
   ```

5. Testing:
   ```bash
   # Run all tests
   npx hardhat test

   # Run with Solidity coverage
   npx hardhat coverage

   # Run with gas reporting
   REPORT_GAS=true npx hardhat test
   ```
