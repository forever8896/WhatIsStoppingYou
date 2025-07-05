'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useReadContract } from 'wagmi';
import { formatEther } from 'viem';
import { saigon } from 'viem/chains';
import { CONTRACTS, PLEDGE_TO_CREATE_ABI } from '@/lib/contracts';

interface LeaderboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Leaderboard({ isOpen, onClose }: LeaderboardProps) {
  // In a real implementation, you'd fetch leaderboard data from the contract
  // For now, we'll use mock data to show the concept
  const mockLeaderboard = [
    { address: '0x1234...5678', totalPledged: '5.2', rank: 1, badges: ['🏆', '🔥'] },
    { address: '0x2345...6789', totalPledged: '4.8', rank: 2, badges: ['🥈', '💎'] },
    { address: '0x3456...7890', totalPledged: '3.9', rank: 3, badges: ['🥉', '⭐'] },
    { address: '0x4567...8901', totalPledged: '2.7', rank: 4, badges: ['🚀'] },
    { address: '0x5678...9012', totalPledged: '1.8', rank: 5, badges: ['💫'] },
  ];

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

  return (
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
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-gradient-to-br from-black/90 to-purple-900/50 backdrop-blur-sm rounded-3xl border border-purple-500/30 p-8 max-w-md w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-6">
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-6xl mb-4"
              >
                🏆
              </motion.div>
              <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-2">
                Top Pledgers
              </h2>
              <p className="text-white/60 text-sm">
                Hall of Fame - Most Generous Supporters
              </p>
            </div>

            <div className="space-y-4">
              {mockLeaderboard.map((player, index) => (
                <motion.div
                  key={player.address}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`bg-gradient-to-r ${getRankColor(player.rank)} p-[1px] rounded-2xl`}
                >
                  <div className="bg-black/80 backdrop-blur-sm rounded-2xl p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">
                          {getRankIcon(player.rank)}
                        </div>
                        <div>
                          <div className="font-bold text-white">
                            #{player.rank}
                          </div>
                          <div className="text-sm text-white/60">
                            {player.address}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="font-bold text-lg text-white">
                          {player.totalPledged} RON
                        </div>
                        <div className="flex gap-1 justify-end">
                          {player.badges.map((badge, i) => (
                            <motion.span
                              key={i}
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ duration: 1, delay: i * 0.2, repeat: Infinity }}
                              className="text-sm"
                            >
                              {badge}
                            </motion.span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.button
              onClick={onClose}
              className="w-full mt-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-semibold text-white"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Close Leaderboard
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 