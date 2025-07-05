import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http } from 'viem';
import { saigon } from 'viem/chains';
import { CONTRACTS, PLEDGE_TO_CREATE_ABI } from '@/lib/contracts';

const publicClient = createPublicClient({
  chain: saigon,
  transport: http('https://saigon-testnet.roninchain.com/rpc'),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const campaignId = parseInt(params.id);
    console.log('API: Fetching campaign ID:', campaignId);
    
    if (isNaN(campaignId) || campaignId < 0) {
      console.log('API: Invalid campaign ID');
      return NextResponse.json({ error: 'Invalid campaign ID' }, { status: 400 });
    }

    console.log('API: Calling contract at:', CONTRACTS.PLEDGE_TO_CREATE);
    // Fetch campaign data from smart contract
    const campaign = await publicClient.readContract({
      address: CONTRACTS.PLEDGE_TO_CREATE,
      abi: PLEDGE_TO_CREATE_ABI,
      functionName: 'getCampaign',
      args: [BigInt(campaignId)],
    });

    console.log('API: Raw campaign data:', campaign);

    // Convert BigInt values to strings for JSON serialization
    const serializedCampaign = {
      creator: campaign.creator,
      title: campaign.title,
      description: campaign.description,
      imageUrl: campaign.imageUrl,
      goal: campaign.goal.toString(),
      pledged: campaign.pledged.toString(),
      createdAt: campaign.createdAt.toString(),
      withdrawn: campaign.withdrawn,
      active: campaign.active,
    };

    console.log('API: Serialized campaign:', serializedCampaign);
    return NextResponse.json(serializedCampaign);
  } catch (error) {
    console.error('API: Error fetching campaign:', error);
    return NextResponse.json({ error: 'Failed to fetch campaign' }, { status: 500 });
  }
} 