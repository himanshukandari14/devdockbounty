import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { ethers } from "ethers";

export default function History({ contract }) {
  const [tips, setTips] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalTips, setTotalTips] = useState("0");
  const [stats, setStats] = useState({
    totalTransactions: 0,
    averageTip: "0",
    highestTip: "0"
  });

  useEffect(() => {
    const loadTipHistory = async () => {
      if (!contract) return;
      
      try {
        setIsLoading(true);
        const allTips = await contract.getAllTips();
        
        // Process tips
        const processedTips = allTips.map(tip => ({
          from: tip.from,
          to: tip.to,
          amount: ethers.formatEther(tip.amount),
          timestamp: Number(tip.timestamp) * 1000 // Convert to milliseconds
        }));

        // Calculate statistics
        const total = processedTips.reduce((acc, tip) => acc + parseFloat(tip.amount), 0);
        const highest = Math.max(...processedTips.map(tip => parseFloat(tip.amount)));
        const average = total / (processedTips.length || 1);

        setStats({
          totalTransactions: processedTips.length,
          averageTip: average.toFixed(4),
          highestTip: highest.toString()
        });

        setTotalTips(total.toFixed(4));
        setTips(processedTips.sort((a, b) => b.timestamp - a.timestamp));
      } catch (error) {
        console.error("Error loading tip history:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTipHistory();
  }, [contract]);

  const formatAddress = (address) => `${address.slice(0, 6)}...${address.slice(-4)}`;
  
  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const StatsCard = ({ title, value, icon }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-black/40 backdrop-blur-xl rounded-xl p-6 border border-white/10"
    >
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-full bg-purple-500/20">
          {icon}
        </div>
        <div>
          <p className="text-sm text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <motion.h2 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600"
      >
        Transaction History
      </motion.h2>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard
          title="Total Tips"
          value={`${totalTips} ETH`}
          icon={
            <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatsCard
          title="Total Transactions"
          value={stats.totalTransactions}
          icon={
            <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
        />
        <StatsCard
          title="Highest Tip"
          value={`${stats.highestTip} ETH`}
          icon={
            <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          }
        />
      </div>

      {/* Transactions List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-t-2 border-purple-500 animate-spin" />
            <div className="absolute inset-2 rounded-full border-t-2 border-pink-500 animate-spin-slow" />
          </div>
        </div>
      ) : tips.length === 0 ? (
        <div className="text-center py-20 bg-black/40 backdrop-blur-xl rounded-xl border border-white/10">
          <p className="text-gray-400">No tips have been sent yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {tips.map((tip, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-800/20 to-pink-800/20 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-all duration-300" />
              <div className="relative bg-black/40 backdrop-blur-xl rounded-xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-400">From</span>
                      <span className="text-sm font-mono bg-white/10 px-2 py-1 rounded">
                        {formatAddress(tip.from)}
                      </span>
                      <span className="text-sm text-gray-400">to</span>
                      <span className="text-sm font-mono bg-white/10 px-2 py-1 rounded">
                        {formatAddress(tip.to)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-400">Amount:</span>
                      <span className="text-sm font-medium bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
                        {tip.amount} ETH
                      </span>
                    </div>
                  </div>
                  <span className="text-sm text-gray-400">
                    {formatTimestamp(tip.timestamp)}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
} 