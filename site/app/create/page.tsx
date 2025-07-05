'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
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
                  Platform fee: 5% will be deducted for revenue sharing and raffles
                </div>
                <div className="text-white/40 text-xs mt-1">
                  💡 Raffles trigger every 10% of goal progress, with 40% of fees going to campaign prizes
                </div>
              </div>

              {/* Campaign Image Upload */}
              <div>
                <label className="block text-xl font-semibold mb-4">
                  Campaign Image
                </label>
                
                {/* File Input */}
                <div className="space-y-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-2xl text-white file:bg-purple-600 file:border-0 file:rounded-lg file:px-4 file:py-2 file:text-white file:font-semibold file:mr-4 hover:file:bg-purple-700 transition-all duration-300"
                    disabled={isPending || isConfirming || isUploadingImage}
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
                    >
                      {isUploadingImage ? (
                        <div className="flex items-center justify-center gap-3">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Uploading to Walrus...
                        </div>
                      ) : (
                        'Upload Image to Walrus'
                      )}
                    </motion.button>
                  )}
                  
                  {/* Upload Success */}
                  {uploadedBlobId && (
                    <div className="bg-green-900/20 border border-green-500/20 rounded-2xl p-4">
                      <div className="text-green-400 font-semibold mb-2">
                        ✅ Image uploaded successfully!
                      </div>
                      <div className="text-white/70 text-sm">
                        Blob ID: {uploadedBlobId}
                      </div>
                      <div className="text-white/50 text-xs mt-2">
                        Stored on Walrus decentralized storage
                      </div>
                    </div>
                  )}
                  
                  {/* Upload Error */}
                  {uploadError && (
                    <div className="bg-red-900/20 border border-red-500/20 rounded-2xl p-4">
                      <div className="text-red-400 font-semibold mb-2">
                        ❌ Upload failed
                      </div>
                      <div className="text-white/70 text-sm">
                        {uploadError}
                      </div>
                    </div>
                  )}
                  
                  {/* Image Preview */}
                  {formData.imageUrl && (
                    <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
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
                    </div>
                  )}
                </div>
                
                <div className="text-white/50 text-sm mt-2">
                  Upload an image to represent your campaign. Max file size: 10MB
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
                  icon: '🎰',
                  title: 'Raffle Rewards',
                  desc: 'Raffles trigger every 10% of goal progress, with prizes for supporters.'
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
            
            {/* Raffle System Details */}
            <div className="mt-8 p-6 bg-purple-900/10 border border-purple-500/20 rounded-2xl">
              <h3 className="text-xl font-semibold text-purple-400 mb-4 text-center">🎰 Raffle System</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-semibold text-white mb-2">Campaign Raffles</h4>
                  <ul className="text-white/70 space-y-1">
                    <li>• Trigger every 10% of goal progress</li>
                    <li>• 40% of platform fees go to prizes</li>
                    <li>• Winners selected by pledge amount weight</li>
                    <li>• Automatic prize distribution</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-2">Daily Raffles</h4>
                  <ul className="text-white/70 space-y-1">
                    <li>• Run daily with 30% of platform fees</li>
                    <li>• Open to all platform users</li>
                    <li>• Weighted by total pledged amount</li>
                    <li>• Additional rewards for community</li>
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
} 