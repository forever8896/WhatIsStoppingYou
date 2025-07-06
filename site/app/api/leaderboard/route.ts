import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http } from 'viem';
import { saigon } from 'viem/chains';
import { CONTRACTS, PLEDGE_TO_CREATE_ABI, SOULBOUND_NFT_ABI } from '@/lib/contracts';

const publicClient = createPublicClient({
  chain: saigon,
  transport: http('https://saigon-testnet.roninchain.com/rpc'),
});

interface NFTData {
  tokenId: number;
  campaignId: bigint;
  pledgeAmount: bigint;
  timestamp: number;
  campaignTitle: string;
  tokenURI?: string;
}

export async function GET(request: NextRequest) {
  try {
    console.log('API: Fetching leaderboard data from Soulbound NFT contract...');

    // First, get the NFT contract address from the main contract
    const nftContractAddress = await publicClient.readContract({
      address: CONTRACTS.PLEDGE_TO_CREATE,
      abi: PLEDGE_TO_CREATE_ABI,
      functionName: 'getNFTContract',
    });

    console.log('API: NFT contract address:', nftContractAddress);

    // Get the total number of NFTs minted (tokenCounter)
    const tokenCounter = await publicClient.readContract({
      address: nftContractAddress as `0x${string}`,
      abi: SOULBOUND_NFT_ABI,
      functionName: 'tokenCounter',
    });

    console.log('API: Total NFTs minted:', tokenCounter);

    if (tokenCounter === BigInt(0)) {
      console.log('API: No NFTs minted yet, returning empty leaderboard');
      return NextResponse.json([]);
    }

    // Get all unique pledgers by checking NFT ownership
    const uniquePledgers = new Set<string>();
    const pledgerData = new Map<string, { 
      totalPledged: bigint, 
      pledgeCount: number, 
      recentActivity: number,
      nfts: NFTData[]
    }>();

    // We'll check each NFT to find unique pledgers and aggregate their data
    for (let tokenId = 0; tokenId < Number(tokenCounter); tokenId++) {
      try {
        // Get the NFT data using getPledgeNFT function
        const pledgeNFT = await publicClient.readContract({
          address: nftContractAddress as `0x${string}`,
          abi: SOULBOUND_NFT_ABI,
          functionName: 'getPledgeNFT',
          args: [BigInt(tokenId)],
        });

        if (pledgeNFT && typeof pledgeNFT === 'object' && 'pledger' in pledgeNFT) {
          const pledger = pledgeNFT.pledger.toLowerCase();
          const pledgeAmount = pledgeNFT.pledgeAmount;
          const timestamp = Number(pledgeNFT.timestamp);
          const campaignId = pledgeNFT.campaignId;
          const campaignTitle = pledgeNFT.campaignTitle;

          uniquePledgers.add(pledger);

          if (!pledgerData.has(pledger)) {
            pledgerData.set(pledger, {
              totalPledged: BigInt(0),
              pledgeCount: 0,
              recentActivity: 0,
              nfts: []
            });
          }

          const data = pledgerData.get(pledger)!;
          data.totalPledged += pledgeAmount;
          data.pledgeCount += 1;
          data.recentActivity = Math.max(data.recentActivity, timestamp);
          
          // Get tokenURI for the NFT (contains the SVG)
          let tokenURI = '';
          try {
            tokenURI = await publicClient.readContract({
              address: nftContractAddress as `0x${string}`,
              abi: SOULBOUND_NFT_ABI,
              functionName: 'tokenURI',
              args: [BigInt(tokenId)],
            }) as string;
          } catch (error) {
            console.error(`API: Error fetching tokenURI for NFT ${tokenId}:`, error);
          }

          // Add NFT data
          data.nfts.push({
            tokenId,
            campaignId,
            pledgeAmount,
            timestamp,
            campaignTitle,
            tokenURI
          });
        }
      } catch (error) {
        console.error(`API: Error fetching NFT ${tokenId}:`, error);
        // Continue with next NFT
      }
    }

    console.log('API: Found', uniquePledgers.size, 'unique pledgers');

    // Convert to leaderboard format
    const leaderboardData = Array.from(uniquePledgers).map(pledger => {
      const data = pledgerData.get(pledger)!;
      return {
        address: pledger,
        totalPledged: data.totalPledged.toString(),
        pledgeCount: data.pledgeCount,
        recentActivity: data.recentActivity,
        nfts: data.nfts.map(nft => ({
          ...nft,
          campaignId: nft.campaignId.toString(),
          pledgeAmount: nft.pledgeAmount.toString()
        }))
      };
    });

    // Sort by total pledged (descending)
    leaderboardData.sort((a, b) => {
      const aTotal = BigInt(a.totalPledged);
      const bTotal = BigInt(b.totalPledged);
      return bTotal > aTotal ? 1 : bTotal < aTotal ? -1 : 0;
    });

    // Add ranks
    const rankedData = leaderboardData.map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));

    console.log('API: Returning leaderboard with', rankedData.length, 'entries');
    return NextResponse.json(rankedData);
  } catch (err) {
    console.error('API: Error fetching leaderboard:', err);
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
  }
} 