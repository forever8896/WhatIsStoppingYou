'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { TantoConnectButton } from '@sky-mavis/tanto-widget';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { saigon } from 'viem/chains';
import { CONTRACTS, PLEDGE_TO_CREATE_ABI, Campaign } from '@/lib/contracts';

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
}

interface CampaignWithId extends SerializedCampaign {
  id: number;
}

export default function HelpPage() {
  const [campaigns, setCampaigns] = useState<CampaignWithId[]>([]);
  const [expandedCampaign, setExpandedCampaign] = useState<number | null>(null);
  const [pledgeAmount, setPledgeAmount] = useState('');
  const [pledgingTo, setPledgingTo] = useState<number | null>(null);
  const router = useRouter();
  const { isConnected, address } = useAccount();

  // Get campaign count
  const { data: campaignCount, error: campaignCountError } = useReadContract({
    address: CONTRACTS.PLEDGE_TO_CREATE,
    abi: PLEDGE_TO_CREATE_ABI,
    functionName: 'campaignCount',
    chainId: saigon.id,
  });

  // Add debugging
  useEffect(() => {
    console.log('Campaign count:', campaignCount);
    if (campaignCountError) {
      console.error('Campaign count error:', campaignCountError);
    }
  }, [campaignCount, campaignCountError]);

  // Pledge functionality
  const { data: pledgeHash, writeContract, error: pledgeError, isPending: isPledging } = useWriteContract();
  const { isLoading: isConfirmingPledge, isSuccess: isPledgeConfirmed } = useWaitForTransactionReceipt({
    hash: pledgeHash,
  });

  // Fetch all campaigns
  useEffect(() => {
    const fetchCampaigns = async () => {
      if (!campaignCount) {
        console.log('No campaign count yet, skipping fetch');
        return;
      }
      
      const campaignPromises = [];
      const count = Number(campaignCount);
      console.log('Fetching campaigns, count:', count);
      
      for (let i = 0; i < count; i++) {
        campaignPromises.push(
          fetch(`/api/campaigns/${i}`)
            .then(res => {
              console.log(`Campaign ${i} response status:`, res.status);
              return res.json();
            })
            .catch((error) => {
              console.error(`Error fetching campaign ${i}:`, error);
              return null;
            })
        );
      }
      
      try {
        const results = await Promise.all(campaignPromises);
        console.log('Campaign results:', results);
        const validCampaigns = results
          .filter(Boolean)
          .map((campaign, index) => ({
            ...campaign,
            id: index
          }));
        console.log('Valid campaigns:', validCampaigns);
        setCampaigns(validCampaigns);
      } catch (error) {
        console.error('Error fetching campaigns:', error);
      }
    };

    fetchCampaigns();
  }, [campaignCount]);

  const handlePledge = async (campaignId: number) => {
    if (!isConnected || !pledgeAmount) return;
    
    try {
      setPledgingTo(campaignId);
      const amount = parseEther(pledgeAmount);
      
      writeContract({
        address: CONTRACTS.PLEDGE_TO_CREATE,
        abi: PLEDGE_TO_CREATE_ABI,
        functionName: 'pledgeToCampaign',
        args: [BigInt(campaignId)],
        value: amount,
        chainId: saigon.id,
      });
    } catch (error) {
      console.error('Error pledging:', error);
      setPledgingTo(null);
    }
  };

  // Reset pledge form on success
  useEffect(() => {
    if (isPledgeConfirmed) {
      setPledgeAmount('');
      setPledgingTo(null);
      // Refresh campaigns after successful pledge
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    }
  }, [isPledgeConfirmed]);

  const toggleExpanded = (campaignId: number) => {
    setExpandedCampaign(expandedCampaign === campaignId ? null : campaignId);
  };

  const formatDate = (timestamp: string) => {
    return new Date(Number(timestamp) * 1000).toLocaleDateString();
  };

  const getProgressPercentage = (pledged: string, goal: string) => {
    const pledgedNum = Number(pledged);
    const goalNum = Number(goal);
    if (goalNum === 0) return 0;
    return Math.min((pledgedNum / goalNum) * 100, 100);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 p-6 bg-black/50 backdrop-blur-sm">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <motion.div
            className="text-2xl font-bold text-white cursor-pointer"
            onClick={() => router.push('/')}
            whileHover={{ scale: 1.05 }}
            style={{
              fontFamily: 'system-ui, -apple-system, sans-serif',
              fontWeight: 900,
            }}
          >
            WhatsStoppingYou
          </motion.div>
          
          <div className="flex items-center gap-8">
            <motion.button
              onClick={() => router.push('/create')}
              className="text-lg font-semibold text-white/80 hover:text-white transition-colors duration-300"
              whileHover={{ scale: 1.05 }}
            >
              CREATE
            </motion.button>
            <motion.button
              onClick={() => router.push('/why')}
              className="text-lg font-semibold text-white/80 hover:text-white transition-colors duration-300"
              whileHover={{ scale: 1.05 }}
            >
              WHY
            </motion.button>
            <TantoConnectButton />
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="pt-24 pb-12">
        <div className="max-w-6xl mx-auto px-6">
          <motion.h1
            className="text-6xl md:text-8xl font-black text-center mb-12"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            style={{
              fontFamily: 'system-ui, -apple-system, sans-serif',
              fontWeight: 900,
            }}
          >
            CAMPAIGNS
          </motion.h1>

          {/* Pledge Success Message */}
          {isPledgeConfirmed && (
            <motion.div
              className="text-center mb-12"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="bg-green-900/20 border border-green-500/20 rounded-2xl p-6">
                <div className="text-green-400 text-xl font-semibold mb-2">
                  🎉 Pledge Successful!
                </div>
                <div className="text-white/70 text-sm">
                  You've received a soulbound NFT. Refreshing campaigns...
                </div>
              </div>
            </motion.div>
          )}

          {/* Pledge Error */}
          {pledgeError && (
            <motion.div
              className="text-center mb-12"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="bg-red-900/20 border border-red-500/20 rounded-2xl p-6">
                <div className="text-red-400 text-xl font-semibold mb-2">
                  ❌ Pledge Failed
                </div>
                <div className="text-white/70 text-sm">
                  {pledgeError.message}
                </div>
              </div>
            </motion.div>
          )}

          {/* Campaigns List */}
          <div className="space-y-6">
            {campaigns.length === 0 ? (
              <motion.div
                className="text-center py-12"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6 }}
              >
                <div className="text-white/50 text-xl mb-4">No campaigns found</div>
                <motion.button
                  onClick={() => router.push('/create')}
                  className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl font-bold text-white"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Create First Campaign
                </motion.button>
              </motion.div>
            ) : (
              campaigns.map((campaign, index) => (
                <motion.div
                  key={campaign.id}
                  className="bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 overflow-hidden"
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.6 }}
                >
                  {/* Campaign Header */}
                  <div
                    className="p-6 cursor-pointer hover:bg-white/5 transition-colors duration-300"
                    onClick={() => toggleExpanded(campaign.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-6 flex-1">
                        {/* Campaign Image Thumbnail */}
                        {campaign.imageUrl && (
                          <div className="flex-shrink-0">
                            <img
                              src={campaign.imageUrl}
                              alt={campaign.title}
                              className="w-20 h-20 object-cover rounded-lg bg-white/5"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                        
                        {/* Campaign Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-4 mb-4">
                            <h2 className="text-2xl font-bold truncate">{campaign.title}</h2>
                            <div className={`px-3 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${
                              campaign.active 
                                ? 'bg-green-900/20 text-green-400 border border-green-500/20'
                                : 'bg-red-900/20 text-red-400 border border-red-500/20'
                            }`}>
                              {campaign.active ? 'Active' : 'Inactive'}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-8 text-white/70 flex-wrap">
                            <div>
                              <span className="text-white font-semibold">
                                {formatEther(BigInt(campaign.pledged))} RON
                              </span>
                              <span className="text-sm"> of {formatEther(BigInt(campaign.goal))} RON</span>
                            </div>
                            <div className="text-sm">
                              Created: {formatDate(campaign.createdAt)}
                            </div>
                            <div className="text-sm">
                              by {campaign.creator.slice(0, 6)}...{campaign.creator.slice(-4)}
                            </div>
                          </div>
                          
                          {/* Progress Bar */}
                          <div className="mt-4 w-full bg-white/10 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${getProgressPercentage(campaign.pledged, campaign.goal)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="ml-6 flex-shrink-0">
                        <motion.div
                          className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10"
                          animate={{ rotate: expandedCampaign === campaign.id ? 180 : 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </motion.div>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  <AnimatePresence>
                    {expandedCampaign === campaign.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="border-t border-white/10"
                      >
                        <div className="p-6">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Campaign Details */}
                            <div>
                              <h3 className="text-xl font-semibold mb-4">Description</h3>
                              <p className="text-white/80 mb-6 leading-relaxed">
                                {campaign.description}
                              </p>
                              
                              <div className="space-y-3">
                                <div className="flex justify-between">
                                  <span className="text-white/70">Goal:</span>
                                  <span className="font-semibold">{formatEther(BigInt(campaign.goal))} RON</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-white/70">Pledged:</span>
                                  <span className="font-semibold">{formatEther(BigInt(campaign.pledged))} RON</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-white/70">Progress:</span>
                                  <span className="font-semibold">
                                    {getProgressPercentage(campaign.pledged, campaign.goal).toFixed(1)}%
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-white/70">Status:</span>
                                  <span className={`font-semibold ${
                                    campaign.withdrawn ? 'text-green-400' : 'text-white'
                                  }`}>
                                    {campaign.withdrawn ? 'Funds Withdrawn' : 'Accepting Pledges'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Campaign Image & Pledge Form */}
                            <div>
                              {/* Campaign Image */}
                              {campaign.imageUrl && (
                                <div className="mb-6">
                                  <img
                                    src={campaign.imageUrl}
                                    alt={campaign.title}
                                    className="w-full h-48 object-contain rounded-lg bg-white/5"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.style.display = 'none';
                                    }}
                                  />
                                </div>
                              )}

                              {/* Pledge Form */}
                              {campaign.active && !campaign.withdrawn && (
                                <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                                  <h3 className="text-xl font-semibold mb-4">Support This Campaign</h3>
                                  
                                  {isConnected ? (
                                    <div className="space-y-4">
                                      <div>
                                        <label className="block text-sm font-medium mb-2">
                                          Pledge Amount (RON)
                                        </label>
                                        <input
                                          type="number"
                                          value={pledgeAmount}
                                          onChange={(e) => setPledgeAmount(e.target.value)}
                                          placeholder="0.1"
                                          step="0.01"
                                          min="0"
                                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-purple-500"
                                          disabled={isPledging || isConfirmingPledge}
                                        />
                                        <div className="text-white/50 text-xs mt-1">
                                          Platform fee: 5% will be deducted
                                        </div>
                                      </div>
                                      
                                      <motion.button
                                        onClick={() => handlePledge(campaign.id)}
                                        disabled={!pledgeAmount || isPledging || isConfirmingPledge || pledgingTo === campaign.id}
                                        className="w-full py-3 px-6 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg font-semibold text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                        whileHover={{ scale: (!pledgeAmount || isPledging || isConfirmingPledge) ? 1 : 1.02 }}
                                        whileTap={{ scale: (!pledgeAmount || isPledging || isConfirmingPledge) ? 1 : 0.98 }}
                                      >
                                        {pledgingTo === campaign.id ? (
                                          <div className="flex items-center justify-center gap-2">
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            {isPledging ? 'Confirming...' : 'Processing...'}
                                          </div>
                                        ) : (
                                          'Pledge Now'
                                        )}
                                      </motion.button>
                                      
                                      <div className="text-white/60 text-xs text-center">
                                        You'll receive a soulbound NFT as proof of your support
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="text-center">
                                      <div className="text-white/70 mb-4">
                                        Connect your wallet to pledge
                                      </div>
                                      <TantoConnectButton />
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 