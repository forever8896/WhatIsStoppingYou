import { NextResponse } from 'next/server';
import { createPublicClient, http } from 'viem';
import { saigon } from 'viem/chains';
import { CONTRACTS, PLEDGE_TO_CREATE_ABI } from '@/lib/contracts';

const publicClient = createPublicClient({
  chain: saigon,
  transport: http('https://saigon-testnet.roninchain.com/rpc'),
});

export async function GET() {
  try {
    console.log('Testing contract connection...');
    console.log('Contract address:', CONTRACTS.PLEDGE_TO_CREATE);
    console.log('Chain:', saigon.name, saigon.id);
    console.log('RPC URL:', 'https://saigon-testnet.roninchain.com/rpc');

    // Test basic contract call
    const campaignCount = await publicClient.readContract({
      address: CONTRACTS.PLEDGE_TO_CREATE,
      abi: PLEDGE_TO_CREATE_ABI,
      functionName: 'campaignCount',
    });

    console.log('Campaign count from contract:', campaignCount);

    return NextResponse.json({
      success: true,
      campaignCount: campaignCount.toString(),
      contract: CONTRACTS.PLEDGE_TO_CREATE,
      chain: saigon.name,
      chainId: saigon.id,
    });
  } catch (error) {
    console.error('Contract test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      contract: CONTRACTS.PLEDGE_TO_CREATE,
      chain: saigon.name,
      chainId: saigon.id,
    }, { status: 500 });
  }
} 