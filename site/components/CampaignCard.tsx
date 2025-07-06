'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { parseEther, formatEther, Address } from 'viem';
import { saigon } from 'viem/chains';
import { CONTRACTS, PLEDGE_TO_CREATE_ABI } from '@/lib/contracts';
import { TantoConnectButton } from '@sky-mavis/tanto-widget';
import PrizeSponsorModal from './PrizeSponsorModal';
import { useSounds } from '@/hooks/useSounds';
import Image from 'next/image';

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
  ended: boolean;
  prizesClaimed: boolean;
}

interface CampaignWithId extends SerializedCampaign {
  id: number;
}

interface Prize {
  prizeType: number; // 0: ERC20, 1: ERC721, 2: ERC1155
  tokenContract: string;
  tokenId: string;
  amount: string;
  depositor: string;
  description: string;
}

interface CampaignCardProps {
  campaign: CampaignWithId;
  onPledgeSuccess?: () => void;
  onSponsorSuccess?: () => void;
}

export default function CampaignCard({ campaign, onPledgeSuccess, onSponsorSuccess }: CampaignCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [pledgeAmount, setPledgeAmount] = useState('');
  const [showSponsorModal, setShowSponsorModal] = useState(false);
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const { isConnected, address } = useAccount();
  const { playSound, preloadSounds } = useSounds();

  const { data: pledgeHash, writeContract: pledgeContract, isPending: isPledging } = useWriteContract();
  const { data: endCampaignHash, writeContract: endCampaignContract, isPending: isEndingCampaign } = useWriteContract();
  
  const { isLoading: isConfirmingPledge, isSuccess: isPledgeConfirmed } = useWaitForTransactionReceipt({
    hash: pledgeHash,
  });

  const { isLoading: isConfirmingEnd, isSuccess: isEndConfirmed } = useWaitForTransactionReceipt({
    hash: endCampaignHash,
  });

  // Get campaign prizes
  const { data: campaignPrizes } = useReadContract({
    address: CONTRACTS.PLEDGE_TO_CREATE,
    abi: PLEDGE_TO_CREATE_ABI,
    functionName: 'getCampaignPrizes',
    args: [BigInt(campaign.id)],
  });

  // Update prizes when data changes
  useEffect(() => {
    if (campaignPrizes) {
      // Convert the contract response to our Prize interface
      const convertedPrizes: Prize[] = (campaignPrizes as unknown[]).map((prize: unknown) => {
        const prizeData = prize as {
          prizeType: bigint;
          tokenContract: string;
          tokenId: bigint;
          amount: bigint;
          depositor: string;
          description: string;
        };
        return {
          prizeType: Number(prizeData.prizeType),
          tokenContract: prizeData.tokenContract,
          tokenId: prizeData.tokenId.toString(),
          amount: prizeData.amount.toString(),
          depositor: prizeData.depositor,
          description: prizeData.description,
        };
      });
      setPrizes(convertedPrizes);
    }
  }, [campaignPrizes]);

  // Preload sounds on component mount
  useEffect(() => {
    preloadSounds();
  }, [preloadSounds]);

  const handlePledge = async () => {
    if (!isConnected || !pledgeAmount) return;
    
    const amount = parseEther(pledgeAmount);
    
    pledgeContract({
      address: CONTRACTS.PLEDGE_TO_CREATE,
      abi: PLEDGE_TO_CREATE_ABI,
      functionName: 'pledgeToCampaign',
      args: [BigInt(campaign.id)],
      value: amount,
      chainId: saigon.id,
    });
  };

  const handleEndCampaign = async () => {
    if (!isConnected || !isCreator) return;
    
    endCampaignContract({
      address: CONTRACTS.PLEDGE_TO_CREATE,
      abi: PLEDGE_TO_CREATE_ABI,
      functionName: 'endCampaign',
      args: [BigInt(campaign.id)],
      chainId: saigon.id,
    });
  };

  const handleSponsorClick = () => {
    setShowSponsorModal(true);
    playSound('coin');
  };

  // Handle successful pledge
  useEffect(() => {
    if (isPledgeConfirmed) {
      setPledgeAmount('');
      playSound('success'); // Play success sound for pledge
      onPledgeSuccess?.();
    }
  }, [isPledgeConfirmed, onPledgeSuccess, playSound]);

  // Handle successful campaign end
  useEffect(() => {
    if (isEndConfirmed) {
      playSound('success'); // Play success sound for campaign end
      onPledgeSuccess?.(); // Refresh campaign data
    }
  }, [isEndConfirmed, onPledgeSuccess, playSound]);

  const getProgressPercentage = () => {
    const pledgedNum = Number(campaign.pledged || '0');
    const goalNum = Number(campaign.goal || '0');
    if (goalNum === 0) return 0;
    return Math.min((pledgedNum / goalNum) * 100, 100);
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

  const getPrizeTypeLabel = (prizeType: number) => {
    switch (prizeType) {
      case 0: return 'ERC20';
      case 1: return 'NFT';
      case 2: return 'ERC1155';
      default: return 'Unknown';
    }
  };

  const getPrizeEmoji = (prizeType: number) => {
    switch (prizeType) {
      case 0: return '🪙';
      case 1: return '🖼️';
      case 2: return '🎨';
      default: return '🎁';
    }
  };

  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
  };

  const isCreator = address?.toLowerCase() === campaign.creator.toLowerCase();
  const canEndCampaign = isCreator && campaign.active && !campaign.ended;
  const hasPrizes = prizes.length > 0;

  return (
    <motion.div
      className="bg-gradient-to-br from-black/80 to-purple-900/20 backdrop-blur-sm rounded-3xl border border-purple-500/30 overflow-hidden group shadow-2xl"
      whileHover={{ 
        scale: 1.02, 
        y: -8,
        boxShadow: "0 25px 50px -12px rgba(168, 85, 247, 0.25)"
      }}
      transition={{ duration: 0.3 }}
      layout
    >
      {/* Campaign Image */}
      <div className="relative h-48 bg-gradient-to-br from-purple-900/50 to-pink-900/50 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20" />
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.1) 1px, transparent 0)`,
            backgroundSize: '20px 20px'
          }} />
        </div>

        {/* Image */}
        <div className="relative h-full">
          {!imageError && campaign.imageUrl && (
            <Image
              src={campaign.imageUrl}
              alt={campaign.title}
              width={400}
              height={200}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
          )}
          
          {/* Loading State */}
          {imageLoading && !imageError && (
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
            </div>
          )}
          
          {/* Fallback for missing/failed images */}
          {(imageError || !campaign.imageUrl) && (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-600/30 to-pink-600/30">
              <div className="text-center">
                <div className="text-6xl mb-2 opacity-60">🎯</div>
                <div className="text-white/60 text-sm">Campaign Image</div>
              </div>
            </div>
          )}
        </div>

        {/* Status Badge */}
        <div className="absolute top-4 right-4 flex items-center gap-2">
          {campaign.active && !campaign.ended && (
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/50"></div>
          )}
          <span className={`text-xs px-3 py-1 rounded-full font-semibold backdrop-blur-sm ${
            campaign.ended
              ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
              : campaign.active 
                ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                : 'bg-red-500/20 text-red-400 border border-red-500/30'
          }`}>
            {campaign.ended ? 'ENDED' : campaign.active ? 'LIVE' : 'INACTIVE'}
          </span>
        </div>

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      </div>

      <div className="p-6">
        {/* Campaign Header */}
        <div className="mb-4">
          <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-purple-300 transition-colors leading-tight">
            {campaign.title}
          </h3>
          <p className="text-white/70 text-sm line-clamp-2 leading-relaxed">
            {campaign.description || 'No description provided'}
          </p>
        </div>

        {/* Progress Section */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">💰</span>
              <span className="text-xl font-bold text-purple-300">
                {safeFormatEther(campaign.pledged)} RON
              </span>
            </div>
            <div className="text-right">
              <div className="text-white/60 text-sm">Goal</div>
              <div className="text-white font-semibold">
                {safeFormatEther(campaign.goal)} RON
              </div>
            </div>
          </div>
          
          <div className="relative w-full bg-white/10 rounded-full h-4 overflow-hidden shadow-inner">
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 rounded-full shadow-lg"
              initial={{ width: 0 }}
              animate={{ width: `${getProgressPercentage()}%` }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
          </div>
          
          <div className="flex justify-between items-center mt-2">
            <div className="text-sm text-white/60">
              {getProgressPercentage().toFixed(1)}% funded
            </div>
            <div className="text-xs text-white/50">
              Created {formatDate(campaign.createdAt)}
            </div>
          </div>
        </div>

        {/* Prizes Section */}
        <div className="mb-6 p-4 bg-gradient-to-br from-purple-900/30 to-pink-900/30 rounded-2xl border border-purple-500/30 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🎁</span>
              <span className="text-sm font-semibold text-purple-300">
                End-of-Campaign Prizes
              </span>
            </div>
            <motion.span 
              className="text-xs text-pink-400 font-bold px-3 py-1 bg-pink-500/20 rounded-full border border-pink-500/30"
              animate={hasPrizes ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {prizes.length} Prize{prizes.length !== 1 ? 's' : ''}
            </motion.span>
          </div>
          
          {hasPrizes ? (
            <div className="space-y-2">
              {prizes.slice(0, 3).map((prize, index) => (
                <motion.div 
                  key={index} 
                  className="flex items-center justify-between text-xs bg-white/10 rounded-xl p-3 hover:bg-white/20 transition-all"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{getPrizeEmoji(prize.prizeType)}</span>
                    <div>
                      <div className="text-white/90 font-medium">{prize.description || 'Prize'}</div>
                      <div className="text-white/60 text-xs">
                        by {prize.depositor.slice(0, 6)}...{prize.depositor.slice(-4)}
                      </div>
                    </div>
                  </div>
                  <span className="text-purple-300 font-semibold px-2 py-1 bg-purple-500/20 rounded-lg">
                    {getPrizeTypeLabel(prize.prizeType)}
                  </span>
                </motion.div>
              ))}
              {prizes.length > 3 && (
                <div className="text-xs text-center text-white/60 py-2 bg-white/5 rounded-lg">
                  +{prizes.length - 3} more prize{prizes.length - 3 !== 1 ? 's' : ''}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-white/60 text-sm py-4 bg-white/5 rounded-xl border-2 border-dashed border-white/20">
              <div className="text-2xl mb-2">🎁</div>
              <div>No prizes yet - be the first to sponsor!</div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {/* Pledge Button */}
          {campaign.active && !campaign.ended && (
            <div className="space-y-3">
              <div className="flex flex-col gap-3">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Amount (RON)"
                  value={pledgeAmount}
                  onChange={(e) => setPledgeAmount(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-purple-500/30 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all"
                />
                {isConnected ? (
                  <motion.button
                    onClick={handlePledge}
                    disabled={isPledging || isConfirmingPledge || !pledgeAmount}
                    className="w-full px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg hover:shadow-purple-500/25"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {isPledging || isConfirmingPledge ? (
                      <div className="flex items-center justify-center gap-2">
                        <motion.div
                          className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        />
                        <span>Processing...</span>
                      </div>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <span>💰</span>
                        <span>Pledge</span>
                      </span>
                    )}
                  </motion.button>
                ) : (
                  <div className="w-full">
                    <TantoConnectButton />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Sponsor Prize Button */}
          {campaign.active && !campaign.ended && (
            <motion.button
              onClick={handleSponsorClick}
              className="w-full py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl font-semibold hover:from-yellow-600 hover:to-orange-600 transition-all shadow-lg hover:shadow-yellow-500/25"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="flex items-center justify-center gap-2">
                <span>🎁</span>
                <span>Sponsor a Prize</span>
                <span>✨</span>
              </span>
            </motion.button>
          )}

          {/* End Campaign Button (Creator Only) */}
          {canEndCampaign && (
            <motion.button
              onClick={handleEndCampaign}
              disabled={isEndingCampaign || isConfirmingEnd}
              className="w-full py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:from-red-600 hover:to-pink-600 transition-all shadow-lg hover:shadow-red-500/25"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isEndingCampaign || isConfirmingEnd ? (
                <div className="flex items-center justify-center gap-2">
                  <motion.div
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                  <span>⏳ Ending...</span>
                </div>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <span>🏁</span>
                  <span>End Campaign & Draw Prizes</span>
                  <span>🎰</span>
                </span>
              )}
            </motion.button>
          )}
        </div>

        {/* Expand/Collapse Button */}
        <motion.button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full mt-4 py-3 px-4 bg-white/10 hover:bg-white/20 rounded-xl text-white/80 text-sm font-medium transition-all duration-300 flex items-center justify-center gap-2 border border-white/10 hover:border-white/20"
          whileHover={{ scale: 1.02 }}
        >
          <span>{isExpanded ? '🔼' : '🔽'}</span>
          <span>{isExpanded ? 'Less Details' : 'More Details'}</span>
        </motion.button>

        {/* Expandable Details */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-6 space-y-4"
            >
              {/* Full Description */}
              <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                <h4 className="text-sm font-semibold text-purple-300 mb-3 flex items-center gap-2">
                  <span>📝</span>
                  <span>Full Description</span>
                </h4>
                <p className="text-white/80 text-sm leading-relaxed">
                  {campaign.description || 'No description provided'}
                </p>
              </div>

              {/* Campaign Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                  <div className="text-xs text-white/60 mb-2 flex items-center gap-2">
                    <span>👤</span>
                    <span>Creator</span>
                  </div>
                  <div className="text-sm text-white font-mono bg-white/10 px-3 py-2 rounded-lg">
                    {campaign.creator.slice(0, 6)}...{campaign.creator.slice(-4)}
                  </div>
                </div>

                <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                  <div className="text-xs text-white/60 mb-2 flex items-center gap-2">
                    <span>📅</span>
                    <span>Created</span>
                  </div>
                  <div className="text-sm text-white">
                    {formatDate(campaign.createdAt)}
                  </div>
                </div>
              </div>

              {/* All Prizes */}
              {hasPrizes && (
                <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                  <h4 className="text-sm font-semibold text-purple-300 mb-3 flex items-center gap-2">
                    <span>🎁</span>
                    <span>All Prizes ({prizes.length})</span>
                  </h4>
                  <div className="space-y-3">
                    {prizes.map((prize, index) => (
                      <motion.div 
                        key={index} 
                        className="flex items-center justify-between text-xs bg-white/10 rounded-xl p-4 hover:bg-white/20 transition-all"
                        whileHover={{ scale: 1.02 }}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{getPrizeEmoji(prize.prizeType)}</span>
                          <div>
                            <div className="text-white/90 font-medium text-sm">{prize.description || `Prize #${index + 1}`}</div>
                            <div className="text-white/60 text-xs">
                              Sponsored by {prize.depositor.slice(0, 6)}...{prize.depositor.slice(-4)}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-purple-300 font-semibold px-3 py-1 bg-purple-500/20 rounded-lg">
                            {getPrizeTypeLabel(prize.prizeType)}
                          </div>
                          {prize.prizeType === 0 && prize.amount !== '0' && (
                            <div className="text-white/60 text-xs mt-1">
                              {safeFormatEther(prize.amount)} tokens
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Campaign Status */}
              <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="text-xs text-white/60 mb-2 flex items-center gap-2">
                  <span>📊</span>
                  <span>Campaign Status</span>
                </div>
                <div className="text-sm text-white">
                  {campaign.ended 
                    ? campaign.prizesClaimed 
                      ? '🏆 Prizes have been distributed to winners!'
                      : '⏳ Campaign ended - prizes pending distribution...'
                    : campaign.active 
                      ? '🟢 Campaign is active and accepting pledges'
                      : '🔴 Campaign is inactive'
                  }
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Prize Sponsor Modal */}
      {showSponsorModal && (
        <PrizeSponsorModal
          campaignId={campaign.id}
          onClose={() => setShowSponsorModal(false)}
          onSuccess={() => {
            setShowSponsorModal(false);
            onSponsorSuccess?.();
          }}
        />
      )}
    </motion.div>
  );
} 