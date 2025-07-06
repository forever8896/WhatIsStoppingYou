'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatEther, parseEther, parseUnits, Address } from 'viem';
import { CONTRACTS, PLEDGE_TO_CREATE_ABI } from '@/lib/contracts';
import { TantoConnectButton } from '@sky-mavis/tanto-widget';
import { useSounds } from '@/hooks/useSounds';
import Image from 'next/image';

interface PrizeSponsorModalProps {
  campaignId: number;
  onClose: () => void;
  onSuccess: () => void;
}

type PrizeType = 'ERC20' | 'ERC721';

interface NFTMetadata {
  tokenId: string;
  image?: string;
  name?: string;
  description?: string;
}

const ERC20_ABI = [
  {
    "inputs": [{"internalType": "address", "name": "spender", "type": "address"}, {"internalType": "uint256", "name": "amount", "type": "uint256"}],
    "name": "approve",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "decimals",
    "outputs": [{"internalType": "uint8", "name": "", "type": "uint8"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "name",
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "symbol",
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  }
];

const ERC721_ABI = [
  {
    "inputs": [{"internalType": "address", "name": "to", "type": "address"}, {"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
    "name": "approve",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "owner", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
    "name": "ownerOf",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "owner", "type": "address"}, {"internalType": "uint256", "name": "index", "type": "uint256"}],
    "name": "tokenOfOwnerByIndex",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
    "name": "tokenURI",
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "name",
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  }
];

export default function PrizeSponsorModal({ campaignId, onClose, onSuccess }: PrizeSponsorModalProps) {
  const [prizeType, setPrizeType] = useState<PrizeType>('ERC20');
  const [tokenContract, setTokenContract] = useState('');
  const [selectedTokenId, setSelectedTokenId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [step, setStep] = useState<'form' | 'approve' | 'deposit'>('form');
  const [isValidatingContract, setIsValidatingContract] = useState(false);
  const [contractValid, setContractValid] = useState(false);
  const [tokenBalance, setTokenBalance] = useState('0');
  const [tokenDecimals, setTokenDecimals] = useState(18);
  const [tokenName, setTokenName] = useState('');
  const [tokenSymbol, setTokenSymbol] = useState('');
  const [userNFTs, setUserNFTs] = useState<NFTMetadata[]>([]);
  const [isLoadingNFTs, setIsLoadingNFTs] = useState(false);
  const [nftBalance, setNftBalance] = useState(0);

  const { isConnected, address } = useAccount();
  const { playSound, preloadSounds } = useSounds();
  
  const { data: approveHash, writeContract: writeApprove, isPending: isApproving } = useWriteContract();
  const { data: depositHash, writeContract: writeDeposit, isPending: isDepositing } = useWriteContract();
  
  const { isLoading: isConfirmingApprove, isSuccess: isApproveConfirmed } = useWaitForTransactionReceipt({
    hash: approveHash,
  });
  
  const { isLoading: isConfirmingDeposit, isSuccess: isDepositConfirmed } = useWaitForTransactionReceipt({
    hash: depositHash,
  });

  // Check token balance for ERC20
  const { data: erc20Balance } = useReadContract({
    address: tokenContract as Address,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [address!],
    chainId: saigon.id,
    query: { enabled: !!tokenContract && !!address && prizeType === 'ERC20' && contractValid }
  });

  // Check token details for ERC20
  const { data: erc20Decimals } = useReadContract({
    address: tokenContract as Address,
    abi: ERC20_ABI,
    functionName: 'decimals',
    chainId: saigon.id,
    query: { enabled: !!tokenContract && prizeType === 'ERC20' && contractValid }
  });

  const { data: erc20Name } = useReadContract({
    address: tokenContract as Address,
    abi: ERC20_ABI,
    functionName: 'name',
    chainId: saigon.id,
    query: { enabled: !!tokenContract && prizeType === 'ERC20' && contractValid }
  });

  const { data: erc20Symbol } = useReadContract({
    address: tokenContract as Address,
    abi: ERC20_ABI,
    functionName: 'symbol',
    chainId: saigon.id,
    query: { enabled: !!tokenContract && prizeType === 'ERC20' && contractValid }
  });

  // Check NFT balance for ERC721
  const { data: erc721Balance } = useReadContract({
    address: tokenContract as Address,
    abi: ERC721_ABI,
    functionName: 'balanceOf',
    args: [address!],
    chainId: saigon.id,
    query: { enabled: !!tokenContract && !!address && prizeType === 'ERC721' && contractValid }
  });

  const { data: erc721Name } = useReadContract({
    address: tokenContract as Address,
    abi: ERC721_ABI,
    functionName: 'name',
    chainId: saigon.id,
    query: { enabled: !!tokenContract && prizeType === 'ERC721' && contractValid }
  });

  // Update token data
  useEffect(() => {
    if (prizeType === 'ERC20') {
      setTokenBalance(erc20Balance?.toString() || '0');
      setTokenDecimals(Number(erc20Decimals) || 18);
      setTokenName(erc20Name?.toString() || '');
      setTokenSymbol(erc20Symbol?.toString() || '');
    } else if (prizeType === 'ERC721') {
      setNftBalance(Number(erc721Balance) || 0);
      setTokenName(erc721Name?.toString() || '');
    }
  }, [erc20Balance, erc20Decimals, erc20Name, erc20Symbol, erc721Balance, erc721Name, prizeType]);

  const loadUserNFTs = useCallback(async () => {
    if (!address || !tokenContract || prizeType !== 'ERC721') return;
    
    setIsLoadingNFTs(true);
    try {
      const nfts: NFTMetadata[] = [];
      const balance = nftBalance;
      
      // Load up to 20 NFTs to avoid overwhelming the UI
      const maxNFTs = Math.min(balance, 20);
      
      for (let i = 0; i < maxNFTs; i++) {
        try {
          // Get token ID by index
          const tokenIdResult = await publicClient.readContract({
            address: tokenContract as Address,
            abi: ERC721_ABI,
            functionName: 'tokenOfOwnerByIndex',
            args: [address, BigInt(i)],
          });
          
          const tokenId = tokenIdResult?.toString() || '0';

          // Get token URI
          let metadata: NFTMetadata = {
            tokenId: tokenId,
            name: `Token #${tokenId}`,
            description: `${tokenName} NFT`
          };

          try {
            const tokenURIResult = await publicClient.readContract({
              address: tokenContract as Address,
              abi: ERC721_ABI,
              functionName: 'tokenURI',
              args: [BigInt(tokenId)],
            });
            
            const tokenURI = tokenURIResult?.toString();

            if (tokenURI) {
              // Try to fetch metadata from URI
              const response = await fetch(tokenURI);
              if (response.ok) {
                const metadataJson = await response.json();
                metadata = {
                  tokenId: tokenId,
                  name: metadataJson.name || `Token #${tokenId}`,
                  description: metadataJson.description || `${tokenName} NFT`,
                  image: metadataJson.image || undefined
                };
              }
            }
          } catch {
            // Ignore metadata loading errors
          }

          nfts.push(metadata);
        } catch {
          // Ignore individual NFT loading errors
        }
      }

      setUserNFTs(nfts);
    } catch {
      // Ignore overall loading errors
    } finally {
      setIsLoadingNFTs(false);
    }
  }, [address, tokenContract, prizeType, nftBalance, tokenName]);

  // Get NFT contract address from the main contract
  const { data: nftContractAddress } = useReadContract({
    address: CONTRACTS.PLEDGE_TO_CREATE,
    abi: PLEDGE_TO_CREATE_ABI,
    functionName: 'getNFTContract',
  });

  // Generate badges based on user's pledge history
  const generateBadges = useCallback(() => {
    // Implementation for generating badges
    const badges: string[] = [];
    
    // Add logic to generate badges based on pledge history
    // This is a placeholder implementation
    
    return badges;
  }, []);

  // Load user's NFTs when contract address is available
  useEffect(() => {
    if (prizeType === 'ERC721' && tokenContract && tokenContract.length > 0) {
      loadUserNFTs();
    }
  }, [prizeType, tokenContract, loadUserNFTs]);

  // Generate badges on mount
  useEffect(() => {
    generateBadges();
  }, [generateBadges]);

  // Preload sounds on component mount
  useEffect(() => {
    preloadSounds();
  }, [preloadSounds]);

  // Handle successful deposit
  useEffect(() => {
    if (isDepositConfirmed) {
      playSound('success'); // Play success sound for prize sponsorship
      onSuccess();
    }
  }, [isDepositConfirmed, onSuccess, playSound]);

  // Handle successful approval
  useEffect(() => {
    if (isApproveConfirmed) {
      playSound('coin'); // Play coin sound for approval
      setStep('deposit');
    }
  }, [isApproveConfirmed, playSound]);

  const validateContract = useCallback(async () => {
    if (!tokenContract || !address) return;
    
    setIsValidatingContract(true);
    try {
      // Basic address validation
      const isValid = tokenContract.startsWith('0x') && tokenContract.length === 42;
      if (!isValid) {
        setContractValid(false);
        return;
      }

      // Try to call a basic function to verify it's a valid contract
      try {
        if (prizeType === 'ERC20') {
          await publicClient.readContract({
            address: tokenContract as Address,
            abi: ERC20_ABI,
            functionName: 'balanceOf',
            args: [address],
          });
        } else if (prizeType === 'ERC721') {
          await publicClient.readContract({
            address: tokenContract as Address,
            abi: ERC721_ABI,
            functionName: 'balanceOf',
            args: [address],
          });
        }
        setContractValid(true);
      } catch {
        setContractValid(false);
      }
    } catch {
      setContractValid(false);
    } finally {
      setIsValidatingContract(false);
    }
  }, [tokenContract, prizeType, address]);

  // Debounced contract validation to prevent excessive calls
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (tokenContract && address) {
        validateContract();
      } else {
        setContractValid(false);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [tokenContract, prizeType, address, validateContract]);

  const handleApprove = async () => {
    if (!isConnected || !tokenContract) return;

    if (prizeType === 'ERC20') {
      const amountToApprove = parseUnits(amount, tokenDecimals);
      writeApprove({
        address: tokenContract as Address,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [CONTRACTS.PLEDGE_TO_CREATE, amountToApprove],
        chainId: saigon.id,
      });
    } else if (prizeType === 'ERC721') {
      writeApprove({
        address: tokenContract as Address,
        abi: ERC721_ABI,
        functionName: 'approve',
        args: [CONTRACTS.PLEDGE_TO_CREATE, BigInt(selectedTokenId)],
        chainId: saigon.id,
      });
    }
  };

  const handleDeposit = async () => {
    if (!isConnected || !tokenContract) return;

    if (prizeType === 'ERC20') {
      const amountToDeposit = parseUnits(amount, tokenDecimals);
      writeDeposit({
        address: CONTRACTS.PLEDGE_TO_CREATE,
        abi: PLEDGE_TO_CREATE_ABI,
        functionName: 'depositERC20Prize',
        args: [BigInt(campaignId), tokenContract as Address, amountToDeposit, description],
        chainId: saigon.id,
      });
    } else if (prizeType === 'ERC721') {
      writeDeposit({
        address: CONTRACTS.PLEDGE_TO_CREATE,
        abi: PLEDGE_TO_CREATE_ABI,
        functionName: 'depositERC721Prize',
        args: [BigInt(campaignId), tokenContract as Address, BigInt(selectedTokenId), description],
        chainId: saigon.id,
      });
    }
  };

  const canProceed = () => {
    if (!contractValid || !description) return false;
    
    switch (prizeType) {
      case 'ERC20':
        return amount && parseFloat(amount) > 0 && parseFloat(tokenBalance) >= parseFloat(amount);
      case 'ERC721':
        return selectedTokenId && userNFTs.some(nft => nft.tokenId === selectedTokenId);
      default:
        return false;
    }
  };

  const formatBalance = (balance: string, decimals: number = 18) => {
    try {
      const value = parseFloat(balance) / Math.pow(10, decimals);
      return value.toFixed(4);
    } catch {
      return '0';
    }
  };

  const handleNFTSelect = (tokenId: string) => {
    setSelectedTokenId(tokenId);
    playSound('coin'); // Play sound when selecting NFT
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-gray-900 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">🎁 Sponsor Prize</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>

          {step === 'form' && (
            <div className="space-y-6">
              {/* Prize Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Prize Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {(['ERC20', 'ERC721'] as PrizeType[]).map((type) => (
                    <button
                      key={type}
                      onClick={() => {
                        setPrizeType(type);
                        setTokenContract('');
                        setSelectedTokenId('');
                        setAmount('');
                        setUserNFTs([]);
                      }}
                      className={`p-4 rounded-xl text-sm font-medium transition-all ${
                        prizeType === type
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      {type === 'ERC20' && (
                        <div className="text-center">
                          <div className="text-2xl mb-2">🪙</div>
                          <div>ERC20 Token</div>
                          <div className="text-xs opacity-70">Fungible tokens</div>
                        </div>
                      )}
                      {type === 'ERC721' && (
                        <div className="text-center">
                          <div className="text-2xl mb-2">🖼️</div>
                          <div>ERC721 NFT</div>
                          <div className="text-xs opacity-70">Unique collectibles</div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Token Contract */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Token Contract Address
                </label>
                <input
                  type="text"
                  value={tokenContract}
                  onChange={(e) => setTokenContract(e.target.value)}
                  placeholder="0x..."
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                />
                {isValidatingContract && (
                  <div className="text-xs text-blue-400 mt-2 flex items-center gap-2">
                    <motion.div
                      className="w-3 h-3 border border-blue-400 border-t-transparent rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                    Validating contract...
                  </div>
                )}
                {tokenContract && !isValidatingContract && (
                  <div className={`text-xs mt-2 ${contractValid ? 'text-green-400' : 'text-red-400'}`}>
                    {contractValid ? '✓ Valid contract address' : '✗ Invalid contract address'}
                  </div>
                )}
                {contractValid && tokenName && (
                  <div className="text-xs text-gray-400 mt-1">
                    {prizeType === 'ERC20' ? `${tokenName} (${tokenSymbol})` : tokenName}
                  </div>
                )}
              </div>

              {/* ERC20 Amount */}
              {prizeType === 'ERC20' && contractValid && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Amount
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0"
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                    />
                    {tokenSymbol && (
                      <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
                        {tokenSymbol}
                      </div>
                    )}
                  </div>
                  {tokenBalance !== '0' && (
                    <div className="text-xs text-gray-400 mt-2 flex justify-between">
                      <span>Balance: {formatBalance(tokenBalance, tokenDecimals)} {tokenSymbol}</span>
                      <button
                        onClick={() => setAmount(formatBalance(tokenBalance, tokenDecimals))}
                        className="text-purple-400 hover:text-purple-300 transition-colors"
                      >
                        Use Max
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* ERC721 NFT Selection */}
              {prizeType === 'ERC721' && contractValid && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Select NFT ({nftBalance} available)
                  </label>
                  
                  {isLoadingNFTs ? (
                    <div className="bg-gray-800 rounded-xl p-8 text-center">
                      <motion.div
                        className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                      <div className="text-gray-400">Loading your NFTs...</div>
                    </div>
                  ) : userNFTs.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-60 overflow-y-auto">
                      {userNFTs.map((nft) => (
                        <motion.button
                          key={nft.tokenId}
                          onClick={() => handleNFTSelect(nft.tokenId)}
                          className={`p-3 rounded-xl border-2 transition-all ${
                            selectedTokenId === nft.tokenId
                              ? 'border-purple-500 bg-purple-500/20'
                              : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                          }`}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="aspect-square bg-gray-700 rounded-lg mb-2 overflow-hidden">
                            {nft.image ? (
                              <Image
                                src={nft.image}
                                alt={nft.name || `NFT #${nft.tokenId}`}
                                width={64}
                                height={64}
                                className="w-full h-full object-cover"
                              />
                            ) : null}
                            {!nft.image && (
                              <div className="w-full h-full flex items-center justify-center text-gray-500 text-2xl">
                                🖼️
                              </div>
                            )}
                          </div>
                          <div className="text-xs text-white font-medium truncate">
                            {nft.name}
                          </div>
                          <div className="text-xs text-gray-400">
                            #{nft.tokenId}
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  ) : nftBalance === 0 ? (
                    <div className="bg-gray-800 rounded-xl p-6 text-center">
                      <div className="text-4xl mb-2">🚫</div>
                      <div className="text-gray-400">You don't own any NFTs from this collection</div>
                    </div>
                  ) : (
                    <div className="bg-gray-800 rounded-xl p-6 text-center">
                      <div className="text-4xl mb-2">⚠️</div>
                      <div className="text-gray-400">Unable to load NFTs from this contract</div>
                    </div>
                  )}
                </div>
              )}

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Prize Description
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={`Enter amount of ${selectedTokenId || 'token'} to deposit`}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                />
              </div>

              {/* Action Button */}
              <div className="pt-4">
                {isConnected ? (
                  <button
                    onClick={() => setStep('approve')}
                    disabled={!canProceed()}
                    className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg disabled:shadow-none"
                  >
                    {canProceed() ? 'Continue to Approve' : 'Complete all fields to continue'}
                  </button>
                ) : (
                  <TantoConnectButton />
                )}
              </div>
            </div>
          )}

          {step === 'approve' && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="text-lg font-semibold text-white mb-2">
                  Step 1: Approve Token Transfer
                </div>
                <div className="text-gray-400 text-sm">
                  Allow the contract to transfer your {prizeType} tokens
                </div>
              </div>

              <div className="bg-gray-800 rounded-xl p-6">
                <div className="text-sm text-gray-300 space-y-2">
                  <div className="flex justify-between">
                    <span>Prize Type:</span>
                    <span className="text-white">{prizeType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Contract:</span>
                    <span className="text-white font-mono text-xs">{tokenContract}</span>
                  </div>
                  {tokenName && (
                    <div className="flex justify-between">
                      <span>Token:</span>
                      <span className="text-white">{tokenName} {tokenSymbol && `(${tokenSymbol})`}</span>
                    </div>
                  )}
                  {selectedTokenId && (
                    <div className="flex justify-between">
                      <span>Token ID:</span>
                      <span className="text-white">#{selectedTokenId}</span>
                    </div>
                  )}
                  {amount && (
                    <div className="flex justify-between">
                      <span>Amount:</span>
                      <span className="text-white">{amount} {tokenSymbol}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Description:</span>
                    <span className="text-white">{description}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleApprove}
                disabled={isApproving || isConfirmingApprove}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg disabled:shadow-none"
              >
                {isApproving || isConfirmingApprove ? (
                  <div className="flex items-center justify-center gap-2">
                    <motion.div
                      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                    Approving...
                  </div>
                ) : (
                  '✅ Approve Transfer'
                )}
              </button>
            </div>
          )}

          {step === 'deposit' && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="text-lg font-semibold text-white mb-2">
                  Step 2: Deposit Prize
                </div>
                <div className="text-gray-400 text-sm">
                  Transfer your prize to the campaign
                </div>
              </div>

              <div className="bg-gray-800 rounded-xl p-6">
                <div className="text-sm text-gray-300 space-y-2">
                  <div className="flex justify-between">
                    <span>Prize Type:</span>
                    <span className="text-white">{prizeType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Contract:</span>
                    <span className="text-white font-mono text-xs">{tokenContract}</span>
                  </div>
                  {tokenName && (
                    <div className="flex justify-between">
                      <span>Token:</span>
                      <span className="text-white">{tokenName} {tokenSymbol && `(${tokenSymbol})`}</span>
                    </div>
                  )}
                  {selectedTokenId && (
                    <div className="flex justify-between">
                      <span>Token ID:</span>
                      <span className="text-white">#{selectedTokenId}</span>
                    </div>
                  )}
                  {amount && (
                    <div className="flex justify-between">
                      <span>Amount:</span>
                      <span className="text-white">{amount} {tokenSymbol}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Description:</span>
                    <span className="text-white">{description}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleDeposit}
                disabled={isDepositing || isConfirmingDeposit}
                className="w-full py-4 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:from-green-700 hover:to-blue-700 transition-all shadow-lg disabled:shadow-none"
              >
                {isDepositing || isConfirmingDeposit ? (
                  <div className="flex items-center justify-center gap-2">
                    <motion.div
                      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                    Depositing...
                  </div>
                ) : (
                  '🎁 Deposit Prize'
                )}
              </button>
            </div>
          )}

          <div className="text-white/50 text-xs">
            You&apos;re sponsoring Campaign #{campaignId}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
} 