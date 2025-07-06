'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount, useReadContract } from 'wagmi';
import { formatEther } from 'viem';
import { saigon } from 'viem/chains';
import { CONTRACTS, PLEDGE_TO_CREATE_ABI } from '@/lib/contracts';
import { TantoConnectButton } from '@sky-mavis/tanto-widget';
import Link from 'next/link';
import { useSounds } from '@/hooks/useSounds';
import SoundControl from '@/components/SoundControl';

interface NFTData {
  tokenId: number;
  campaignId: string;
  pledgeAmount: string;
  timestamp: number;
  campaignTitle: string;
  tokenURI?: string;
}

interface LeaderboardEntry {
  address: string;
  totalPledged: string;
  pledgeCount: number;
  recentActivity: number;
  rank: number;
  badges?: string[];
  nfts?: NFTData[];
}

type SortOption = 'totalPledged' | 'pledgeCount' | 'recent';
type FilterOption = 'all' | 'top10' | 'recent' | 'whales';

// Helper function to decode base64 JSON from tokenURI
const decodeTokenURI = (tokenURI: string) => {
  try {
    if (tokenURI.startsWith('data:application/json;base64,')) {
      const base64Data = tokenURI.split(',')[1];
      const jsonString = atob(base64Data);
      return JSON.parse(jsonString);
    }
    return null;
  } catch (error) {
    console.error('Error decoding tokenURI:', error);
    return null;
  }
};

// Helper function to decode base64 SVG from image data
const decodeSVG = (imageData: string) => {
  try {
    if (imageData.startsWith('data:image/svg+xml;base64,')) {
      const base64Data = imageData.split(',')[1];
      return atob(base64Data);
    }
    return null;
  } catch (error) {
    console.error('Error decoding SVG:', error);
    return null;
  }
};

