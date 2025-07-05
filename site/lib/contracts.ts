import { Address } from 'viem';

// Contract addresses on Saigon testnet
export const CONTRACTS = {
  PLEDGE_TO_CREATE: '0x69814cD24A5Be9668155d4e300eAbb4260a60a97' as Address,
  SOULBOUND_PLEDGE_NFT: '0xdC33A0596a5AdE0B113dee32da13388279f6205e' as Address,
  VRF_COORDINATOR: '0xa60c1e07fa030e4b49eb54950adb298ab94dd312' as Address,
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