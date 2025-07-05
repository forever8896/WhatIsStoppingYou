const { ethers } = require("hardhat");

async function main() {
  console.log("Testing VRF Integration...");

  // Replace with your deployed contract address
  const CONTRACT_ADDRESS = "0x69814cd24a5be9668155d4e300eabb4260a60a97"; // Update this
  
  const PledgeToCreate = await ethers.getContractFactory("PledgeToCreate");
  const contract = PledgeToCreate.attach(CONTRACT_ADDRESS);

  // Get current gas price
  const gasPrice = await contract.getGasPrice();
  console.log("Current gas price:", ethers.utils.formatUnits(gasPrice, "gwei"), "GWEI");

  // Check minimum gas price requirement (21 GWEI)
  const minGasPrice = ethers.utils.parseUnits("21", "gwei");
  console.log("Minimum gas price:", ethers.utils.formatUnits(minGasPrice, "gwei"), "GWEI");
  console.log("Gas price meets minimum:", gasPrice.gte(minGasPrice));

  // Estimate VRF fee
  try {
    const estimatedFee = await contract.estimateVRFRequestFee();
    console.log("Estimated VRF fee:", ethers.utils.formatEther(estimatedFee), "RON");
    
    // Check contract balance
    const balance = await ethers.provider.getBalance(CONTRACT_ADDRESS);
    console.log("Contract balance:", ethers.utils.formatEther(balance), "RON");
    console.log("Has sufficient funds for VRF:", balance.gte(estimatedFee));
    
    if (balance.lt(estimatedFee)) {
      console.log("⚠️  Contract needs funding for VRF requests");
      console.log("Required:", ethers.utils.formatEther(estimatedFee), "RON");
      console.log("Available:", ethers.utils.formatEther(balance), "RON");
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
      ethers.utils.parseEther("10.0") // 10 RON goal
    );
    await createTx.wait();
    console.log("✅ Campaign created successfully");

    // Get campaign count
    const campaignCount = await contract.campaignCount();
    console.log("Total campaigns:", campaignCount.toString());

    // Make a pledge that should trigger raffle (>10% of goal)
    const pledgeAmount = ethers.utils.parseEther("2.0"); // 2 RON pledge
    const pledgeTx = await contract.pledgeToCampaign(campaignCount.sub(1), {
      value: pledgeAmount
    });
    
    console.log("Making pledge of 2 RON...");
    const receipt = await pledgeTx.wait();
    console.log("✅ Pledge successful, transaction hash:", receipt.transactionHash);

    // Check for raffle request events
    const raffleRequestEvents = receipt.events?.filter(e => e.event === "CampaignRaffleRequested");
    if (raffleRequestEvents && raffleRequestEvents.length > 0) {
      console.log("🎰 Raffle requested! Request hash:", raffleRequestEvents[0].args.requestHash);
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