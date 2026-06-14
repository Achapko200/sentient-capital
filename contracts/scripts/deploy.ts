const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  const USDC_ARC_TESTNET = "0x3600000000000000000000000000000000000000";
  const PLATFORM_WALLET = process.env.PLATFORM_WALLET ?? deployer.address;

  const CardEscrow = await hre.ethers.getContractFactory("CardEscrow");
  const escrow = await CardEscrow.deploy(USDC_ARC_TESTNET, PLATFORM_WALLET);

  await escrow.waitForDeployment();

  const address = await escrow.getAddress();
  console.log("CardEscrow deployed to:", address);
  console.log("USDC address:", USDC_ARC_TESTNET);
  console.log("Platform wallet:", PLATFORM_WALLET);
  console.log("\nAdd to .env.local: NEXT_PUBLIC_ESCROW_ADDRESS=" + address);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});