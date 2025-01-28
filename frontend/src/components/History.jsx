import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export default function History({ contract, account }) {
  const [tips, setTips] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalTips, setTotalTips] = useState("0");
  const [stats, setStats] = useState({
    totalTransactions: 0,
    averageTip: "0",
    highestTip: "0"
  });
  const [chartData, setChartData] = useState([]);
  const [timeFrame, setTimeFrame] = useState('weekly'); // 'daily', 'weekly', 'monthly'

  // Predefined tags
  const [tags] = useState(['Music', 'YouTube', 'Development']);
  const [selectedTag, setSelectedTag] = useState('all');
  const [tagStats, setTagStats] = useState({});

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

    if (contract) {
      loadTipHistory();
    }
  }, [contract]);

  useEffect(() => {
    const processChartData = () => {
      if (!tips.length) return;

      const now = new Date();
      const timeFrames = {
        daily: {
          days: 7,
          format: (date) => date.toLocaleDateString(undefined, { weekday: 'short' })
        },
        weekly: {
          days: 28,
          format: (date) => `Week ${Math.ceil(date.getDate() / 7)}`
        },
        monthly: {
          days: 90,
          format: (date) => date.toLocaleDateString(undefined, { month: 'short' })
        }
      };

      const { days, format } = timeFrames[timeFrame];
      const startDate = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
      
      // Group tips by date
      const groupedTips = tips.reduce((acc, tip) => {
        const date = new Date(tip.timestamp);
        if (date >= startDate) {
          const key = format(date);
          if (!acc[key]) {
            acc[key] = {
              date: key,
              totalAmount: 0,
              count: 0
            };
          }
          acc[key].totalAmount += parseFloat(tip.amount);
          acc[key].count += 1;
        }
        return acc;
      }, {});

      // Convert to array and sort
      const data = Object.values(groupedTips).sort((a, b) => 
        new Date(a.date) - new Date(b.date)
      );

      setChartData(data);
    };

    processChartData();
  }, [tips, timeFrame]);

  // Process tips and extract tags from descriptions
  useEffect(() => {
    if (!tips.length) return;

    const processedStats = {};
    tags.forEach(tag => {
      processedStats[tag] = {
        totalAmount: 0,
        count: 0,
        transactions: []
      };
    });

    tips.forEach(tip => {
      // Convert description to lowercase for case-insensitive matching
      const description = tip.description?.toLowerCase() || '';
      
      // Check which tags are mentioned in the description
      tags.forEach(tag => {
        if (description.includes(tag.toLowerCase())) {
          processedStats[tag].totalAmount += parseFloat(tip.amount);
          processedStats[tag].count += 1;
          processedStats[tag].transactions.push(tip);
        }
      });
    });

    setTagStats(processedStats);
  }, [tips, tags]);

  // Filter tips based on selected tag
  const filteredTips = selectedTag === 'all' 
    ? tips 
    : tagStats[selectedTag]?.transactions || [];

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

  const ChartSection = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-black/40 backdrop-blur-xl rounded-xl p-6 border border-white/10"
    >
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-white">Transaction Analysis</h3>
        <div className="flex gap-2">
          {['daily', 'weekly', 'monthly'].map((frame) => (
            <button
              key={frame}
              onClick={() => setTimeFrame(frame)}
              className={`px-3 py-1 rounded-lg text-sm transition-all ${
                timeFrame === frame
                  ? 'bg-purple-600 text-white'
                  : 'bg-black/40 text-gray-400 hover:bg-black/60'
              }`}
            >
              {frame.charAt(0).toUpperCase() + frame.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <Line 
              type="monotone" 
              dataKey="totalAmount" 
              stroke="#8b5cf6" 
              strokeWidth={2}
              dot={{ fill: '#8b5cf6', strokeWidth: 2 }}
            />
            <XAxis 
              dataKey="date" 
              stroke="#6b7280"
              tick={{ fill: '#6b7280' }}
            />
            <YAxis 
              stroke="#6b7280"
              tick={{ fill: '#6b7280' }}
              label={{ 
                value: 'Amount (ETH)', 
                angle: -90, 
                position: 'insideLeft',
                fill: '#6b7280'
              }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: '#fff'
              }}
              labelStyle={{ color: '#8b5cf6' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-3 gap-4 mt-6">
        <div className="bg-black/20 p-4 rounded-lg">
          <p className="text-sm text-gray-400">Total Volume</p>
          <p className="text-xl font-bold text-white">
            {chartData.reduce((sum, item) => sum + item.totalAmount, 0).toFixed(4)} ETH
          </p>
        </div>
        <div className="bg-black/20 p-4 rounded-lg">
          <p className="text-sm text-gray-400">Average Amount</p>
          <p className="text-xl font-bold text-white">
            {(chartData.reduce((sum, item) => sum + item.totalAmount, 0) / 
              chartData.reduce((sum, item) => sum + item.count, 0) || 0).toFixed(4)} ETH
          </p>
        </div>
        <div className="bg-black/20 p-4 rounded-lg">
          <p className="text-sm text-gray-400">Total Transactions</p>
          <p className="text-xl font-bold text-white">
            {chartData.reduce((sum, item) => sum + item.count, 0)}
          </p>
        </div>
      </div>
    </motion.div>
  );

  // Tag Statistics Component
  const TagStatistics = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {tags.map(tag => {
        const stats = tagStats[tag] || { totalAmount: 0, count: 0 };
        return (
          <motion.div
            key={tag}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-black/40 backdrop-blur-xl rounded-xl p-4 border border-white/10"
          >
            <h3 className="text-lg font-bold text-white mb-2">{tag}</h3>
            <div className="space-y-1">
              <p className="text-sm text-gray-400">
                Total: {stats.totalAmount.toFixed(4)} ETH
              </p>
              <p className="text-sm text-gray-400">
                Transactions: {stats.count}
              </p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );

  // Tag Filter Component
  const TagFilter = () => (
    <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
      <button
        onClick={() => setSelectedTag('all')}
        className={`px-3 py-1 rounded-lg text-sm whitespace-nowrap transition-all ${
          selectedTag === 'all'
            ? 'bg-purple-600 text-white'
            : 'bg-black/40 text-gray-400 hover:bg-black/60'
        }`}
      >
        All Transactions
      </button>
      {tags.map(tag => (
        <button
          key={tag}
          onClick={() => setSelectedTag(tag)}
          className={`px-3 py-1 rounded-lg text-sm whitespace-nowrap transition-all ${
            selectedTag === tag
              ? 'bg-purple-600 text-white'
              : 'bg-black/40 text-gray-400 hover:bg-black/60'
          }`}
        >
          {tag} ({tagStats[tag]?.count || 0})
        </button>
      ))}
    </div>
  );

  // Function to generate random NFT-style avatar
  const getRandomAvatar = (address) => {
    const styles = [
      'pixel-art',
      'adventurer',
      'avataaars',
      'big-ears',
      'croodles',
      'shapes'
    ];
    
    const randomStyle = styles[Math.floor(Math.random() * styles.length)];
    return `https://api.dicebear.com/7.x/${randomStyle}/svg?seed=${address}&backgroundColor=transparent`;
  };

  // Function to generate random gradient background
  const getRandomGradient = () => {
    const colors = [
      ['#ff6b6b', '#4ecdc4'],
      ['#a8e6cf', '#dcedc1'],
      ['#ffd3b6', '#ffaaa5'],
      ['#ff9a9e', '#fad0c4'],
      ['#a18cd1', '#fbc2eb'],
      ['#84fab0', '#8fd3f4']
    ];
    const randomPair = colors[Math.floor(Math.random() * colors.length)];
    return `linear-gradient(135deg, ${randomPair[0]}, ${randomPair[1]})`;
  };

  // NFT Card Component
  const NFTAvatar = ({ address }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
      <motion.div
        className="relative group"
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        whileHover={{ scale: 1.05 }}
      >
        <div 
          className="w-12 h-12 rounded-full overflow-hidden relative"
          style={{ background: getRandomGradient() }}
        >
          <img
            src={getRandomAvatar(address)}
            alt="Creator Avatar"
            className="w-full h-full object-cover"
          />
          
          {/* Glow Effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>

        {/* Hover Card */}
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute z-10 bottom-full left-1/2 transform -translate-x-1/2 mb-2"
          >
            <div className="bg-black/90 backdrop-blur-xl rounded-lg p-3 shadow-xl border border-white/10">
              <div className="text-xs text-center">
                <p className="text-purple-400 font-bold">Creator</p>
                <p className="text-gray-400 font-mono">
                  {`${address.slice(0, 6)}...${address.slice(-4)}`}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    );
  };

  if (!contract) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-20 bg-black/40 backdrop-blur-xl rounded-xl border border-white/10"
        >
          <p className="text-gray-400 text-lg mb-4">Please connect your wallet to view transaction history</p>
          <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse mx-auto"></div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <motion.h2 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600"
      >
        Transaction History
      </motion.h2>

      {/* Tag Statistics */}
      <TagStatistics />

      {/* Tag Filter */}
      <TagFilter />

      {/* Add Chart Section */}
      <ChartSection />

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

      {/* Transaction List */}
      {filteredTips.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20 bg-black/40 backdrop-blur-xl rounded-xl border border-white/10"
        >
          <p className="text-gray-400 text-lg">
            No transactions found for {selectedTag === 'all' ? 'any tag' : `tag "${selectedTag}"`}
          </p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {filteredTips.map((tip, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative group"
            >
              <div className="relative bg-black/40 backdrop-blur-xl rounded-xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300">
                <div className="flex items-center gap-4">
                  {/* Add NFT Avatar */}
                  <NFTAvatar address={tip.to} />
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm text-gray-400">From</span>
                          <span className="text-sm font-mono bg-red-500/10 text-red-500 px-2 py-1 rounded border border-red-500/20">
                            {tip.from.slice(0, 6)}...{tip.from.slice(-4)}
                          </span>
                          <span className="text-sm text-gray-400">to</span>
                          <span className="text-sm font-mono bg-green-500/10 text-green-500 px-2 py-1 rounded border border-green-500/20">
                            {tip.to.slice(0, 6)}...{tip.to.slice(-4)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-400">Amount:</span>
                          <span className="text-sm font-medium text-white">
                            {tip.amount} ETH
                          </span>
                          <span className="text-sm text-gray-400">
                            {new Date(tip.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {tip.tags?.map(tag => (
                          <span
                            key={tag}
                            className="px-2 py-1 rounded-full text-xs bg-purple-600/20 text-purple-400 border border-purple-500/20"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    {tip.description && (
                      <p className="mt-2 text-sm text-gray-400">
                        {tip.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
} 