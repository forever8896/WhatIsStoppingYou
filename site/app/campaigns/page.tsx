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

  const { data: platformRevenue, refetch: refetchPlatformRevenue } = useReadContract({
    address: CONTRACTS.PLEDGE_TO_CREATE,
    abi: PLEDGE_TO_CREATE_ABI,
    functionName: 'platformRevenue',
    chainId: saigon.id,
  });

  // Update platform stats
  useEffect(() => {
    setPlatformStats({
      totalPledged: totalPledged?.toString() || '0',
      dailyRafflePool: dailyRafflePool?.toString() || '0',
      platformRevenue: platformRevenue?.toString() || '0',
      campaignCount: Number(campaignCount || 0)
    });
  }, [totalPledged, dailyRafflePool, platformRevenue, campaignCount]);

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
    refetchPlatformRevenue();
  }, [refetchCampaignCount, refetchTotalPledged, refetchDailyRafflePool, refetchPlatformRevenue]);

  // Fetch campaigns
  useEffect(() => {
    const fetchCampaigns = async () => {
      if (!campaignCount) return;
      
      const campaignPromises = [];
      const count = Number(campaignCount);
      
      for (let i = 0; i < count; i++) {
        campaignPromises.push(
          fetch(`/api/campaigns/${i}`)
            .then(res => res.json())
            .catch(() => null)
        );
      }
      
      const results = await Promise.all(campaignPromises);
      const validCampaigns = results
        .filter(Boolean)
        .map((campaign, index) => ({ ...campaign, id: index }));
      setCampaigns(validCampaigns);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-purple-900/20 to-black text-white overflow-hidden">
      {/* Event Watcher */}
      <EventWatcher
        onActivity={addActivity}
        onNotification={addNotification}
        onParticleEffect={triggerParticles}
        onSound={playSound}
        onCampaignUpdate={handleDataRefresh}
      />

      {/* Particle Effects */}
      <ParticleEffect trigger={particleEffect.trigger} type={particleEffect.type} />

      {/* Leaderboard Modal */}
      <Leaderboard isOpen={showLeaderboard} onClose={() => setShowLeaderboard(false)} />

      {/* Notifications */}
      <div className="fixed top-24 right-6 z-40 space-y-2">
        <AnimatePresence>
          {notifications.map((notification) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: 300, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 300, scale: 0.8 }}
              transition={{ duration: 0.3 }}
              className={`max-w-sm p-4 rounded-lg shadow-lg border backdrop-blur-sm ${
                notification.type === 'success' ? 'bg-green-900/20 border-green-500/20' :
                notification.type === 'error' ? 'bg-red-900/20 border-red-500/20' :
                notification.type === 'warning' ? 'bg-yellow-900/20 border-yellow-500/20' :
                'bg-blue-900/20 border-blue-500/20'
              }`}
            >
              <div className={`font-semibold mb-1 ${
                notification.type === 'success' ? 'text-green-400' :
                notification.type === 'error' ? 'text-red-400' :
                notification.type === 'warning' ? 'text-yellow-400' :
                'text-blue-400'
              }`}>
                {notification.title}
              </div>
              <div className="text-white/80 text-sm">
                {notification.message}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-40 p-6 bg-black/80 backdrop-blur-sm border-b border-purple-500/20">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <motion.div
            className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 cursor-pointer"
            onClick={() => router.push('/')}
            whileHover={{ scale: 1.05 }}
          >
            WhatsStoppingYou
          </motion.div>
          
          <div className="flex items-center gap-4">
            <motion.button
              onClick={() => setShowLeaderboard(true)}
              className="px-4 py-2 bg-gradient-to-r from-yellow-600 to-orange-600 rounded-full font-semibold text-sm hover:from-yellow-700 hover:to-orange-700 transition-all duration-300"
              whileHover={{ scale: 1.05 }}
            >
              🏆 Leaderboard
            </motion.button>
            
            <motion.button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-full ${soundEnabled ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}
              whileHover={{ scale: 1.05 }}
            >
              {soundEnabled ? '🔊' : '🔇'}
            </motion.button>
            
            <motion.button
              onClick={() => router.push('/create')}
              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-300"
              whileHover={{ scale: 1.05 }}
            >
              CREATE
            </motion.button>
            
            <TantoConnectButton />
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="pt-24">
        {/* Stats Dashboard */}
        <div className="max-w-7xl mx-auto px-6 mb-8">
          <motion.div
            className="text-center mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 mb-4">
              🎮 CAMPAIGN ARENA
            </h1>
            <p className="text-xl text-white/70">
              Pledge • Win • Celebrate • Repeat
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <motion.div
              className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/30"
              whileHover={{ scale: 1.02, y: -5 }}
            >
              <div className="text-purple-300 text-sm mb-2">💰 Total Pledged</div>
              <div className="text-3xl font-bold text-white">
                {safeFormatEther(platformStats.totalPledged)} RON
              </div>
              <div className="text-purple-400 text-xs mt-1">
                Across {platformStats.campaignCount} campaigns
              </div>
            </motion.div>

            <motion.div
              className="bg-gradient-to-br from-blue-900/40 to-cyan-900/40 backdrop-blur-sm rounded-2xl p-6 border border-blue-500/30"
              whileHover={{ scale: 1.02, y: -5 }}
            >
              <div className="text-blue-300 text-sm mb-2">🎰 Daily Raffle</div>
              <div className="text-3xl font-bold text-white">
                {safeFormatEther(platformStats.dailyRafflePool)} RON
              </div>
              <div className="text-blue-400 text-xs mt-1">
                Winner selected daily
              </div>
            </motion.div>

            <motion.div
              className="bg-gradient-to-br from-green-900/40 to-emerald-900/40 backdrop-blur-sm rounded-2xl p-6 border border-green-500/30"
              whileHover={{ scale: 1.02, y: -5 }}
            >
              <div className="text-green-300 text-sm mb-2">📊 Platform Revenue</div>
              <div className="text-3xl font-bold text-white">
                {safeFormatEther(platformStats.platformRevenue)} RON
              </div>
              <div className="text-green-400 text-xs mt-1">
                5% fee reinvested
              </div>
            </motion.div>

            <motion.div
              className="bg-gradient-to-br from-orange-900/40 to-red-900/40 backdrop-blur-sm rounded-2xl p-6 border border-orange-500/30"
              whileHover={{ scale: 1.02, y: -5 }}
            >
              <div className="text-orange-300 text-sm mb-2">🚀 Active Campaigns</div>
              <div className="text-3xl font-bold text-white">
                {campaigns.filter(c => c.active).length}
              </div>
              <div className="text-orange-400 text-xs mt-1">
                Ready for action
              </div>
            </motion.div>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="max-w-7xl mx-auto px-6 mb-8">
          <ActivityFeed activities={activityFeed} />
        </div>

        {/* Campaigns Grid */}
        <div className="max-w-7xl mx-auto px-6 pb-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {campaigns.map((campaign, index) => (
              <motion.div
                key={campaign.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <CampaignCard 
                  campaign={campaign} 
                  onPledgeSuccess={handleDataRefresh}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 