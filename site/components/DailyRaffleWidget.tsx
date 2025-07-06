'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { formatEther } from 'viem';
import { saigon } from 'viem/chains';
import { CONTRACTS, PLEDGE_TO_CREATE_ABI } from '@/lib/contracts';
import { TantoConnectButton } from '@sky-mavis/tanto-widget';

interface DailyRaffleWidgetProps {
  onDrawSuccess?: () => void;
}

export default function DailyRaffleWidget({ onDrawSuccess }: DailyRaffleWidgetProps) {
  const [timeUntilNext, setTimeUntilNext] = useState(0);
  const [canDraw, setCanDraw] = useState(false);
  const { isConnected } = useAccount();

  const { data: drawHash, writeContract: drawRaffle, isPending: isDrawing } = useWriteContract();
  const { isLoading: isConfirmingDraw, isSuccess: isDrawConfirmed } = useWaitForTransactionReceipt({
    hash: drawHash,
  });

  // Get daily raffle pool amount
  const { data: poolAmount, refetch: refetchPool } = useReadContract({
    address: CONTRACTS.PLEDGE_TO_CREATE,
    abi: PLEDGE_TO_CREATE_ABI,
    functionName: 'dailyRafflePool',
    chainId: saigon.id,
  });

  // Handle successful draw
  useEffect(() => {
    if (isDrawConfirmed) {
      refetchPool();
      onDrawSuccess?.();
    }
  }, [isDrawConfirmed, onDrawSuccess, refetchPool]);

  // Calculate time until next draw (every 24 hours)
  useEffect(() => {
    const updateCountdown = () => {
      const now = Date.now();
      const currentDay = Math.floor(now / 1000 / 86400);
      const nextDrawTime = (currentDay + 1) * 86400 * 1000;
      const timeLeft = nextDrawTime - now;
      
      setTimeUntilNext(Math.max(0, timeLeft));
      
      // Can draw if it's been 24 hours since last draw and there's a pool
      const timeSinceLastDraw = now - (currentDay * 86400 * 1000);
      const hasPoolAmount = poolAmount !== undefined && Number(poolAmount) > 0;
      setCanDraw(timeSinceLastDraw >= 86400000 && hasPoolAmount);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [poolAmount]);

  const handleDrawRaffle = async () => {
    if (!isConnected) return;
    
    drawRaffle({
      address: CONTRACTS.PLEDGE_TO_CREATE,
      abi: PLEDGE_TO_CREATE_ABI,
      functionName: 'drawDailyRaffle',
      chainId: saigon.id,
    });
  };

  const formatTime = (milliseconds: number) => {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const safeFormatEther = (value: bigint | undefined) => {
    try {
      return formatEther(value || BigInt('0'));
    } catch {
      return '0';
    }
  };

  const poolAmountFormatted = safeFormatEther(poolAmount);
  const hasPool = poolAmount && Number(poolAmount) > 0;

  return (
    <motion.div
      className="bg-gradient-to-br from-yellow-900/30 to-orange-900/30 backdrop-blur-sm rounded-2xl border border-yellow-500/20 p-6 mb-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <span className="text-3xl">🎰</span>
          <h2 className="text-2xl font-bold text-yellow-400">Daily Raffle</h2>
        </div>
        
        <div className="mb-6">
          <div className="text-4xl font-bold text-white mb-2">
            {poolAmountFormatted} RON
          </div>
          <div className="text-yellow-300 text-sm">
            Prize Pool from Platform Fees (5%)
          </div>
        </div>

        {hasPool ? (
          <div className="space-y-4">
            {canDraw ? (
              <div className="space-y-3">
                <div className="text-green-400 font-semibold">
                  ✅ Ready to Draw!
                </div>
                {isConnected ? (
                  <motion.button
                    onClick={handleDrawRaffle}
                    disabled={isDrawing || isConfirmingDraw}
                    className="w-full py-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:from-yellow-600 hover:to-orange-600 transition-all shadow-lg"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isDrawing || isConfirmingDraw ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        {isDrawing ? 'Drawing...' : 'Confirming...'}
                      </div>
                    ) : (
                      '🎲 Draw Daily Raffle'
                    )}
                  </motion.button>
                ) : (
                  <TantoConnectButton />
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-orange-400 font-semibold">
                  ⏳ Next Draw Available In:
                </div>
                <div className="text-3xl font-mono text-white bg-black/30 rounded-lg py-3 px-4">
                  {formatTime(timeUntilNext)}
                </div>
                <div className="text-sm text-gray-400">
                  Anyone can trigger the draw once 24 hours have passed
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-gray-400 text-center py-8">
            <div className="text-6xl mb-4">🎱</div>
            <div className="text-lg font-semibold mb-2">No Prize Pool Yet</div>
            <div className="text-sm">
              The daily raffle pool grows from 5% of all pledges.<br />
              Start pledging to campaigns to build the prize!
            </div>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-yellow-500/20">
          <div className="text-xs text-yellow-200/80 space-y-1">
            <div>💡 <strong>How it works:</strong></div>
            <div>• 5% of all pledges go to the daily raffle pool</div>
            <div>• Every 24 hours, anyone can trigger the draw</div>
            <div>• Random pledger from the last 24 hours wins the entire pool</div>
            <div>• Higher pledge amounts = higher chance to win</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
} 