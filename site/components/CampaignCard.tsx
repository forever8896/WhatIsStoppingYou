'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { saigon } from 'viem/chains';
import { CONTRACTS, PLEDGE_TO_CREATE_ABI } from '@/lib/contracts';
import { TantoConnectButton } from '@sky-mavis/tanto-widget';

interface SerializedCampaign {
  creator: string;
  title: string;
  description: string;
  imageUrl: string;
  goal: string;
  pledged: string;
  createdAt: string;
  withdrawn: boolean;
  active: boolean;
  nextRaffleMilestone: string;
  rafflePrize: string;
}

interface CampaignWithId extends SerializedCampaign {
  id: number;
}

interface CampaignCardProps {
  campaign: CampaignWithId;
  onPledgeSuccess?: () => void;
}

export default function CampaignCard({ campaign, onPledgeSuccess }: CampaignCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [pledgeAmount, setPledgeAmount] = useState('');
  const { isConnected, address } = useAccount();

  const { data: pledgeHash, writeContract, isPending: isPledging } = useWriteContract();
  const { isLoading: isConfirmingPledge, isSuccess: isPledgeConfirmed } = useWaitForTransactionReceipt({
    hash: pledgeHash,
  });

  const handlePledge = async () => {
    if (!isConnected || !pledgeAmount) return;
    
    const amount = parseEther(pledgeAmount);
    
    writeContract({
      address: CONTRACTS.PLEDGE_TO_CREATE,
      abi: PLEDGE_TO_CREATE_ABI,
      functionName: 'pledgeToCampaign',
      args: [BigInt(campaign.id)],
      value: amount,
      chainId: saigon.id,
    });
  };

  // Handle successful pledge
  useEffect(() => {
    if (isPledgeConfirmed) {
      setPledgeAmount('');
      onPledgeSuccess?.();
    }
  }, [isPledgeConfirmed, onPledgeSuccess]);

  const getProgressPercentage = () => {
    const pledgedNum = Number(campaign.pledged || '0');
    const goalNum = Number(campaign.goal || '0');
    if (goalNum === 0) return 0;
    return Math.min((pledgedNum / goalNum) * 100, 100);
  };

  const getRaffleProgress = () => {
    const progress = getProgressPercentage();
    const nextMilestone = Number(campaign.nextRaffleMilestone);
    const prevMilestone = nextMilestone - 10;
    
    if (progress >= nextMilestone) return 100;
    if (progress <= prevMilestone) return 0;
    
    return ((progress - prevMilestone) / 10) * 100;
  };

  const safeFormatEther = (value: string) => {
    try {
      return formatEther(BigInt(value || '0'));
    } catch {
      return '0';
    }
  };

  const formatDate = (timestamp: string) => {
    return new Date(Number(timestamp) * 1000).toLocaleDateString();
  };

  return (
    <motion.div
      className="bg-black/60 backdrop-blur-sm rounded-3xl border border-purple-500/20 overflow-hidden group"
      whileHover={{ scale: 1.02, y: -5 }}
      layout
    >
      <div className="p-6">
        {/* Campaign Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white truncate group-hover:text-purple-300 transition-colors">
            {campaign.title}
          </h3>
          <div className="flex items-center gap-2">
            {campaign.active && (
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            )}
            <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
              campaign.active 
                ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                : 'bg-red-500/20 text-red-400 border border-red-500/30'
            }`}>
              {campaign.active ? 'LIVE' : 'ENDED'}
            </span>
          </div>
        </div>

        {/* Progress Section */}
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-3">
            <span className="text-purple-300">💰 {safeFormatEther(campaign.pledged)} RON</span>
            <span className="text-white/70">Goal: {safeFormatEther(campaign.goal)} RON</span>
          </div>
          <div className="relative w-full bg-white/10 rounded-full h-3 overflow-hidden">
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${getProgressPercentage()}%` }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
          </div>
          <div className="text-xs text-white/60 mt-1 text-center">
            {getProgressPercentage().toFixed(1)}% funded
          </div>
        </div>

        {/* Raffle Section */}
        <div className="mb-6 p-4 bg-gradient-to-br from-purple-900/30 to-pink-900/30 rounded-xl border border-purple-500/30">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-purple-300">
              🎰 Next Raffle at {campaign.nextRaffleMilestone}%
            </span>
            <span className="text-xs text-pink-400 font-semibold">
              💎 {safeFormatEther(campaign.rafflePrize)} RON
            </span>
          </div>
          <div className="relative w-full bg-purple-900/50 rounded-full h-2 overflow-hidden">
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${getRaffleProgress()}%` }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
          </div>
          <div className="text-xs text-purple-300 mt-1 text-center">
            {getRaffleProgress().toFixed(1)}% to next raffle
          </div>
        </div>

        {/* Expand/Collapse Button */}
        <motion.button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full mb-4 py-2 px-4 bg-white/10 hover:bg-white/20 rounded-xl text-white/80 text-sm font-medium transition-all duration-300 flex items-center justify-center gap-2"
          whileHover={{ scale: 1.02 }}
        >
          {isExpanded ? '🔼 Less Details' : '🔽 More Details'}
        </motion.button>

        {/* Expandable Details */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-6 space-y-4"
            >
              <div className="p-4 bg-white/5 rounded-xl">
                <h4 className="text-sm font-semibold text-purple-300 mb-2">📝 Description</h4>
                <p className="text-white/80 text-sm leading-relaxed">
                  {campaign.description || 'No description provided'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-white/5 rounded-xl">
                  <div className="text-xs text-white/60 mb-1">👤 Creator</div>
                  <div className="text-sm text-white font-mono">
                    {campaign.creator.slice(0, 6)}...{campaign.creator.slice(-4)}
                  </div>
                </div>

                <div className="p-3 bg-white/5 rounded-xl">
                  <div className="text-xs text-white/60 mb-1">📅 Created</div>
                  <div className="text-sm text-white">
                    {formatDate(campaign.createdAt)}
                  </div>
                </div>
              </div>

              {campaign.imageUrl && (
                <div className="p-4 bg-white/5 rounded-xl">
                  <h4 className="text-sm font-semibold text-purple-300 mb-2">🖼️ Campaign Image</h4>
                  <img 
                    src={campaign.imageUrl} 
                    alt={campaign.title}
                    className="w-full h-48 object-cover rounded-lg"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pledge Section */}
        {campaign.active && (
          <motion.div
            className="space-y-4"
            initial={{ opacity: 0.7 }}
            whileHover={{ opacity: 1 }}
          >
            <div className="flex gap-3">
              <input
                type="number"
                value={pledgeAmount}
                onChange={(e) => setPledgeAmount(e.target.value)}
                placeholder="Enter RON amount"
                className="flex-1 px-4 py-3 bg-white/10 border border-purple-500/30 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-purple-400 focus:bg-white/20 transition-all"
              />
              <motion.button
                onClick={handlePledge}
                disabled={!isConnected || !pledgeAmount || isPledging || isConfirmingPledge}
                className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed hover:from-purple-700 hover:to-pink-700 transition-all duration-300"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isPledging || isConfirmingPledge ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    {isPledging ? 'PLEDGING...' : 'CONFIRMING...'}
                  </div>
                ) : (
                  '🚀 PLEDGE NOW'
                )}
              </motion.button>
            </div>
            
            {!isConnected && (
              <div className="text-center">
                <div className="text-white/70 mb-3 text-sm">
                  Connect your wallet to join the action
                </div>
                <TantoConnectButton />
              </div>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
} 