const hre = require("hardhat");

async function main() {
  console.log("Deploying SocialTipping contract...");

  // Deploy the contract
  const SocialTipping = await hre.ethers.getContractFactory("SocialTipping");
  const socialTipping = await SocialTipping.deploy();

  // Wait for deployment to complete
  await socialTipping.waitForDeployment();

  // Get the contract address
  const address = await socialTipping.getAddress();
  console.log("SocialTipping deployed to:", address);
}

// Handle errors
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 