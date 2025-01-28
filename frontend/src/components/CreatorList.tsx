import { useState, useEffect } from 'react';
import { useContractRead, useContractWrite } from 'wagmi';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../utils/constants';

interface CreatorListProps {
  userAddress?: string;
}

export default function CreatorList({ userAddress }: CreatorListProps) {
  const [creators, setCreators] = useState<string[]>([]); } = useContractRead({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getAllCreators',
  });

  const { write: sendTip } = useContractWrite({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'tipCreator',
  });

  useEffect(() => {
    if (creatorsList) {
      setCreators(creatorsList as string[]);
    }
  }, [creatorsList]);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Content Creators</h2>
      <div className="grid gap-4">
        {creators.map((creator) => (
          <div key={creator} className="p-4 border rounded-lg">
            <p>Creator: {creator}</p>
            <button
              onClick={() => sendTip({ args: [creator, ethers.parseEther('0.01')] })}
              className="bg-blue-500 text-white px-4 py-2 rounded"
            >
              Tip 0.01 ETH
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}