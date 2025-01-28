"use client";
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import CreatorList from '../components/CreatorList';
import ConnectWallet from '../components/ConnectWallet';
import { useAccount } from 'wagmi';

export default function Home() {
  const { address, isConnected } = useAccount();
  const [isCreator, setIsCreator] = useState(false);

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-4xl font-bold mb-8">Social Tipping Platform</h1>
      
      {!isConnected ? (
        <ConnectWallet />
      ) : (
        <div>
          <CreatorList userAddress={address} />
        </div>
      )}
    </main>
  );
}