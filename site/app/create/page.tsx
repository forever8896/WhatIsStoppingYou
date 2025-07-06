'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { TantoConnectButton } from '@sky-mavis/tanto-widget';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { saigon } from 'viem/chains';
import { CONTRACTS, PLEDGE_TO_CREATE_ABI } from '@/lib/contracts';

// Walrus API endpoints
const WALRUS_PUBLISHER = 'https://publisher.walrus-testnet.walrus.space';
const WALRUS_AGGREGATOR = 'https://aggregator.walrus-testnet.walrus.space';

export default function CreatePage() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    goal: '',
    imageUrl: ''
  });
  const [isCreating, setIsCreating] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedBlobId, setUploadedBlobId] = useState<string>('');
  const [uploadError, setUploadError] = useState<string>('');
  const [floatingEmojis, setFloatingEmojis] = useState<Array<{id: number, emoji: string, x: number, y: number}>>([]);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const router = useRouter();
  const { isConnected, address } = useAccount();
  
  const { data: hash, writeContract, error, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  // Generate floating emojis for casino effect
  useEffect(() => {
    const interval = setInterval(() => {
      const emojis = ['🎰', '💰', '🎲', '💎', '🎯', '🃏', '💫', '✨', '🎊', '🎉'];
      const newEmoji = {
        id: Date.now() + Math.random(),
        emoji: emojis[Math.floor(Math.random() * emojis.length)],
        x: Math.random() * 100,
        y: Math.random() * 100
      };
      setFloatingEmojis(prev => [...prev.slice(-8), newEmoji]);
    }, 2000);
    
    return () => clearInterval(interval);
  }, []);

  // Success animation effect
  useEffect(() => {
    if (isConfirmed) {
      setShowSuccessAnimation(true);
      setTimeout(() => {
        router.push('/');
      }, 3000);
    }
  }, [isConfirmed, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        setUploadError('File size must be less than 10MB');
        return;
      }
      
      // Check file type
      if (!file.type.startsWith('image/')) {
        setUploadError('Please select an image file');
        return;
      }
      
      setSelectedFile(file);
      setUploadError('');
      setUploadedBlobId('');
      setFormData(prev => ({ ...prev, imageUrl: '' }));
    }
  };

  const uploadToWalrus = async () => {
    if (!selectedFile) return;
    
    setIsUploadingImage(true);
    setUploadError('');
    
    try {
      const response = await fetch(`${WALRUS_PUBLISHER}/v1/blobs`, {
        method: 'PUT',
        body: selectedFile,
        headers: {
          'Content-Type': selectedFile.type,
        },
      });
      
      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('Walrus upload response:', result);
      
      // Extract blob ID from response
      let blobId = '';
      if (result.newlyCreated?.blobObject?.blobId) {
        blobId = result.newlyCreated.blobObject.blobId;
      } else if (result.alreadyCertified?.blobId) {
        blobId = result.alreadyCertified.blobId;
      }
      
      if (!blobId) {
        throw new Error('No blob ID found in response');
      }
      
      setUploadedBlobId(blobId);
      const imageUrl = `${WALRUS_AGGREGATOR}/v1/blobs/${blobId}`;
      console.log('Generated image URL:', imageUrl);
      
      // Test if the image is immediately available
      try {
        const testResponse = await fetch(imageUrl, { method: 'HEAD' });
        console.log('Image availability test:', testResponse.status);
      } catch (error) {
        console.warn('Image not immediately available, but this is normal for Walrus');
      }
      
      setFormData(prev => ({ ...prev, imageUrl }));
      
    } catch (error) {
      console.error('Error uploading to Walrus:', error);
      setUploadError(error instanceof Error ? error.message : 'Failed to upload image');
    } finally {
      setIsUploadingImage(false);
    }
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
      
      // Use placeholder image URL if no image uploaded
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
        chainId: saigon.id,
      });
      
    } catch (error) {
      console.error('Error creating campaign:', error);
      alert('Failed to create campaign. Please try again.');
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Floating Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Animated background gradients */}
        <motion.div
          className="absolute inset-0 opacity-10"
          animate={{
            background: [
              "radial-gradient(circle at 25% 25%, rgba(255, 215, 0, 0.2) 0%, transparent 50%)",
              "radial-gradient(circle at 75% 75%, rgba(255, 20, 147, 0.2) 0%, transparent 50%)",
              "radial-gradient(circle at 50% 50%, rgba(138, 43, 226, 0.2) 0%, transparent 50%)",
              "radial-gradient(circle at 25% 75%, rgba(0, 255, 127, 0.2) 0%, transparent 50%)",
              "radial-gradient(circle at 25% 25%, rgba(255, 215, 0, 0.2) 0%, transparent 50%)"
            ]
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        {/* Floating emojis */}
        <AnimatePresence>
          {floatingEmojis.map((item) => (
            <motion.div
              key={item.id}
              className="absolute text-3xl opacity-20 emoji-preserve"
              style={{
                left: `${item.x}%`,
                top: `${item.y}%`,
              }}
              initial={{ opacity: 0, scale: 0.5, rotate: -180 }}
              animate={{ opacity: 0.3, scale: 1, rotate: 0, y: -200 }}
              exit={{ opacity: 0, scale: 0.5, rotate: 180 }}
              transition={{ duration: 6, ease: "easeOut" }}
            >
              {item.emoji}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Success Animation Overlay */}
      <AnimatePresence>
        {showSuccessAnimation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center"
            >
              <motion.div
                className="text-8xl mb-6"
                animate={{ 
                  rotate: [0, 360],
                  scale: [1, 1.2, 1]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <span className="emoji-preserve">🎉</span>
              </motion.div>
              <motion.h1
                className="text-6xl font-bold bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500 bg-clip-text text-transparent mb-4"
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                CAMPAIGN LIVE!
              </motion.h1>
              <motion.p
                className="text-xl text-white/80"
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1 }}
              >
                Your dream is now ready for supporters!
              </motion.p>
              <motion.div
                className="flex justify-center gap-4 mt-6 text-4xl"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
              >
                {['🎰', '💰', '🎲', '💎', '🎯'].map((emoji, i) => (
                  <motion.span
                    key={i}
                    className="emoji-preserve"
                    animate={{
                      y: [0, -20, 0],
                      rotate: [0, 360],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay: i * 0.2
                    }}
                  >
                    {emoji}
                  </motion.span>
                ))}
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-40 p-6 bg-black/50 backdrop-blur-sm">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <motion.div
            className="text-2xl font-bold text-white cursor-pointer relative"
            onClick={() => router.push('/')}
            whileHover={{ scale: 1.05 }}
            style={{
              fontFamily: 'system-ui, -apple-system, sans-serif',
              fontWeight: 900,
            }}
          >
            <span className="relative z-10">WhatsStoppingYou</span>
            <motion.div
              className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg opacity-20 blur"
              animate={{
                opacity: [0.2, 0.4, 0.2],
                scale: [1, 1.05, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
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
      <div className="pt-24 pb-12 relative z-10">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.h1
              className="text-6xl md:text-8xl font-black mb-4 bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500 bg-clip-text text-transparent"
              style={{
                fontFamily: 'system-ui, -apple-system, sans-serif',
                fontWeight: 900,
              }}
              animate={{
                textShadow: [
                  '0 0 20px rgba(255,215,0,0.3)',
                  '0 0 40px rgba(255,20,147,0.4)',
                  '0 0 20px rgba(255,215,0,0.3)'
                ]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              CREATE YOUR DREAM
            </motion.h1>
            <motion.p
              className="text-xl text-white/70 mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              Launch your campaign and let the community make it happen
            </motion.p>
            <motion.div
              className="flex justify-center gap-4 text-3xl"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
              {['🎰', '💰', '🎲'].map((emoji, i) => (
                <motion.span
                  key={i}
                  className="emoji-preserve"
                  animate={{
                    y: [0, -10, 0],
                    rotate: [0, 10, -10, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.3
                  }}
                >
                  {emoji}
                </motion.span>
              ))}
            </motion.div>
          </motion.div>

          {/* Transaction Status */}
          {isConfirmed && (
            <motion.div
              className="text-center mb-12"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="bg-gradient-to-r from-green-900/20 to-emerald-900/20 border border-green-500/20 rounded-2xl p-6 backdrop-blur-sm">
                <div className="text-green-400 text-2xl font-bold mb-2 flex items-center justify-center gap-3">
                  <motion.span
                    className="emoji-preserve"
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    🎉
                  </motion.span>
                  Campaign Created Successfully!
                  <motion.span
                    className="emoji-preserve"
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                  >
                    🎊
                  </motion.span>
                </div>
                <div className="text-white/70 text-sm">
                  Get ready for the magic to begin...
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
              <div className="bg-red-900/20 border border-red-500/20 rounded-2xl p-6 backdrop-blur-sm">
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
              <motion.div
                className="bg-gradient-to-r from-green-900/20 to-emerald-900/20 border border-green-500/20 rounded-2xl p-6 backdrop-blur-sm"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.3 }}
              >
                <div className="text-green-400 text-xl font-semibold mb-2 flex items-center justify-center gap-2">
                  <motion.span
                    className="emoji-preserve"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    ✅
                  </motion.span>
                  Wallet Connected
                </div>
                <div className="text-white/70 text-sm">
                  {address && `${address.slice(0, 6)}...${address.slice(-4)}`}
                </div>
                <div className="text-white/50 text-xs mt-2">
                  Connected to Saigon Testnet
                </div>
              </motion.div>
            ) : (
              <motion.div
                className="bg-gradient-to-r from-yellow-900/20 to-orange-900/20 border border-yellow-500/20 rounded-2xl p-6 backdrop-blur-sm"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.3 }}
              >
                <div className="text-yellow-400 text-xl font-semibold mb-2 flex items-center justify-center gap-2">
                  <motion.span
                    className="emoji-preserve"
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    ⚠️
                  </motion.span>
                  Connect Your Wallet
                </div>
                <div className="text-white/70 text-sm mb-4">
                  You need to connect your Ronin wallet to create a campaign
                </div>
                <TantoConnectButton />
              </motion.div>
            )}
          </motion.div>

          {/* Campaign Creation Form */}
          <motion.div
            className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm rounded-3xl border border-white/10 p-8 shadow-2xl"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Campaign Title */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
              >
                <label className="block text-xl font-semibold mb-4 text-white flex items-center gap-2">
                  <span className="emoji-preserve">🎯</span>
                  Campaign Title
                </label>
                <motion.input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="What's your dream project?"
                  className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-white/50 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300"
                  required
                  disabled={isPending || isConfirming}
                  whileFocus={{ scale: 1.02 }}
                />
              </motion.div>

              {/* Campaign Description */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6, duration: 0.6 }}
              >
                <label className="block text-xl font-semibold mb-4 text-white flex items-center gap-2">
                  <span className="emoji-preserve">📝</span>
                  Description
                </label>
                <motion.textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Tell your story. What are you building? Why does it matter? Make it compelling!"
                  rows={6}
                  className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-white/50 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300 resize-none"
                  required
                  disabled={isPending || isConfirming}
                  whileFocus={{ scale: 1.02 }}
                />
              </motion.div>

              {/* Funding Goal */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7, duration: 0.6 }}
              >
                <label className="block text-xl font-semibold mb-4 text-white flex items-center gap-2">
                  <span className="emoji-preserve">💰</span>
                  Funding Goal (RON)
                </label>
                <motion.input
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
                  whileFocus={{ scale: 1.02 }}
                />
                <div className="mt-4 p-4 bg-gradient-to-r from-purple-900/20 to-pink-900/20 border border-purple-500/20 rounded-xl">
                  <div className="text-white/70 text-sm mb-2">
                    🎰 <strong>Casino Mechanics:</strong> Platform fee: 5% will be deducted for revenue sharing and raffles
                  </div>
                  <div className="text-white/60 text-xs">
                    💡 <strong>Raffle System:</strong> Every 10% of goal progress triggers a raffle with 40% of fees going to campaign prizes
                  </div>
                </div>
              </motion.div>

              {/* Campaign Image Upload */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8, duration: 0.6 }}
              >
                <label className="block text-xl font-semibold mb-4 text-white flex items-center gap-2">
                  <span className="emoji-preserve">🖼️</span>
                  Campaign Image
                </label>
                
                {/* File Input */}
                <div className="space-y-4">
                  <motion.input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-2xl text-white file:bg-gradient-to-r file:from-purple-600 file:to-pink-600 file:border-0 file:rounded-lg file:px-4 file:py-2 file:text-white file:font-semibold file:mr-4 hover:file:from-purple-700 hover:file:to-pink-700 transition-all duration-300"
                    disabled={isPending || isConfirming || isUploadingImage}
                    whileFocus={{ scale: 1.02 }}
                  />
                  
                  {/* Upload Button */}
                  {selectedFile && !uploadedBlobId && (
                    <motion.button
                      type="button"
                      onClick={uploadToWalrus}
                      disabled={isUploadingImage || isPending || isConfirming}
                      className="w-full py-3 px-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl font-semibold text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-xl transition-all duration-300"
                      whileHover={{ scale: isUploadingImage ? 1 : 1.02 }}
                      whileTap={{ scale: isUploadingImage ? 1 : 0.98 }}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      {isUploadingImage ? (
                        <div className="flex items-center justify-center gap-3">
                          <motion.div
                            className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          />
                          Uploading to Walrus...
                        </div>
                      ) : (
                        '🚀 Upload Image to Walrus'
                      )}
                    </motion.button>
                  )}
                  
                  {/* Upload Success */}
                  {uploadedBlobId && (
                    <motion.div
                      className="bg-gradient-to-r from-green-900/20 to-emerald-900/20 border border-green-500/20 rounded-2xl p-4"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5 }}
                    >
                      <div className="text-green-400 font-semibold mb-2 flex items-center gap-2">
                        <motion.span
                          className="emoji-preserve"
                          animate={{ rotate: [0, 360] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          ✅
                        </motion.span>
                        Image uploaded successfully!
                      </div>
                      <div className="text-white/70 text-sm">
                        Blob ID: {uploadedBlobId}
                      </div>
                      <div className="text-white/50 text-xs mt-2">
                        Stored on Walrus decentralized storage
                      </div>
                    </motion.div>
                  )}
                  
                  {/* Upload Error */}
                  {uploadError && (
                    <motion.div
                      className="bg-red-900/20 border border-red-500/20 rounded-2xl p-4"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5 }}
                    >
                      <div className="text-red-400 font-semibold mb-2">
                        ❌ Upload failed
                      </div>
                      <div className="text-white/70 text-sm">
                        {uploadError}
                      </div>
                    </motion.div>
                  )}
                  
                  {/* Image Preview */}
                  {formData.imageUrl && (
                    <motion.div
                      className="bg-white/5 rounded-2xl p-4 border border-white/10"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      <div className="text-white/70 text-sm mb-2">Preview:</div>
                      <div className="space-y-2">
                        <div className="relative">
                          <img
                            src={formData.imageUrl}
                            alt="Campaign preview"
                            className="w-full h-48 object-contain rounded-lg bg-white/10"
                            onError={(e) => {
                              console.error('Image failed to load:', formData.imageUrl);
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              // Show fallback message
                              const fallback = target.nextElementSibling as HTMLElement;
                              if (fallback) fallback.style.display = 'flex';
                            }}
                            onLoad={() => {
                              console.log('Image loaded successfully:', formData.imageUrl);
                            }}
                          />
                          <div 
                            className="hidden w-full h-48 bg-white/10 rounded-lg items-center justify-center text-white/50 text-center p-4"
                            style={{ display: 'none' }}
                          >
                            <div>
                              <div className="text-yellow-400 mb-2">⏳ Image may take a moment to load</div>
                              <div className="text-sm">Walrus images sometimes need time to propagate across the network</div>
                              <button 
                                onClick={() => window.location.reload()} 
                                className="mt-2 px-4 py-2 bg-purple-600 rounded-lg text-white text-sm hover:bg-purple-700"
                              >
                                Refresh Page
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="text-white/50 text-xs">
                          Image URL: <a href={formData.imageUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline break-all">{formData.imageUrl}</a>
                        </div>
                        <div className="text-white/50 text-xs">
                          Blob ID: {uploadedBlobId}
                        </div>
                        <div className="text-white/40 text-xs">
                          💡 Tip: If image doesn't load immediately, try refreshing the page or opening the URL directly
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
                
                <div className="text-white/50 text-sm mt-2">
                  Upload an image to represent your campaign. Max file size: 10MB
                </div>
              </motion.div>

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={!isConnected || isPending || isConfirming || isConfirmed}
                className="w-full py-6 px-8 bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 rounded-2xl font-bold text-xl text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-xl transition-all duration-300 relative overflow-hidden"
                whileHover={{ scale: !isConnected || isPending || isConfirming ? 1 : 1.02 }}
                whileTap={{ scale: !isConnected || isPending || isConfirming ? 1 : 0.98 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9, duration: 0.6 }}
              >
                <span className="relative z-10">
                  {isPending ? (
                    <div className="flex items-center justify-center gap-3">
                      <motion.div
                        className="w-6 h-6 border-2 border-white border-t-transparent rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                      Confirming Transaction...
                    </div>
                  ) : isConfirming ? (
                    <div className="flex items-center justify-center gap-3">
                      <motion.div
                        className="w-6 h-6 border-2 border-white border-t-transparent rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                      Creating Campaign...
                    </div>
                  ) : isConfirmed ? (
                    <div className="flex items-center justify-center gap-3">
                      <motion.span
                        className="emoji-preserve"
                        animate={{ rotate: [0, 360] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        ✅
                      </motion.span>
                      Campaign Created!
                    </div>
                  ) : !isConnected ? (
                    'Connect Wallet to Create Campaign'
                  ) : (
                    <div className="flex items-center justify-center gap-3">
                      <span className="emoji-preserve">🚀</span>
                      Launch Your Dream
                      <span className="emoji-preserve">🎯</span>
                    </div>
                  )}
                </span>
                
                {/* Animated background */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500 opacity-0"
                  whileHover={{ opacity: 0.2 }}
                  transition={{ duration: 0.3 }}
                />
              </motion.button>

              {/* Transaction Hash */}
              {hash && (
                <motion.div
                  className="text-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="text-white/70 text-sm mb-2">Transaction Hash:</div>
                  <a
                    href={`https://saigon-app.roninchain.com/tx/${hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-400 hover:text-purple-300 text-sm break-all underline"
                  >
                    {hash}
                  </a>
                </motion.div>
              )}
            </form>
          </motion.div>

          {/* Enhanced Info Section */}
          <motion.div
            className="mt-12 bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm rounded-3xl border border-white/10 p-8 shadow-2xl"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            <h2 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-yellow-400 to-pink-500 bg-clip-text text-transparent">
              <span className="emoji-preserve">🎰</span> How The Casino Magic Works
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  icon: '🚀',
                  title: 'Launch & Go Live',
                  desc: 'Create your campaign instantly. No deadlines, no waiting periods. Your dream goes live immediately!'
                },
                {
                  icon: '💎',
                  title: 'Earn Soulbound NFTs',
                  desc: 'Supporters get permanent proof of their belief in your project. These NFTs can never be transferred or sold.'
                },
                {
                  icon: '🎰',
                  title: 'Automatic Raffles',
                  desc: 'Every 10% of goal progress triggers exciting raffles. Winners get real RON prizes automatically!'
                }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  className="text-center p-6 bg-gradient-to-br from-white/5 to-white/10 rounded-2xl border border-white/10 hover:border-white/20 transition-all duration-300"
                  whileHover={{ scale: 1.05, y: -5 }}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + index * 0.1, duration: 0.6 }}
                >
                  <motion.div
                    className="text-4xl mb-4"
                    animate={{
                      rotate: [0, 10, -10, 0],
                      scale: [1, 1.1, 1],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      delay: index * 0.5
                    }}
                  >
                    <span className="emoji-preserve">{item.icon}</span>
                  </motion.div>
                  <h3 className="text-xl font-semibold mb-2 text-white">{item.title}</h3>
                  <p className="text-white/70">{item.desc}</p>
                </motion.div>
              ))}
            </div>
            
            {/* Enhanced Raffle System Details */}
            <motion.div
              className="mt-8 p-6 bg-gradient-to-br from-purple-900/20 to-pink-900/20 border border-purple-500/20 rounded-2xl"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1, duration: 0.6 }}
            >
              <h3 className="text-xl font-semibold text-purple-400 mb-4 text-center flex items-center justify-center gap-2">
                <motion.span
                  className="emoji-preserve"
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  🎰
                </motion.span>
                Casino Raffle System
                <motion.span
                  className="emoji-preserve"
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 3, repeat: Infinity, delay: 1.5 }}
                >
                  🎲
                </motion.span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="bg-white/5 p-4 rounded-xl">
                  <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                    <span className="emoji-preserve">🎯</span>
                    Campaign Raffles
                  </h4>
                  <ul className="text-white/70 space-y-1">
                    <li>• 🎰 Trigger every 10% of goal progress</li>
                    <li>• 💰 40% of platform fees go to prizes</li>
                    <li>• ⚖️ Winners selected by pledge amount weight</li>
                    <li>• 🚀 Automatic prize distribution via VRF</li>
                  </ul>
                </div>
                <div className="bg-white/5 p-4 rounded-xl">
                  <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                    <span className="emoji-preserve">🌟</span>
                    Daily Raffles
                  </h4>
                  <ul className="text-white/70 space-y-1">
                    <li>• 🎲 Run daily with 30% of platform fees</li>
                    <li>• 🌍 Open to all platform users</li>
                    <li>• 📊 Weighted by total pledged amount</li>
                    <li>• 🎁 Additional rewards for community</li>
                  </ul>
                </div>
              </div>
              <div className="mt-4 text-center text-white/60 text-xs">
                <motion.div
                  animate={{ opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  ✨ Powered by Ronin VRF for provably fair randomness ✨
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
} 