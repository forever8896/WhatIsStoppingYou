const { ethers } = require("hardhat");

async function main() {
  console.log("Starting deployment to Saigon testnet...");
  
  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  
  // Check balance
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "RON");
  
  if (balance < ethers.parseEther("0.1")) {
    console.warn("Warning: Low balance. Make sure you have enough RON for deployment.");
  }

  try {
    // Deploy PledgeToCreate contract (this will also deploy SoulboundPledgeNFT)
    console.log("\nDeploying PledgeToCreate contract...");
    const PledgeToCreate = await ethers.getContractFactory("PledgeToCreate");
    const pledgeContract = await PledgeToCreate.deploy();
    
    await pledgeContract.waitForDeployment();
    const pledgeAddress = await pledgeContract.getAddress();
    console.log("PledgeToCreate deployed to:", pledgeAddress);
    
    // Get the NFT contract address
    const nftAddress = await pledgeContract.getNFTContract();
    console.log("SoulboundPledgeNFT deployed to:", nftAddress);
    
    // Verify deployment
    console.log("\nVerifying deployment...");
    const campaignCount = await pledgeContract.campaignCount();
    const platformFee = await pledgeContract.platformFeePercentage();
    
    console.log("Campaign count:", campaignCount.toString());
    console.log("Platform fee percentage:", platformFee.toString(), "basis points");
    
    // Save deployment info
    const deploymentInfo = {
      network: "saigon",
      deployer: deployer.address,
      contracts: {
        PledgeToCreate: pledgeAddress,
        SoulboundPledgeNFT: nftAddress
      },
      blockNumber: await deployer.provider.getBlockNumber(),
      timestamp: new Date().toISOString()
    };
    
    console.log("\n=== DEPLOYMENT COMPLETE ===");
    console.log("Network: Saigon Testnet");
    console.log("PledgeToCreate:", pledgeAddress);
    console.log("SoulboundPledgeNFT:", nftAddress);
    console.log("Transaction hash will be shown above");
    
    console.log("\n=== NEXT STEPS ===");
    console.log("1. Verify contracts on Ronin explorer:");
    console.log("   - PledgeToCreate:", `https://saigon-app.roninchain.com/address/${pledgeAddress}`);
    console.log("   - SoulboundPledgeNFT:", `https://saigon-app.roninchain.com/address/${nftAddress}`);
    console.log("2. Update your frontend with these contract addresses");
    console.log("3. Test the contracts by creating a campaign and making a pledge");
    
    // Save to file for frontend integration
    const fs = require('fs');
    fs.writeFileSync(
      './deployment-info.json',
      JSON.stringify(deploymentInfo, null, 2)
    );
    console.log("\nDeployment info saved to deployment-info.json");
    
  } catch (error) {
    console.error("Deployment failed:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 