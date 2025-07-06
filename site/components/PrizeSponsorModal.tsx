'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { parseEther, parseUnits, Address } from 'viem';
import { saigon } from 'viem/chains';
import { CONTRACTS, PLEDGE_TO_CREATE_ABI } from '@/lib/contracts';
import { TantoConnectButton } from '@sky-mavis/tanto-widget';

interface PrizeSponsorModalProps {
  campaignId: number;
  onClose: () => void;
  onSuccess: () => void;
}

type PrizeType = 'ERC20' | 'ERC721' | 'ERC1155';

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
  }
];

const ERC1155_ABI = [
  {
    "inputs": [{"internalType": "address", "name": "operator", "type": "address"}, {"internalType": "bool", "name": "approved", "type": "bool"}],
    "name": "setApprovalForAll",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "account", "type": "address"}, {"internalType": "uint256", "name": "id", "type": "uint256"}],
    "name": "balanceOf",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
];

export default function PrizeSponsorModal({ campaignId, onClose, onSuccess }: PrizeSponsorModalProps) {
  const [prizeType, setPrizeType] = useState<PrizeType>('ERC20');
  const [tokenContract, setTokenContract] = useState('');
  const [tokenId, setTokenId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [step, setStep] = useState<'form' | 'approve' | 'deposit'>('form');
  const [isValidatingContract, setIsValidatingContract] = useState(false);
  const [contractValid, setContractValid] = useState(false);
  const [tokenBalance, setTokenBalance] = useState('0');
  const [tokenDecimals, setTokenDecimals] = useState(18);

  const { isConnected, address } = useAccount();
  
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

  // Check token decimals for ERC20
  const { data: erc20Decimals } = useReadContract({
    address: tokenContract as Address,
    abi: ERC20_ABI,
    functionName: 'decimals',
    chainId: saigon.id,
    query: { enabled: !!tokenContract && prizeType === 'ERC20' && contractValid }
  });

  // Check NFT ownership for ERC721
  const { data: nftOwner } = useReadContract({
    address: tokenContract as Address,
    abi: ERC721_ABI,
    functionName: 'ownerOf',
    args: [BigInt(tokenId || '0')],
    chainId: saigon.id,
    query: { enabled: !!tokenContract && !!tokenId && prizeType === 'ERC721' && contractValid }
  });

  // Check ERC1155 balance
  const { data: erc1155Balance } = useReadContract({
    address: tokenContract as Address,
    abi: ERC1155_ABI,
    functionName: 'balanceOf',
    args: [address!, BigInt(tokenId || '0')],
    chainId: saigon.id,
    query: { enabled: !!tokenContract && !!tokenId && !!address && prizeType === 'ERC1155' && contractValid }
  });

  // Update token balance and decimals
  useEffect(() => {
    if (prizeType === 'ERC20') {
      setTokenBalance(erc20Balance?.toString() || '0');
      setTokenDecimals(Number(erc20Decimals) || 18);
    } else if (prizeType === 'ERC1155') {
      setTokenBalance(erc1155Balance?.toString() || '0');
    }
  }, [erc20Balance, erc20Decimals, erc1155Balance, prizeType]);

  // Handle successful approve
  useEffect(() => {
    if (isApproveConfirmed) {
      setStep('deposit');
    }
  }, [isApproveConfirmed]);

  // Handle successful deposit
  useEffect(() => {
    if (isDepositConfirmed) {
      onSuccess();
    }
  }, [isDepositConfirmed, onSuccess]);

  const validateContract = async () => {
    if (!tokenContract) return;
    
    setIsValidatingContract(true);
    try {
      // This is a simple validation - in production you'd want more robust checks
      const isValid = tokenContract.startsWith('0x') && tokenContract.length === 42;
      setContractValid(isValid);
    } catch (error) {
      setContractValid(false);
    } finally {
      setIsValidatingContract(false);
    }
  };

  useEffect(() => {
    if (tokenContract) {
      validateContract();
    } else {
      setContractValid(false);
    }
  }, [tokenContract]);

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
        args: [CONTRACTS.PLEDGE_TO_CREATE, BigInt(tokenId)],
        chainId: saigon.id,
      });
    } else if (prizeType === 'ERC1155') {
      writeApprove({
        address: tokenContract as Address,
        abi: ERC1155_ABI,
        functionName: 'setApprovalForAll',
        args: [CONTRACTS.PLEDGE_TO_CREATE, true],
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
        args: [BigInt(campaignId), tokenContract as Address, BigInt(tokenId), description],
        chainId: saigon.id,
      });
    } else if (prizeType === 'ERC1155') {
      writeDeposit({
        address: CONTRACTS.PLEDGE_TO_CREATE,
        abi: PLEDGE_TO_CREATE_ABI,
        functionName: 'depositERC1155Prize',
        args: [BigInt(campaignId), tokenContract as Address, BigInt(tokenId), BigInt(amount), description],
        chainId: saigon.id,
      });
    }
  };

  const canProceed = () => {
    if (!contractValid || !description) return false;
    
    switch (prizeType) {
      case 'ERC20':
        return amount && parseFloat(amount) > 0;
      case 'ERC721':
        return tokenId && typeof nftOwner === 'string' && nftOwner.toLowerCase() === address?.toLowerCase();
      case 'ERC1155':
        return tokenId && amount && parseFloat(amount) > 0 && parseFloat(tokenBalance) >= parseFloat(amount);
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
          className="bg-gray-900 rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
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
            <div className="space-y-4">
              {/* Prize Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Prize Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['ERC20', 'ERC721', 'ERC1155'] as PrizeType[]).map((type) => (
                    <button
                      key={type}
                      onClick={() => setPrizeType(type)}
                      className={`p-3 rounded-lg text-sm font-medium transition-all ${
                        prizeType === type
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      {type === 'ERC20' && '🪙 Token'}
                      {type === 'ERC721' && '🖼️ NFT'}
                      {type === 'ERC1155' && '🎨 Multi'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Token Contract */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Token Contract Address
                </label>
                <input
                  type="text"
                  value={tokenContract}
                  onChange={(e) => setTokenContract(e.target.value)}
                  placeholder="0x..."
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                />
                {isValidatingContract && (
                  <div className="text-xs text-gray-400 mt-1">Validating contract...</div>
                )}
                {tokenContract && !isValidatingContract && (
                  <div className={`text-xs mt-1 ${contractValid ? 'text-green-400' : 'text-red-400'}`}>
                    {contractValid ? '✓ Valid contract address' : '✗ Invalid contract address'}
                  </div>
                )}
              </div>

              {/* Token ID (for ERC721/ERC1155) */}
              {(prizeType === 'ERC721' || prizeType === 'ERC1155') && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Token ID
                  </label>
                  <input
                    type="number"
                    value={tokenId}
                    onChange={(e) => setTokenId(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                  />
                  {prizeType === 'ERC721' && tokenId && nftOwner && typeof nftOwner === 'string' && (
                    <div className={`text-xs mt-1 ${nftOwner.toLowerCase() === address?.toLowerCase() ? 'text-green-400' : 'text-red-400'}`}>
                      {nftOwner.toLowerCase() === address?.toLowerCase() ? '✓ You own this NFT' : '✗ You do not own this NFT'}
                    </div>
                  )}
                </div>
              )}

              {/* Amount (for ERC20/ERC1155) */}
              {(prizeType === 'ERC20' || prizeType === 'ERC1155') && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Amount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                  />
                  {tokenBalance !== '0' && (
                    <div className="text-xs text-gray-400 mt-1">
                      Balance: {formatBalance(tokenBalance, prizeType === 'ERC20' ? tokenDecimals : 0)}
                    </div>
                  )}
                </div>
              )}

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Prize Description
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g., 100 USDC tokens, Rare NFT, etc."
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Action Button */}
              <div className="pt-4">
                {isConnected ? (
                  <button
                    onClick={() => setStep('approve')}
                    disabled={!canProceed()}
                    className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:from-purple-700 hover:to-pink-700 transition-all"
                  >
                    Continue to Approve
                  </button>
                ) : (
                  <TantoConnectButton />
                )}
              </div>
            </div>
          )}

          {step === 'approve' && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-lg font-semibold text-white mb-2">
                  Step 1: Approve Token Transfer
                </div>
                <div className="text-gray-400 text-sm">
                  Allow the contract to transfer your {prizeType} tokens
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-4">
                <div className="text-sm text-gray-300">
                  <div>Prize Type: <span className="text-white">{prizeType}</span></div>
                  <div>Contract: <span className="text-white font-mono text-xs">{tokenContract}</span></div>
                  {tokenId && <div>Token ID: <span className="text-white">{tokenId}</span></div>}
                  {amount && <div>Amount: <span className="text-white">{amount}</span></div>}
                  <div>Description: <span className="text-white">{description}</span></div>
                </div>
              </div>

              <button
                onClick={handleApprove}
                disabled={isApproving || isConfirmingApprove}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:from-blue-700 hover:to-purple-700 transition-all"
              >
                {isApproving || isConfirmingApprove ? '⏳ Approving...' : '✅ Approve Transfer'}
              </button>
            </div>
          )}

          {step === 'deposit' && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-lg font-semibold text-white mb-2">
                  Step 2: Deposit Prize
                </div>
                <div className="text-gray-400 text-sm">
                  Transfer your prize to the campaign
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-4">
                <div className="text-sm text-gray-300">
                  <div>Prize Type: <span className="text-white">{prizeType}</span></div>
                  <div>Contract: <span className="text-white font-mono text-xs">{tokenContract}</span></div>
                  {tokenId && <div>Token ID: <span className="text-white">{tokenId}</span></div>}
                  {amount && <div>Amount: <span className="text-white">{amount}</span></div>}
                  <div>Description: <span className="text-white">{description}</span></div>
                </div>
              </div>

              <button
                onClick={handleDeposit}
                disabled={isDepositing || isConfirmingDeposit}
                className="w-full py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:from-green-700 hover:to-blue-700 transition-all"
              >
                {isDepositing || isConfirmingDeposit ? '⏳ Depositing...' : '🎁 Deposit Prize'}
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
} 