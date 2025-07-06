import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http } from 'viem';
import { saigon } from 'viem/chains';
import { CONTRACTS, PLEDGE_TO_CREATE_ABI } from '@/lib/contracts';

const publicClient = createPublicClient({
  chain: saigon,
  transport: http('https://saigon-testnet.roninchain.com/rpc'),
});

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const segments = url.pathname.split('/');
    const idStr = segments[segments.length - 1];
    const campaignId = parseInt(idStr);

    if (isNaN(campaignId) || campaignId < 0) {
      return NextResponse.json({ error: 'Invalid campaign ID' }, { status: 400 });
    }

    const raw = await publicClient.readContract({
      address: CONTRACTS.PLEDGE_TO_CREATE,
      abi: PLEDGE_TO_CREATE_ABI,
      functionName: 'campaigns',
      args: [BigInt(campaignId)],
    });

    console.log('API: Campaign data:', raw);

    // Updated struct layout to match current contract
    const [
      creator,
      title,
      description,
      imageUrl,
      goal,
      pledged,
      createdAt,
      withdrawn,
      active,
      ended,
      prizesClaimed,
    ] = raw as unknown as [
      `0x${string}`,
      string,
      string,
      string,
      bigint,
      bigint,
      bigint,
      boolean,
      boolean,
      boolean,
      boolean
    ];

    if (!title || createdAt === BigInt(0)) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    const serialized = {
      creator,
      title,
      description,
      imageUrl,
      goal: goal.toString(),
      pledged: pledged.toString(),
      createdAt: createdAt.toString(),
      withdrawn,
      active,
      ended,
      prizesClaimed,
    };

    return NextResponse.json(serialized);
  } catch (err) {
    console.error('API: Error fetching campaign:', err);
    return NextResponse.json({ error: 'Failed to fetch campaign' }, { status: 500 });
  }
}
