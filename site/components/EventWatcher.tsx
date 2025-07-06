'use client';

import { useCallback } from 'react';
import { useAccount, useWatchContractEvent } from 'wagmi';
import { formatEther } from 'viem';
import { CONTRACTS, PLEDGE_TO_CREATE_ABI } from '@/lib/contracts';

interface ActivityFeed {
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

interface EventWatcherProps {
  onActivity: (activity: Omit<ActivityFeed, 'id' | 'timestamp'>) => void;
  onNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  onParticleEffect: (type: 'win' | 'pledge' | 'raffle') => void;
  onSound: (type: 'pledge' | 'win' | 'raffle') => void;
  onCampaignUpdate: () => void;
}

export default function EventWatcher({ 
  onActivity, 
  onNotification, 
  onParticleEffect, 
  onSound,
  onCampaignUpdate 
}: EventWatcherProps) {
  const { address } = useAccount();

  // Pledge Made Event
  useWatchContractEvent({
    address: CONTRACTS.PLEDGE_TO_CREATE,
    abi: PLEDGE_TO_CREATE_ABI,
    eventName: 'PledgeMade',
    onLogs: useCallback((logs: any[]) => {
      logs.forEach((log: any) => {
        const { campaignId, pledger, amount, nftTokenId } = log.args;
        if (pledger && amount && campaignId) {
          onParticleEffect('pledge');
          onSound('pledge');
          
          const isCurrentUser = pledger === address;
          onActivity({
            type: 'pledge',
            message: `${isCurrentUser ? 'You' : `${pledger.slice(0, 6)}...${pledger.slice(-4)}`} pledged ${formatEther(amount)} RON to Campaign #${campaignId}`,
            user: pledger,
            amount: amount.toString()
          });
          
          if (isCurrentUser) {
            onNotification({
              type: 'success',
              title: '🎉 Pledge Successful!',
              message: `You pledged ${formatEther(amount)} RON and received NFT #${nftTokenId}`,
            });
          }
          
          // Trigger campaign data refresh
          onCampaignUpdate();
        }
      });
    }, [address, onActivity, onNotification, onParticleEffect, onSound, onCampaignUpdate]),
  });

  // Campaign Raffle Winner Event
  useWatchContractEvent({
    address: CONTRACTS.PLEDGE_TO_CREATE,
    abi: PLEDGE_TO_CREATE_ABI,
    eventName: 'CampaignPrizeWinner',
    onLogs: useCallback((logs: any[]) => {
      logs.forEach((log: any) => {
        const { campaignId, winner, prizeIndex } = log.args;
        if (winner && prizeIndex !== undefined && campaignId) {
          onParticleEffect('win');
          onSound('win');
          
          const isCurrentUser = winner === address;
          onActivity({
            type: 'raffle_win',
            message: `🏆 ${isCurrentUser ? 'You won' : `${winner.slice(0, 6)}...${winner.slice(-4)} won`} Prize #${prizeIndex} in Campaign #${campaignId} raffle!`,
            user: winner,
            amount: prizeIndex.toString()
          });
          
          onNotification({
            type: isCurrentUser ? 'success' : 'info',
            title: isCurrentUser ? '🏆 YOU WON!' : '🎰 Raffle Winner',
            message: `${isCurrentUser ? 'Congratulations! You won' : `${winner.slice(0, 6)}...${winner.slice(-4)} won`} Prize #${prizeIndex}!`,
          });
          
          // Trigger campaign data refresh
          onCampaignUpdate();
        }
      });
    }, [address, onActivity, onNotification, onParticleEffect, onSound, onCampaignUpdate]),
  });

  // Daily Raffle Winner Event
  useWatchContractEvent({
    address: CONTRACTS.PLEDGE_TO_CREATE,
    abi: PLEDGE_TO_CREATE_ABI,
    eventName: 'DailyRaffleWinner',
    onLogs: useCallback((logs: any[]) => {
      logs.forEach((log: any) => {
        const { day, winner, prize } = log.args;
        if (winner && prize && day) {
          onParticleEffect('win');
          onSound('win');
          
          const isCurrentUser = winner === address;
          onActivity({
            type: 'raffle_win',
            message: `🎊 ${isCurrentUser ? 'You won' : `${winner.slice(0, 6)}...${winner.slice(-4)} won`} ${formatEther(prize)} RON in the daily raffle!`,
            user: winner,
            amount: prize.toString()
          });
          
          onNotification({
            type: isCurrentUser ? 'success' : 'info',
            title: isCurrentUser ? '🎊 DAILY JACKPOT!' : '🎰 Daily Winner',
            message: `${isCurrentUser ? 'Amazing! You won' : `${winner.slice(0, 6)}...${winner.slice(-4)} won`} the daily raffle of ${formatEther(prize)} RON!`,
          });
          
          // Trigger platform stats refresh
          onCampaignUpdate();
        }
      });
    }, [address, onActivity, onNotification, onParticleEffect, onSound, onCampaignUpdate]),
  });

  // Campaign Raffle Requested Event
  useWatchContractEvent({
    address: CONTRACTS.PLEDGE_TO_CREATE,
    abi: PLEDGE_TO_CREATE_ABI,
    eventName: 'CampaignRaffleRequested',
    onLogs: useCallback((logs: any[]) => {
      logs.forEach((log: any) => {
        const { campaignId } = log.args;
        if (campaignId) {
          onParticleEffect('raffle');
          onSound('raffle');
          
          onActivity({
            type: 'raffle_request',
            message: `🎰 Campaign #${campaignId} raffle milestone reached! Drawing winner...`
          });
          
          onNotification({
            type: 'info',
            title: '🎰 Raffle Starting!',
            message: `Campaign #${campaignId} reached a raffle milestone! Winner will be drawn shortly.`,
          });
        }
      });
    }, [onActivity, onNotification, onParticleEffect, onSound]),
  });

  // Campaign Created Event
  useWatchContractEvent({
    address: CONTRACTS.PLEDGE_TO_CREATE,
    abi: PLEDGE_TO_CREATE_ABI,
    eventName: 'CampaignCreated',
    onLogs: useCallback((logs: any[]) => {
      logs.forEach((log: any) => {
        const { campaignId, creator, title, goal } = log.args;
        if (campaignId && creator && title && goal) {
          const isCurrentUser = creator === address;
          
          onActivity({
            type: 'campaign_created',
            message: `🚀 ${isCurrentUser ? 'You' : `${creator.slice(0, 6)}...${creator.slice(-4)}`} created "${title}" with goal ${formatEther(goal)} RON`
          });
          
          if (isCurrentUser) {
            onNotification({
              type: 'success',
              title: '🚀 Campaign Created!',
              message: `Your campaign "${title}" is now live and ready for pledges!`,
            });
          }
          
          // Trigger campaign list refresh
          onCampaignUpdate();
        }
      });
    }, [address, onActivity, onNotification, onCampaignUpdate]),
  });

  return null; // This component doesn't render anything
} 