export default function LeaderboardPage() {
  const { address } = useAccount();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('totalPledged');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [selectedUser, setSelectedUser] = useState<LeaderboardEntry | null>(null);
  const [searchAddress, setSearchAddress] = useState('');
  const { playSound, preloadSounds } = useSounds();

  // Get total pledged for current user
  const { data: userTotalPledged } = useReadContract({
    address: CONTRACTS.PLEDGE_TO_CREATE,
    abi: PLEDGE_TO_CREATE_ABI,
    functionName: 'totalPledgedByUser',
    args: address ? [address] : undefined,
    chainId: saigon.id,
  });

  const generateBadges = useCallback((address: string, pledgeCount: number, totalPledged: string): string[] => {
    const badges = [];
    const totalPledgedBigInt = BigInt(totalPledged);
    const oneRON = BigInt('1000000000000000000'); // 1 RON in wei
    
    // Rank-based badges
    const entry = leaderboard.find(e => e.address === address);
    if (entry) {
      if (entry.rank === 1) badges.push('👑');
      else if (entry.rank === 2) badges.push('🥈');
      else if (entry.rank === 3) badges.push('🥉');
      else if (entry.rank <= 10) badges.push('🏆');
    }
    
    // Amount-based badges
    if (totalPledgedBigInt >= oneRON * BigInt(10)) badges.push('🐋'); // Whale (10+ RON)
    else if (totalPledgedBigInt >= oneRON * BigInt(5)) badges.push('🦈'); // Big fish (5+ RON)
    else if (totalPledgedBigInt >= oneRON) badges.push('🐠'); // Fish (1+ RON)
    
    // Activity-based badges
    if (pledgeCount >= 20) badges.push('🔥'); // Very active
    else if (pledgeCount >= 10) badges.push('⭐'); // Active
    else if (pledgeCount >= 5) badges.push('💎'); // Regular
    
    // Address-based badges for variety
    const hash = parseInt(address.slice(-4), 16);
    if (hash % 17 === 0) badges.push('🚀'); // Rocket
    if (hash % 13 === 0) badges.push('✨'); // Sparkles
    
    return badges.length > 0 ? badges : ['💫'];
  }, [leaderboard]);

  // Fetch leaderboard data from API
  useEffect(() => {
    const fetchLeaderboardData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log('Fetching leaderboard data...');
        const response = await fetch('/api/leaderboard');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Leaderboard data received:', data);
        
        // Add badges to each entry
        const entriesWithBadges = data.map((entry: LeaderboardEntry) => ({
          ...entry,
          badges: generateBadges(entry.address, entry.pledgeCount, entry.totalPledged),
        }));
        
        setLeaderboard(entriesWithBadges);
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch leaderboard');
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboardData();
  }, [generateBadges]);

  // Preload sounds on component mount
  useEffect(() => {
    preloadSounds();
  }, [preloadSounds]);

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return 'from-yellow-400 to-orange-500';
      case 2: return 'from-gray-300 to-gray-500';
      case 3: return 'from-amber-600 to-amber-800';
      default: return 'from-purple-500 to-pink-500';
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return '👑';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return '🏅';
    }
  };

  const getFilteredAndSortedLeaderboard = () => {
    let filtered = [...leaderboard];

    // Apply filters
    switch (filterBy) {
      case 'top10':
        filtered = filtered.slice(0, 10);
        break;
      case 'whales':
        filtered = filtered.filter(entry => 
          BigInt(entry.totalPledged) > BigInt('1000000000000000000') // > 1 RON
        );
        break;
      case 'recent':
        // Sort by recent activity and take top 20
        filtered = filtered
          .sort((a, b) => b.recentActivity - a.recentActivity)
          .slice(0, 20);
        break;
    }

    // Apply search
    if (searchAddress) {
      filtered = filtered.filter(entry => 
        entry.address.toLowerCase().includes(searchAddress.toLowerCase())
      );
    }

    // Apply sorting (only if not already sorted by recent activity)
    if (filterBy !== 'recent') {
      switch (sortBy) {
        case 'pledgeCount':
          filtered.sort((a, b) => b.pledgeCount - a.pledgeCount);
          break;
        case 'recent':
          filtered.sort((a, b) => b.recentActivity - a.recentActivity);
          break;
        default:
          filtered.sort((a, b) => {
            const aTotal = BigInt(a.totalPledged);
            const bTotal = BigInt(b.totalPledged);
            return bTotal > aTotal ? 1 : bTotal < aTotal ? -1 : 0;
          });
      }
    }

    return filtered;
  };

  const filteredLeaderboard = getFilteredAndSortedLeaderboard();

  const handleUserClick = (entry: LeaderboardEntry) => {
    setSelectedUser(entry);
    playSound('coin'); // Play sound when opening user profile
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-blue-900">
      {/* Navbar */}
      <nav className="bg-black/50 backdrop-blur-sm border-b border-purple-500/30 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-2xl">🚀</span>
              <span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                Helpify
              </span>
            </Link>
            
            <div className="flex items-center space-x-6">
              <Link href="/" className="text-white/70 hover:text-white transition-colors">
                Home
              </Link>
              <Link href="/campaigns" className="text-white/70 hover:text-white transition-colors">
                Campaigns
              </Link>
              <Link href="/create" className="text-white/70 hover:text-white transition-colors">
                Create
              </Link>
              <span className="text-purple-400 font-semibold">
                Leaderboard
              </span>
              <SoundControl />
              <TantoConnectButton />
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block"
          >
            <div className="text-8xl mb-4">🏆</div>
            <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-4">
              Leaderboard
            </h1>
            <p className="text-xl text-white/70 max-w-2xl mx-auto">
              Hall of Fame - Top supporters and their soulbound NFT achievements
            </p>
          </motion.div>
        </div>

        {/* User Stats */}
        {address && userTotalPledged && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 backdrop-blur-sm rounded-2xl border border-purple-500/30 p-6 mb-8"
          >
            <div className="text-center">
              <h3 className="text-xl font-semibold text-white mb-2">Your Stats</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-black/30 rounded-xl p-4">
                  <div className="text-2xl font-bold text-purple-400">
                    {formatEther(userTotalPledged)} RON
                  </div>
                  <div className="text-white/60">Total Pledged</div>
                </div>
                <div className="bg-black/30 rounded-xl p-4">
                  <div className="text-2xl font-bold text-pink-400">
                    #{leaderboard.find(entry => entry.address.toLowerCase() === address.toLowerCase())?.rank || 'N/A'}
                  </div>
                  <div className="text-white/60">Your Rank</div>
                </div>
                <div className="bg-black/30 rounded-xl p-4">
                  <div className="text-2xl font-bold text-blue-400">
                    {leaderboard.find(entry => entry.address.toLowerCase() === address.toLowerCase())?.pledgeCount || 0}
                  </div>
                  <div className="text-white/60">Pledges Made</div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Controls */}
        <div className="flex flex-col lg:flex-row gap-4 mb-8">
          {/* Search */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by address..."
              value={searchAddress}
              onChange={(e) => setSearchAddress(e.target.value)}
              className="w-full px-4 py-3 bg-black/50 border border-purple-500/30 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value as FilterOption)}
              className="px-4 py-3 bg-black/50 border border-purple-500/30 rounded-xl text-white focus:outline-none focus:border-purple-500"
            >
              <option value="all">All Users</option>
              <option value="top10">Top 10</option>
              <option value="whales">Whales (1+ RON)</option>
              <option value="recent">Recent Activity</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-4 py-3 bg-black/50 border border-purple-500/30 rounded-xl text-white focus:outline-none focus:border-purple-500"
            >
              <option value="totalPledged">Total Pledged</option>
              <option value="pledgeCount">Pledge Count</option>
              <option value="recent">Recent Activity</option>
            </select>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/20 border border-red-500/30 rounded-2xl p-6 mb-8"
          >
            <div className="text-center">
              <div className="text-red-400 text-xl font-semibold mb-2">
                ❌ Error Loading Leaderboard
              </div>
              <div className="text-white/70 text-sm">
                {error}
              </div>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-6 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white font-semibold transition-colors"
              >
                Retry
              </button>
            </div>
          </motion.div>
        )}

        {/* Leaderboard */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p className="text-white/60">Loading leaderboard...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredLeaderboard.map((entry, index) => (
              <motion.div
                key={entry.address}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`bg-gradient-to-r ${getRankColor(entry.rank)} p-[1px] rounded-2xl cursor-pointer`}
                onClick={() => handleUserClick(entry)}
              >
                <div className="bg-black/80 backdrop-blur-sm rounded-2xl p-6 hover:bg-black/70 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-4xl">
                        {getRankIcon(entry.rank)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-2xl font-bold text-white">
                            #{entry.rank}
                          </span>
                          <div className="flex gap-1">
                            {entry.badges?.map((badge, i) => (
                              <motion.span
                                key={i}
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ duration: 2, delay: i * 0.3, repeat: Infinity }}
                                className="text-lg"
                              >
                                {badge}
                              </motion.span>
                            ))}
                          </div>
                        </div>
                        <div className="text-white/60 font-mono text-sm">
                          {entry.address.slice(0, 6)}...{entry.address.slice(-4)}
                        </div>
                        {entry.address.toLowerCase() === address?.toLowerCase() && (
                          <div className="text-purple-400 text-sm font-semibold">
                            You
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-2xl font-bold text-white mb-1">
                        {formatEther(BigInt(entry.totalPledged))} RON
                      </div>
                      <div className="text-white/60 text-sm">
                        {entry.pledgeCount} pledge{entry.pledgeCount !== 1 ? 's' : ''}
                      </div>
                      {entry.nfts && entry.nfts.length > 0 && (
                        <div className="text-purple-400 text-sm mt-1">
                          {entry.nfts.length} NFT{entry.nfts.length !== 1 ? 's' : ''} • Click to view
                        </div>
                      )}
                      {entry.recentActivity > 0 && (
                        <div className="text-white/40 text-xs mt-1">
                          Last: {new Date(entry.recentActivity * 1000).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {filteredLeaderboard.length === 0 && !loading && !error && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-white/60 text-lg">No users found matching your criteria</p>
            <p className="text-white/40 text-sm mt-2">Try adjusting your search or filters</p>
          </div>
        )}
      </div>

      {/* User Detail Modal */}
      <AnimatePresence>
        {selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedUser(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gradient-to-br from-black/90 to-purple-900/50 backdrop-blur-sm rounded-3xl border border-purple-500/30 p-8 max-w-6xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-6">
                <div className="text-6xl mb-4">
                  {getRankIcon(selectedUser.rank)}
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">
                  Rank #{selectedUser.rank}
                </h2>
                <p className="text-white/60 font-mono">
                  {selectedUser.address}
                </p>
                <div className="flex justify-center gap-2 mt-2">
                  {selectedUser.badges?.map((badge, i) => (
                    <span key={i} className="text-2xl">
                      {badge}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-black/50 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-purple-400">
                    {formatEther(BigInt(selectedUser.totalPledged))} RON
                  </div>
                  <div className="text-white/60">Total Pledged</div>
                </div>
                <div className="bg-black/50 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-pink-400">
                    {selectedUser.pledgeCount}
                  </div>
                  <div className="text-white/60">Pledges Made</div>
                </div>
              </div>

              {selectedUser.recentActivity > 0 && (
                <div className="bg-black/50 rounded-xl p-4 mb-6 text-center">
                  <div className="text-lg font-semibold text-blue-400">
                    {new Date(selectedUser.recentActivity * 1000).toLocaleString()}
                  </div>
                  <div className="text-white/60">Last Activity</div>
                </div>
              )}

              {/* NFT Gallery */}
              {selectedUser.nfts && selectedUser.nfts.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-2xl font-semibold text-white mb-6 flex items-center gap-3">
                    <span className="text-3xl">🎨</span>
                    Soulbound NFT Collection ({selectedUser.nfts.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {selectedUser.nfts.map((nft) => {
                      const metadata = nft.tokenURI ? decodeTokenURI(nft.tokenURI) : null;
                      const svgData = metadata?.image ? decodeSVG(metadata.image) : null;
                      
                      return (
                        <motion.div
                          key={nft.tokenId}
                          className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-sm rounded-2xl border border-purple-500/30 hover:border-purple-500/50 transition-all duration-300 overflow-hidden"
                          whileHover={{ scale: 1.02, y: -5 }}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          {/* NFT Image */}
                          <div className="aspect-square bg-gradient-to-br from-purple-600/20 to-pink-600/20 flex items-center justify-center relative overflow-hidden">
                            {svgData ? (
                              <div 
                                className="w-full h-full flex items-center justify-center p-2"
                                dangerouslySetInnerHTML={{ __html: svgData }}
                                style={{
                                  maxWidth: '100%',
                                  maxHeight: '100%'
                                }}
                              />
                            ) : (
                              <div className="text-6xl opacity-50">🎨</div>
                            )}
                            {/* Token ID Badge */}
                            <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm rounded-lg px-2 py-1">
                              <span className="text-white text-xs font-bold">#{nft.tokenId}</span>
                            </div>
                          </div>
                          
                          {/* NFT Details */}
                          <div className="p-4">
                            <div className="text-center mb-3">
                              <h4 className="text-white font-bold text-lg mb-1">
                                Pledge NFT #{nft.tokenId}
                              </h4>
                              <div className="text-purple-400 font-semibold text-lg">
                                {formatEther(BigInt(nft.pledgeAmount))} RON
                              </div>
                            </div>
                            
                            <div className="space-y-2 text-sm">
                              <div className="bg-black/30 rounded-lg p-2">
                                <div className="text-white/60 text-xs">Campaign</div>
                                <div className="text-white font-medium truncate" title={nft.campaignTitle}>
                                  {nft.campaignTitle}
                                </div>
                              </div>
                              
                              <div className="bg-black/30 rounded-lg p-2">
                                <div className="text-white/60 text-xs">Date</div>
                                <div className="text-white font-medium">
                                  {new Date(nft.timestamp * 1000).toLocaleDateString()}
                                </div>
                              </div>
                              
                              <div className="bg-black/30 rounded-lg p-2">
                                <div className="text-white/60 text-xs">Campaign ID</div>
                                <div className="text-white font-medium">
                                  #{nft.campaignId}
                                </div>
                              </div>
                            </div>
                            
                            {/* NFT Metadata */}
                            {metadata && (
                              <div className="mt-3 pt-3 border-t border-white/10">
                                <div className="text-white/60 text-xs mb-1">Metadata</div>
                                <div className="text-white text-xs">
                                  {metadata.name && (
                                    <div><strong>Name:</strong> {metadata.name}</div>
                                  )}
                                  {metadata.description && (
                                    <div className="mt-1"><strong>Description:</strong> {metadata.description}</div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* No NFTs Message */}
              {(!selectedUser.nfts || selectedUser.nfts.length === 0) && (
                <div className="text-center py-8 mb-6">
                  <div className="text-6xl mb-4 opacity-50">🎨</div>
                  <p className="text-white/60 text-lg">No NFTs found</p>
                  <p className="text-white/40 text-sm mt-2">This user hasn&apos;t made any pledges yet</p>
                </div>
              )}

              <motion.button
                onClick={() => setSelectedUser(null)}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-semibold text-white"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Close
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 