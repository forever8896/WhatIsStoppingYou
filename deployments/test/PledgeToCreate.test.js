const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PledgeToCreate", function () {
  let pledgeContract;
  let nftContract;
  let owner;
  let creator;
  let pledger;
  let addrs;

  beforeEach(async function () {
    // Get signers
    [owner, creator, pledger, ...addrs] = await ethers.getSigners();

    // Deploy contracts
    const PledgeToCreate = await ethers.getContractFactory("PledgeToCreate");
    pledgeContract = await PledgeToCreate.deploy();
    await pledgeContract.waitForDeployment();

    // Get NFT contract
    const nftAddress = await pledgeContract.getNFTContract();
    const SoulboundPledgeNFT = await ethers.getContractFactory("SoulboundPledgeNFT");
    nftContract = SoulboundPledgeNFT.attach(nftAddress);
  });

  describe("Campaign Creation", function () {
    it("Should create a campaign successfully", async function () {
      const title = "Test Campaign";
      const description = "This is a test campaign";
      const imageUrl = "https://example.com/image.jpg";
      const goal = ethers.parseEther("10");
      const deadline = Math.floor(Date.now() / 1000) + 86400; // 24 hours from now

      const tx = await pledgeContract.connect(creator).createCampaign(
        title,
        description,
        imageUrl,
        goal,
        deadline
      );

      await expect(tx)
        .to.emit(pledgeContract, "CampaignCreated")
        .withArgs(0, creator.address, title, goal, deadline);

      const campaign = await pledgeContract.getCampaign(0);
      expect(campaign.creator).to.equal(creator.address);
      expect(campaign.title).to.equal(title);
      expect(campaign.goal).to.equal(goal);
      expect(campaign.active).to.be.true;
    });

    it("Should fail with invalid parameters", async function () {
      const deadline = Math.floor(Date.now() / 1000) - 86400; // Past deadline

      await expect(
        pledgeContract.connect(creator).createCampaign(
          "Test",
          "Description",
          "image.jpg",
          ethers.parseEther("10"),
          deadline
        )
      ).to.be.revertedWith("Deadline must be in the future");
    });
  });

  describe("Pledging", function () {
    let campaignId;

    beforeEach(async function () {
      const deadline = Math.floor(Date.now() / 1000) + 86400;
      await pledgeContract.connect(creator).createCampaign(
        "Test Campaign",
        "Description",
        "image.jpg",
        ethers.parseEther("10"),
        deadline
      );
      campaignId = 0;
    });

    it("Should accept pledges and mint NFT", async function () {
      const pledgeAmount = ethers.parseEther("1");

      const tx = await pledgeContract.connect(pledger).pledgeToCampaign(campaignId, {
        value: pledgeAmount
      });

      // Check that NFT was minted
      const pledgerNFTs = await nftContract.getUserNFTs(pledger.address);
      expect(pledgerNFTs.length).to.equal(1);

      // Check pledge was recorded
      const userPledges = await pledgeContract.getUserPledges(pledger.address);
      expect(userPledges.length).to.equal(1);
      expect(userPledges[0].campaignId).to.equal(campaignId);

      // Check campaign was updated
      const campaign = await pledgeContract.getCampaign(campaignId);
      const expectedPledgeAmount = pledgeAmount - (pledgeAmount * 500n) / 10000n; // Minus 5% fee
      expect(campaign.pledged).to.equal(expectedPledgeAmount);
    });

    it("Should calculate platform fee correctly", async function () {
      const pledgeAmount = ethers.parseEther("1");
      const expectedFee = (pledgeAmount * 500n) / 10000n; // 5%

      await pledgeContract.connect(pledger).pledgeToCampaign(campaignId, {
        value: pledgeAmount
      });

      const platformRevenue = await pledgeContract.platformRevenue();
      expect(platformRevenue).to.equal(expectedFee);
    });
  });

  describe("Soulbound NFT", function () {
    it("Should prevent transfers", async function () {
      // Create campaign and pledge
      const deadline = Math.floor(Date.now() / 1000) + 86400;
      await pledgeContract.connect(creator).createCampaign(
        "Test Campaign",
        "Description",
        "image.jpg",
        ethers.parseEther("10"),
        deadline
      );

      await pledgeContract.connect(pledger).pledgeToCampaign(0, {
        value: ethers.parseEther("1")
      });

      // Try to transfer NFT
      const pledgerNFTs = await nftContract.getUserNFTs(pledger.address);
      const tokenId = pledgerNFTs[0];

      await expect(
        nftContract.connect(pledger).transferFrom(pledger.address, addrs[0].address, tokenId)
      ).to.be.revertedWith("Soulbound: Transfer not allowed");
    });

    it("Should generate proper metadata", async function () {
      // Create campaign and pledge
      const deadline = Math.floor(Date.now() / 1000) + 86400;
      await pledgeContract.connect(creator).createCampaign(
        "Test Campaign",
        "Description",
        "image.jpg",
        ethers.parseEther("10"),
        deadline
      );

      await pledgeContract.connect(pledger).pledgeToCampaign(0, {
        value: ethers.parseEther("1")
      });

      const pledgerNFTs = await nftContract.getUserNFTs(pledger.address);
      const tokenId = pledgerNFTs[0];

      const tokenURI = await nftContract.tokenURI(tokenId);
      expect(tokenURI).to.include("data:application/json;base64,");
    });
  });
}); 