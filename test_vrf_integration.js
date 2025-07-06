const { ethers } = require("hardhat");

async function main() {
  console.log("Testing VRF Integration...");

  // Replace with your deployed contract address
  const CONTRACT_ADDRESS = "0x08E1B1dbA7ccdF94A38906c5ad6bB346E696087F"; // Updated address
  
  const PledgeToCreate = await ethers.getContractFactory("PledgeToCreate");
  const contract = PledgeToCreate.attach(CONTRACT_ADDRESS);

  // Get current gas price
  const gasPrice = await contract.getGasPrice();
  console.log("Current gas price:", ethers.formatUnits(gasPrice, "gwei"), "GWEI");

  // Check minimum gas price requirement (21 GWEI)
  const minGasPrice = ethers.parseUnits("21", "gwei");
  console.log("Minimum gas price:", ethers.formatUnits(minGasPrice, "gwei"), "GWEI");
  console.log("Gas price meets minimum:", gasPrice >= minGasPrice);

  // Estimate VRF fee
  try {
    const estimatedFee = await contract.estimateVRFRequestFee();
    console.log("Estimated VRF fee:", ethers.formatEther(estimatedFee), "RON");
    
    // Check contract balance
    const balance = await ethers.provider.getBalance(CONTRACT_ADDRESS);
    console.log("Contract balance:", ethers.formatEther(balance), "RON");
    console.log("Has sufficient funds for VRF:", balance >= estimatedFee);
    
    if (balance < estimatedFee) {
      console.log("⚠️  Contract needs funding for VRF requests");
      console.log("Required:", ethers.formatEther(estimatedFee), "RON");
      console.log("Available:", ethers.formatEther(balance), "RON");
    } else {
      console.log("✅ Contract has sufficient funds for VRF requests");
    }
  } catch (error) {
    console.error("Error estimating VRF fee:", error.message);
  }

  // Test campaign creation and pledging
  console.log("\n--- Testing Campaign Flow ---");
  
  try {
    // Create a test campaign
    const createTx = await contract.createCampaign(
      "Test VRF Campaign",
      "Testing VRF integration with proper fee estimation",
      "https://example.com/image.jpg",
      ethers.parseEther("10.0") // 10 RON goal
    );
    await createTx.wait();
    console.log("✅ Campaign created successfully");

    // Get campaign count
    const campaignCount = await contract.campaignCount();
    console.log("Total campaigns:", campaignCount.toString());

    // Make a pledge that should trigger raffle (>10% of goal)
    const pledgeAmount = ethers.parseEther("2.0"); // 2 RON pledge
    const pledgeTx = await contract.pledgeToCampaign(campaignCount - 1n, {
      value: pledgeAmount
    });
    
    console.log("Making pledge of 2 RON...");
    const receipt = await pledgeTx.wait();
    console.log("✅ Pledge successful, transaction hash:", receipt.hash);

    // Check for raffle request events
    const raffleRequestEvents = receipt.logs?.filter(log => {
      try {
        const parsed = contract.interface.parseLog(log);
        return parsed?.name === "CampaignRaffleRequested";
      } catch {
        return false;
      }
    });
    
    if (raffleRequestEvents && raffleRequestEvents.length > 0) {
      console.log("🎰 Raffle requested!");
      console.log("✅ VRF integration working correctly");
    } else {
      console.log("ℹ️  No raffle triggered (pledge amount may be below 10% threshold)");
    }

  } catch (error) {
    console.error("Error in campaign flow:", error.message);
  }

  console.log("\n--- VRF Integration Test Complete ---");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 