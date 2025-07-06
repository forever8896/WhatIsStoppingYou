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
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'ended'>('all');
  
  const router = useRouter();
  const { isConnected } = useAccount();

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

  // Sound effects
  const playSound = useCallback((type: 'pledge' | 'win' | 'raffle') => {
    if (!soundEnabled) return;
    
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      switch (type) {
        case 'pledge':
          oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(880, audioContext.currentTime + 0.2);
          break;
        case 'win':
          oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(1046.5, audioContext.currentTime + 0.5);
          break;
        case 'raffle':
          oscillator.frequency.setValueAtTime(293.66, audioContext.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(587.33, audioContext.currentTime + 0.3);
          break;
      }
      
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.log('Audio context not available:', error);
    }
  }, [soundEnabled]);

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

  // Refresh data handler
  const handleDataRefresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
    // Refetch platform stats
    refetchCampaignCount();
    refetchTotalPledged();
    refetchDailyRafflePool();
  }, [refetchCampaignCount, refetchTotalPledged, refetchDailyRafflePool]);

  // Fetch campaigns
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
  }, [campaignCount, refreshTrigger]);

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
            <button
              onClick={() => router.push('/campaigns')}
              className="text-purple-300 font-semibold border-b-2 border-purple-300"
            >
              🎯 Campaigns
            </button>
            <button
              onClick={() => router.push('/create')}
              className="text-white/80 hover:text-white transition-colors font-semibold"
            >
              ✨ Create
            </button>
            <TantoConnectButton />
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
        <DailyRaffleWidget onDrawSuccess={handleDataRefresh} />

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
                  onPledgeSuccess={handleDataRefresh}
                  onSponsorSuccess={handleDataRefresh}
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

        {/* Refresh Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-12"
        >
          <motion.button
            onClick={handleDataRefresh}
            className="px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl text-white font-medium transition-all border border-white/20"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            🔄 Refresh Campaigns
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
} 