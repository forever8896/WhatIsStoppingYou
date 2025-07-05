'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { TantoConnectButton } from '@sky-mavis/tanto-widget';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { CONTRACTS, PLEDGE_TO_CREATE_ABI } from '@/lib/contracts';

export default function CreatePage() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    goal: '',
    imageUrl: ''
  });
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();
  const { isConnected, address } = useAccount();
  
  const { data: hash, writeContract, error, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    try {
      setIsCreating(true);
      
      // Convert goal to wei (RON has 18 decimals)
      const goalInWei = parseEther(formData.goal);
      
      // Use placeholder image URL if not provided
      const imageUrl = formData.imageUrl || 'https://via.placeholder.com/400x300?text=Campaign+Image';
      
      writeContract({
        address: CONTRACTS.PLEDGE_TO_CREATE,
        abi: PLEDGE_TO_CREATE_ABI,
        functionName: 'createCampaign',
        args: [
          formData.title,
          formData.description,
          imageUrl,
          goalInWei
        ],
      });
      
    } catch (error) {
      console.error('Error creating campaign:', error);
      alert('Failed to create campaign. Please try again.');
      setIsCreating(false);
    }
  };

  // Handle successful transaction
  if (isConfirmed) {
    setTimeout(() => {
      router.push('/');
    }, 2000);
  }

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
              onClick={() => router.push('/why')}
              className="text-lg font-semibold text-white/80 hover:text-white transition-colors duration-300"
              whileHover={{ scale: 1.05 }}
            >
              WHY
            </motion.button>
            <motion.button
              onClick={() => router.push('/help')}
              className="text-lg font-semibold text-white/80 hover:text-white transition-colors duration-300"
              whileHover={{ scale: 1.05 }}
            >
              HELP
            </motion.button>
            <TantoConnectButton />
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="pt-24 pb-12">
        <div className="max-w-4xl mx-auto px-6">
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
            CREATE
          </motion.h1>

          {/* Transaction Status */}
          {isConfirmed && (
            <motion.div
              className="text-center mb-12"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="bg-green-900/20 border border-green-500/20 rounded-2xl p-6">
                <div className="text-green-400 text-xl font-semibold mb-2">
                  🎉 Campaign Created Successfully!
                </div>
                <div className="text-white/70 text-sm">
                  Redirecting to homepage...
                </div>
              </div>
            </motion.div>
          )}

          {/* Error Display */}
          {error && (
            <motion.div
              className="text-center mb-12"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="bg-red-900/20 border border-red-500/20 rounded-2xl p-6">
                <div className="text-red-400 text-xl font-semibold mb-2">
                  ❌ Transaction Failed
                </div>
                <div className="text-white/70 text-sm">
                  {error.message}
                </div>
              </div>
            </motion.div>
          )}

          {/* Wallet Connection Status */}
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            {isConnected ? (
              <div className="bg-green-900/20 border border-green-500/20 rounded-2xl p-6">
                <div className="text-green-400 text-xl font-semibold mb-2">
                  ✅ Wallet Connected
                </div>
                <div className="text-white/70 text-sm">
                  {address && `${address.slice(0, 6)}...${address.slice(-4)}`}
                </div>
                <div className="text-white/50 text-xs mt-2">
                  Connected to Saigon Testnet
                </div>
              </div>
            ) : (
              <div className="bg-yellow-900/20 border border-yellow-500/20 rounded-2xl p-6">
                <div className="text-yellow-400 text-xl font-semibold mb-2">
                  ⚠️ Connect Your Wallet
                </div>
                <div className="text-white/70 text-sm mb-4">
                  You need to connect your Ronin wallet to create a campaign
                </div>
                <TantoConnectButton />
              </div>
            )}
          </motion.div>

          {/* Campaign Creation Form */}
          <motion.div
            className="bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 p-8"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Campaign Title */}
              <div>
                <label className="block text-xl font-semibold mb-4">
                  Campaign Title
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="What's your dream project?"
                  className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-white/50 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300"
                  required
                  disabled={isPending || isConfirming}
                />
              </div>

              {/* Campaign Description */}
              <div>
                <label className="block text-xl font-semibold mb-4">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Tell your story. What are you building? Why does it matter?"
                  rows={6}
                  className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-white/50 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300 resize-none"
                  required
                  disabled={isPending || isConfirming}
                />
              </div>

              {/* Funding Goal */}
              <div>
                <label className="block text-xl font-semibold mb-4">
                  Funding Goal (RON)
                </label>
                <input
                  type="number"
                  name="goal"
                  value={formData.goal}
                  onChange={handleInputChange}
                  placeholder="How much RON do you need?"
                  step="0.01"
                  min="0"
                  className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-white/50 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300"
                  required
                  disabled={isPending || isConfirming}
                />
                <div className="text-white/50 text-sm mt-2">
                  Platform fee: 5% will be deducted for revenue sharing
                </div>
              </div>

              {/* Campaign Image URL */}
              <div>
                <label className="block text-xl font-semibold mb-4">
                  Campaign Image URL (Optional)
                </label>
                <input
                  type="url"
                  name="imageUrl"
                  value={formData.imageUrl}
                  onChange={handleInputChange}
                  placeholder="https://example.com/your-image.jpg"
                  className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-white/50 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300"
                  disabled={isPending || isConfirming}
                />
                <div className="text-white/50 text-sm mt-2">
                  Leave empty to use a placeholder image
                </div>
              </div>

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={!isConnected || isPending || isConfirming || isConfirmed}
                className="w-full py-6 px-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl font-bold text-xl text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-xl transition-all duration-300"
                whileHover={{ scale: !isConnected || isPending || isConfirming ? 1 : 1.02 }}
                whileTap={{ scale: !isConnected || isPending || isConfirming ? 1 : 0.98 }}
              >
                {isPending ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Confirming Transaction...
                  </div>
                ) : isConfirming ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Creating Campaign...
                  </div>
                ) : isConfirmed ? (
                  '✅ Campaign Created!'
                ) : !isConnected ? (
                  'Connect Wallet to Create Campaign'
                ) : (
                  'Create Campaign'
                )}
              </motion.button>

              {/* Transaction Hash */}
              {hash && (
                <div className="text-center">
                  <div className="text-white/70 text-sm mb-2">Transaction Hash:</div>
                  <a
                    href={`https://saigon-app.roninchain.com/tx/${hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-400 hover:text-purple-300 text-sm break-all underline"
                  >
                    {hash}
                  </a>
                </div>
              )}
            </form>
          </motion.div>

          {/* Info Section */}
          <motion.div
            className="mt-12 bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 p-8"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            <h2 className="text-3xl font-bold mb-6 text-center">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  icon: '🚀',
                  title: 'Create & Launch',
                  desc: 'Set your goal and launch immediately. No deadlines, no stress.'
                },
                {
                  icon: '💎',
                  title: 'Earn Soulbound NFTs',
                  desc: 'Supporters get permanent proof of their belief in your project.'
                },
                {
                  icon: '💰',
                  title: 'Share Revenue',
                  desc: 'Platform earnings are distributed to all pledgers weekly.'
                }
              ].map((item, index) => (
                <div
                  key={index}
                  className="text-center p-6 bg-white/5 rounded-2xl border border-white/10"
                >
                  <div className="text-4xl mb-4">{item.icon}</div>
                  <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                  <p className="text-white/70">{item.desc}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
} 