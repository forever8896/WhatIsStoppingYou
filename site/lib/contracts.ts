import { Address } from 'viem';

// Contract addresses on Saigon testnet
export const CONTRACTS = {
  PLEDGE_TO_CREATE: '0xcbCAF8943AB70ba4e0d959b8B9cFfAC30Ec13D60' as Address,
  SOULBOUND_PLEDGE_NFT: '0x1931a4F5860589F335e79c9e3b4499C91bB045d8' as Address,
} as const;

// Simplified ABI for the functions we need
export const PLEDGE_TO_CREATE_ABI = [
  {
    inputs: [
      { name: '_title', type: 'string' },
      { name: '_description', type: 'string' },
      { name: '_imageUrl', type: 'string' },
      { name: '_goal', type: 'uint256' }
    ],
    name: 'createCampaign',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ name: '_campaignId', type: 'uint256' }],
    name: 'pledgeToCampaign',
    outputs: [],
    stateMutability: 'payable',
    type: 'function'
  },
  {
    inputs: [{ name: '_campaignId', type: 'uint256' }],
    name: 'getCampaign',
    outputs: [
      {
        components: [
          { name: 'creator', type: 'address' },
          { name: 'title', type: 'string' },
          { name: 'description', type: 'string' },
          { name: 'imageUrl', type: 'string' },
          { name: 'goal', type: 'uint256' },
          { name: 'pledged', type: 'uint256' },
          { name: 'createdAt', type: 'uint256' },
          { name: 'withdrawn', type: 'bool' },
          { name: 'active', type: 'bool' }
        ],
        name: '',
        type: 'tuple'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'campaignCount',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ name: '_user', type: 'address' }],
    name: 'getUserTotalPledged',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'platformFeePercentage',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  }
] as const;

// Campaign type definition
export interface Campaign {
  creator: Address;
  title: string;
  description: string;
  imageUrl: string;
  goal: bigint;
  pledged: bigint;
  createdAt: bigint;
  withdrawn: boolean;
  active: boolean;
} 