const fs = require("node:fs");
const path = require("node:path");
const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const owner = process.env.ESCROW_OWNER_ADDRESS || deployer.address;

  const factory = await hre.ethers.getContractFactory("BaseEscrowSettlement");
  const contract = await factory.deploy(owner);
  await contract.waitForDeployment();

  const network = await hre.ethers.provider.getNetwork();
  const deployment = {
    contractName: "BaseEscrowSettlement",
    address: await contract.getAddress(),
    deployer: deployer.address,
    owner,
    network: hre.network.name,
    chainId: Number(network.chainId),
    txHash: contract.deploymentTransaction()?.hash ?? null,
    deployedAt: new Date().toISOString()
  };

  const deploymentDir = path.join(__dirname, "..", "deployments");
  fs.mkdirSync(deploymentDir, { recursive: true });
  const deploymentPath = path.join(deploymentDir, `${hre.network.name}.base-escrow-settlement.json`);
  fs.writeFileSync(deploymentPath, `${JSON.stringify(deployment, null, 2)}\n`, "utf8");

  console.log(`Deployed BaseEscrowSettlement to ${deployment.address} on ${hre.network.name}`);
  console.log(`Deployment metadata written to ${deploymentPath}`);

  if (process.env.VERIFY_CONTRACT === "true") {
    console.log("Submitting source verification request to Basescan...");
    await hre.run("verify:verify", {
      address: deployment.address,
      constructorArguments: [owner]
    });
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
