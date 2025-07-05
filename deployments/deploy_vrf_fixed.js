const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying PledgeToCreate with VRF fixes...");

  // Ronin VRF Coordinator address for Saigon testnet
  const VRF_COORDINATOR_ADDRESS = "0xa60c1e07fa030e4b49eb54950adb298ab94dd312";

  // Deploy the contract
  const PledgeToCreate = await ethers.getContractFactory("PledgeToCreate");
  const pledgeToCreate = await PledgeToCreate.deploy(VRF_COORDINATOR_ADDRESS);

  await pledgeToCreate.deployed();

  console.log("PledgeToCreate deployed to:", pledgeToCreate.address);
  console.log("VRF Coordinator:", VRF_COORDINATOR_ADDRESS);
  console.log("NFT Contract:", await pledgeToCreate.getNFTContract());

  // Fund the contract with some RON for VRF requests
  console.log("Funding contract for VRF requests...");
  const fundTx = await pledgeToCreate.fundForVRF({ value: ethers.utils.parseEther("1.0") });
  await fundTx.wait();
  console.log("Contract funded with 1 RON");

  // Check estimated VRF fee
  const estimatedFee = await pledgeToCreate.estimateVRFRequestFee();
  console.log("Estimated VRF fee:", ethers.utils.formatEther(estimatedFee), "RON");

  console.log("\nDeployment completed successfully!");
  console.log("Contract address:", pledgeToCreate.address);
  console.log("Make sure to update your frontend contracts.ts file with the new address");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 