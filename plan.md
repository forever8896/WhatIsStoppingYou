# PledgeToCreate: Hackathon Plan of Action

## Overview

Build a consumer-facing, Ronin-native crowdfunding platform where supporters pledge RON to creators. Supporters receive soulbound NFTs reflecting their contribution, and a share of the platform's revenue is distributed to all pledgers, proportionally.

### Tech Stack

* **Frontend**: Next.js (React) + TailwindCSS
* **Wallet**: Ronin Wallet SDK (Tanto Widget)
* **Smart Contracts**: Solidity + Hardhat (deployed to Saigon testnet)
* **Backend**: Node.js/Express for serverless functions (optional)
* **Database**: Not needed for MVP (data lives on-chain)

---

## Features

### 🎯 Core Features

* Creator campaign creation (title, image, goal, description, deadline)
* Supporter pledging using Ronin Wallet
* Soulbound NFT minted on pledge with metadata
* Platform-wide revenue sharing pool
* Weekly distribution of platform earnings to pledgers based on total pledge ratio

### 🎨 Bonus Features (time-permitting)

* Supporter leaderboard (rank by total pledged)
* Creator profiles
* Referral tracking
* Milestone-gated campaign withdrawals
* Pledge-based loot box drop system

---

## Week 1: Hackathon MVP Plan

### ✅ Day 1 — Setup & Foundations

* [ ] Scaffold Next.js project with TailwindCSS
* [ ] Integrate **Ronin Wallet SDK (Tanto Widget)**

  * Implement connect wallet button
  * Display user wallet address post-auth
* [ ] Scaffold campaign creation UI (form)
* [ ] Scaffold pledge UI (pledge input + confirm)
* [ ] Define `Campaign` and `Pledge` smart contract interfaces

### ✅ Day 2 — Smart Contracts & On-chain Integration

* [ ] Write smart contract:

  * `createCampaign(goal, deadline)`
  * `pledgeToCampaign(campaignId)` (payable)
  * `mintSBT(user, campaignId, amount)`
  * `getUserTotalPledged(user)`
  * `receivePlatformRevenue()`
  * `distributePlatformRevenue()`
* [ ] Deploy contract to **Saigon Testnet**
* [ ] Connect pledge UI to smart contract (via Ethers.js)
* [ ] Mint soulbound NFT on pledge (ERC-721 non-transferable)
* [ ] Implement revenue tracking + distribution logic

---

## Smart Contract Breakdown

### Contract: PledgeToCreate

```solidity
struct Campaign {
  address creator;
  uint256 goal;
  uint256 pledged;
  uint256 deadline;
  bool withdrawn;
}

struct Pledge {
  address pledger;
  uint256 amount;
}

mapping(uint256 => Campaign) public campaigns;
mapping(address => Pledge[]) public userPledges;
uint256 public campaignCount;
uint256 public platformRevenue;

function createCampaign(...)
function pledgeToCampaign(uint256 campaignId) payable
function withdrawRevenue() external
function distributeRevenue() external
```

### Contract: SoulboundPledgeNFT

```solidity
function mintPledgeSBT(address to, uint256 campaignId, uint256 amount) external
function getTotalPledged(address user) external view returns (uint256)
```

---

## UI Components

### Pages

* `/` — Campaign grid
* `/campaign/[id]` — Campaign detail + pledge form
* `/create` — Creator campaign form
* `/rewards` — Your soulbound badges + revenue earned

### Components

* `<ConnectWallet />`
* `<CampaignCard />`
* `<PledgeForm />`
* `<SBTDisplay />`
* `<RevenueShareTracker />`

---

## Revenue Sharing Logic

1. Platform fee collected from each pledge (e.g. 5%) stored in `platformRevenue`.
2. Weekly (or on-demand) distribution using `distributeRevenue()` function:

   * Fetch all users and their total pledged amounts
   * Compute share = userPledged / totalPledged
   * Distribute platformRevenue \* share to each user

---

## Testing & Deployment

* [ ] Deploy smart contract to Saigon Testnet
* [ ] Deploy frontend to Vercel or Netlify
* [ ] Test end-to-end: create → pledge → mint SBT → revenue distribution
* [ ] Prepare short demo video + slide

---

## Stretch Goals

* Add supporter leaderboard
* Referral link tracking (earn % of referred pledges)
* Creator-set milestone unlocks (optional vault logic)
* Random NFT drops for top pledgers

---

## Deliverables for ETHGlobal

* Working dApp deployed on Saigon
* Source code (GitHub repo)
* Demo video
* Smart contract verified
* Submission on ETHGlobal platform with prize qualifications listed
