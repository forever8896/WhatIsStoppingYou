'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { TantoConnectButton } from '@sky-mavis/tanto-widget';
import { useAccount, useReadContract } from 'wagmi';
import { formatEther } from 'viem';
import { saigon } from 'viem/chains';
import { CONTRACTS, PLEDGE_TO_CREATE_ABI } from '@/lib/contracts';
import ParticleEffect from '@/components/ParticleEffect';
import Leaderboard from '@/components/Leaderboard';
import EventWatcher from '@/components/EventWatcher';
import ActivityFeed from '@/components/ActivityFeed';
import CampaignCard from '@/components/CampaignCard';
import DailyRaffleWidget from '@/components/DailyRaffleWidget';
import { Address } from 'viem';
import Link from 'next/link';
import { useSounds } from '@/hooks/useSounds';
import SoundControl from '@/components/SoundControl';

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

interface ActivityFeedItem {
  id: string;
  type: 'pledge' | 'raffle_win' | 'raffle_request' | 'campaign_created';
  message: string;
  timestamp: Date;
  user?: string;
  amount?: string;
}

interface Notification {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<CampaignWithId[]>([]);
  const [activityFeed, setActivityFeed] = useState<ActivityFeedItem[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [particleEffect, setParticleEffect] = useState<{trigger: boolean, type: 'win' | 'pledge' | 'raffle'}>({ trigger: false, type: 'pledge' });
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [platformStats, setPlatformStats] = useState({
    totalPledged: '0',
    dailyRafflePool: '0',
    platformRevenue: '0',
    campaignCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'ended'>('all');
  
  const router = useRouter();
  const { isConnected } = useAccount();
  const { playSound, preloadSounds } = useSounds();

  // Get platform data
  const { data: campaignCount, refetch: refetchCampaignCount } = useReadContract({
    address: CONTRACTS.PLEDGE_TO_CREATE,
    abi: PLEDGE_TO_CREATE_ABI,
    functionName: 'campaignCount',
    chainId: saigon.id,
  });

  const { data: totalPledged, refetch: refetchTotalPledged } = useReadContract({
    address: CONTRACTS.PLEDGE_TO_CREATE,
    abi: PLEDGE_TO_CREATE_ABI,
    functionName: 'totalPledged',
    chainId: saigon.id,
  });

  const { data: dailyRafflePool, refetch: refetchDailyRafflePool } = useReadContract({
    address: CONTRACTS.PLEDGE_TO_CREATE,
    abi: PLEDGE_TO_CREATE_ABI,
    functionName: 'dailyRafflePool',
    chainId: saigon.id,
  });

  // Update platform stats
  useEffect(() => {
    setPlatformStats({
      totalPledged: totalPledged?.toString() || '0',
      dailyRafflePool: dailyRafflePool?.toString() || '0',
      platformRevenue: '0',
      campaignCount: Number(campaignCount || 0)
    });
  }, [totalPledged, dailyRafflePool, campaignCount]);

  // Preload sounds on component mount
  useEffect(() => {
    preloadSounds();
  }, [preloadSounds]);

  // Particle effect trigger
  const triggerParticles = useCallback((type: 'win' | 'pledge' | 'raffle') => {
    setParticleEffect({ trigger: true, type });
    setTimeout(() => {
      setParticleEffect({ trigger: false, type });
    }, 3000);
  }, []);

  // Notification system
  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date(),
    };
    setNotifications(prev => [newNotification, ...prev.slice(0, 4)]);
    
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
    }, 6000);
  }, []);

  // Activity feed helper
  const addActivity = useCallback((activity: Omit<ActivityFeedItem, 'id' | 'timestamp'>) => {
    const newActivity: ActivityFeedItem = {
      ...activity,
      id: Date.now().toString(),
      timestamp: new Date()
    };
    setActivityFeed(prev => [newActivity, ...prev.slice(0, 19)]);
  }, []);

  // Update specific campaign without full page refresh
  const updateCampaign = useCallback(async (campaignId: number) => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}`);
      if (response.ok) {
        const updatedCampaign = await response.json();
        setCampaigns(prev => prev.map(campaign => 
          campaign.id === campaignId 
            ? { ...updatedCampaign, id: campaignId }
            : campaign
        ));
        
        // Only refetch platform stats for pledge-related updates
        refetchTotalPledged();
        refetchDailyRafflePool();
      }
    } catch (error) {
      console.error(`Error updating campaign ${campaignId}:`, error);
    }
  }, [refetchTotalPledged, refetchDailyRafflePool]);

  // Handle pledge success - only update the specific campaign
  const handlePledgeSuccess = useCallback((campaignId: number) => {
    updateCampaign(campaignId);
    playSound('pledge');
    triggerParticles('pledge');
    addNotification({
      type: 'success',
      title: 'Pledge Successful! 🎉',
      message: 'Your pledge has been recorded and you\'re entered in the prize draw!'
    });
    addActivity({
      type: 'pledge',
      message: `New pledge made to campaign #${campaignId}`,
    });
  }, [updateCampaign, playSound, triggerParticles, addNotification, addActivity]);

  // Handle sponsor success - only update the specific campaign
  const handleSponsorSuccess = useCallback((campaignId: number) => {
    updateCampaign(campaignId);
    addNotification({
      type: 'success',
      title: 'Prize Sponsored! 🎁',
      message: 'Your prize has been added to the campaign!'
    });
    addActivity({
      type: 'pledge',
      message: `New prize sponsored for campaign #${campaignId}`,
    });
  }, [updateCampaign, addNotification, addActivity]);

  // Full refresh handler (only used for manual refresh button)
  const handleManualRefresh = useCallback(() => {
    setLoading(true);
    refetchCampaignCount();
    refetchTotalPledged();
    refetchDailyRafflePool();
    
    // Re-fetch all campaigns
    const count = Number(campaignCount || 0);
    const campaignPromises = [];
    
    for (let i = 0; i < count; i++) {
      campaignPromises.push(
        fetch(`/api/campaigns/${i}`)
          .then(res => res.json())
          .then(data => ({ ...data, id: i }))
          .catch(err => {
            console.error(`Error fetching campaign ${i}:`, err);
            return null;
          })
      );
    }
    
    Promise.all(campaignPromises)
      .then(results => {
        const validCampaigns = results.filter(Boolean) as CampaignWithId[];
        setCampaigns(validCampaigns);
      })
      .catch(error => {
        console.error('Error fetching campaigns:', error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [refetchCampaignCount, refetchTotalPledged, refetchDailyRafflePool, campaignCount]);

  // Initial fetch of campaigns
  useEffect(() => {
    const fetchCampaigns = async () => {
      if (!campaignCount) return;
      
      setLoading(true);
      const count = Number(campaignCount);
      
      const campaignPromises = [];
      
      for (let i = 0; i < count; i++) {
        campaignPromises.push(
          fetch(`/api/campaigns/${i}`)
            .then(res => res.json())
            .then(data => ({ ...data, id: i }))
            .catch(err => {
              console.error(`Error fetching campaign ${i}:`, err);
              return null;
            })
        );
      }
      
      try {
        const results = await Promise.all(campaignPromises);
        const validCampaigns = results.filter(Boolean) as CampaignWithId[];
        setCampaigns(validCampaigns);
      } catch (error) {
        console.error('Error fetching campaigns:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCampaigns();
  }, [campaignCount]); // Only re-run when campaign count changes

  const safeFormatEther = (value: string) => {
    try {
      return formatEther(BigInt(value || '0'));
    } catch {
      return '0';
    }
  };

  const filteredCampaigns = campaigns.filter(campaign => {
    switch (filter) {
      case 'active':
        return campaign.active && !campaign.ended;
      case 'ended':
        return campaign.ended;
      default:
        return true;
    }
  });

  const activeCampaigns = campaigns.filter(c => c.active && !c.ended).length;
  const endedCampaigns = campaigns.filter(c => c.ended).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Navigation */}
      <nav className="relative z-50 p-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-3xl font-bold text-white cursor-pointer flex items-center gap-2"
            onClick={() => router.push('/')}
          >
            <span className="text-4xl">🚀</span>
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Helpify
            </span>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-6"
          >
            <div className="flex items-center space-x-6">
              <Link href="/" className="text-white/70 hover:text-white transition-colors">
                Home
              </Link>
              <Link href="/create" className="text-white/70 hover:text-white transition-colors">
                Create
              </Link>
              <Link href="/leaderboard" className="text-white/70 hover:text-white transition-colors">
                Leaderboard
              </Link>
              <span className="text-purple-400 font-semibold">
                Campaigns
              </span>
              <SoundControl />
              <TantoConnectButton />
            </div>
          </motion.div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-5xl font-bold text-white mb-4">
            🚀 <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Campaigns
            </span>
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Discover amazing projects, pledge your support, and win incredible prizes!
          </p>
        </motion.div>

        {/* Daily Raffle Widget */}
        <DailyRaffleWidget onDrawSuccess={() => refetchDailyRafflePool()} />

        {/* Filter Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex justify-center mb-8"
        >
          <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-2 border border-white/10">
            <div className="flex gap-2">
              {(['all', 'active', 'ended'] as const).map((filterType) => (
                <button
                  key={filterType}
                  onClick={() => setFilter(filterType)}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                    filter === filterType
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                      : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {filterType === 'all' && `All (${campaigns.length})`}
                  {filterType === 'active' && `Active (${activeCampaigns})`}
                  {filterType === 'ended' && `Ended (${endedCampaigns})`}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Campaign Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-6 border border-green-500/20">
            <div className="text-3xl font-bold text-green-400 mb-2">{campaigns.length}</div>
            <div className="text-gray-300">Total Campaigns</div>
          </div>
          <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-6 border border-blue-500/20">
            <div className="text-3xl font-bold text-blue-400 mb-2">{activeCampaigns}</div>
            <div className="text-gray-300">Active Campaigns</div>
          </div>
          <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/20">
            <div className="text-3xl font-bold text-purple-400 mb-2">{endedCampaigns}</div>
            <div className="text-gray-300">Completed Campaigns</div>
          </div>
        </motion.div>

        {/* Campaigns Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="bg-black/30 backdrop-blur-sm rounded-2xl p-6 border border-white/10"
              >
                <div className="animate-pulse">
                  <div className="h-6 bg-gray-700 rounded mb-4"></div>
                  <div className="h-4 bg-gray-700 rounded mb-2"></div>
                  <div className="h-4 bg-gray-700 rounded mb-4"></div>
                  <div className="h-3 bg-gray-700 rounded mb-2"></div>
                  <div className="h-8 bg-gray-700 rounded"></div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : filteredCampaigns.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredCampaigns.map((campaign, index) => (
              <motion.div
                key={campaign.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <CampaignCard
                  campaign={campaign}
                  onPledgeSuccess={() => handlePledgeSuccess(campaign.id)}
                  onSponsorSuccess={() => handleSponsorSuccess(campaign.id)}
                />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center py-16"
          >
            <div className="text-6xl mb-4">🎯</div>
            <h3 className="text-2xl font-bold text-white mb-2">
              {filter === 'active' ? 'No Active Campaigns' : 
               filter === 'ended' ? 'No Ended Campaigns' : 'No Campaigns Yet'}
            </h3>
            <p className="text-gray-400 mb-8">
              {filter === 'active' ? 'All campaigns have ended or are inactive.' :
               filter === 'ended' ? 'No campaigns have been completed yet.' :
               'Be the first to create a campaign and start something amazing!'}
            </p>
            <motion.button
              onClick={() => window.location.href = '/create'}
              className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:from-purple-600 hover:to-pink-600 transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              🚀 Create Campaign
            </motion.button>
          </motion.div>
        )}

        {/* Manual Refresh Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-12"
        >
          <motion.button
            onClick={handleManualRefresh}
            disabled={loading}
            className="px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl text-white font-medium transition-all border border-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
            whileHover={{ scale: loading ? 1 : 1.05 }}
            whileTap={{ scale: loading ? 1 : 0.95 }}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <motion.div
                  className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
                <span>Refreshing...</span>
              </div>
            ) : (
              <>🔄 Refresh Campaigns</>
            )}
          </motion.button>
        </motion.div>

        {/* Notifications */}
        <AnimatePresence>
          {notifications.map((notification) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: 300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 300 }}
              className="fixed top-4 right-4 z-50 max-w-sm"
            >
              <div className={`p-4 rounded-xl backdrop-blur-sm border shadow-lg ${
                notification.type === 'success' ? 'bg-green-500/20 border-green-500/50 text-green-300' :
                notification.type === 'error' ? 'bg-red-500/20 border-red-500/50 text-red-300' :
                notification.type === 'warning' ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-300' :
                'bg-blue-500/20 border-blue-500/50 text-blue-300'
              }`}>
                <div className="font-semibold mb-1">{notification.title}</div>
                <div className="text-sm opacity-90">{notification.message}</div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Particle Effects */}
        <ParticleEffect trigger={particleEffect.trigger} type={particleEffect.type} />
      </div>
    </div>
  );
} 