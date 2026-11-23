import { ethers, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log(`[Deploy] Starting deployment on network: ${network.name} (Chain ID: ${network.config.chainId})`);

  const [deployer] = await ethers.getSigners();
  console.log(`[Deploy] Deployer address: ${deployer.address}`);

  // 1. Deploy HealthShieldRegistry
  console.log("[Deploy] Deploying HealthShieldRegistry...");
  const RegistryFactory = await ethers.getContractFactory("HealthShieldRegistry");
  const registry = await RegistryFactory.deploy(deployer.address);
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();
  console.log(`[Deploy] HealthShieldRegistry deployed at: ${registryAddress}`);

  // 2. Deploy Verifier_v1
  console.log("[Deploy] Deploying Verifier_v1...");
  let verifierAddress: string;
  try {
    const VerifierFactory = await ethers.getContractFactory("Groth16Verifier");
    const verifier = await VerifierFactory.deploy();
    await verifier.waitForDeployment();
    verifierAddress = await verifier.getAddress();
    console.log(`[Deploy] Groth16Verifier deployed at: ${verifierAddress}`);
  } catch (err) {
    console.warn("[Deploy] Groth16Verifier not yet compiled or present; deploying MockVerifier fallback for initial linking...");
    const MockVerifierFactory = await ethers.getContractFactory("MockVerifier");
    const mockVerifier = await MockVerifierFactory.deploy();
    await mockVerifier.waitForDeployment();
    verifierAddress = await mockVerifier.getAddress();
    console.log(`[Deploy] MockVerifier deployed at: ${verifierAddress}`);
  }

  // 3. Deploy InsuranceClaimManager
  console.log("[Deploy] Deploying InsuranceClaimManager...");
  const ClaimManagerFactory = await ethers.getContractFactory("InsuranceClaimManager");
  const claimManager = await ClaimManagerFactory.deploy(registryAddress, verifierAddress);
  await claimManager.waitForDeployment();
  const claimManagerAddress = await claimManager.getAddress();
  console.log(`[Deploy] InsuranceClaimManager deployed at: ${claimManagerAddress}`);

  // 4. Export artifacts to Backend & Frontend
  const deploymentData = {
    network: network.name,
    chainId: network.config.chainId,
    deployedAt: new Date().toISOString(),
    contracts: {
      HealthShieldRegistry: {
        address: registryAddress,
        abi: JSON.parse(registry.interface.formatJson()),
      },
      Verifier: {
        address: verifierAddress,
      },
      InsuranceClaimManager: {
        address: claimManagerAddress,
        abi: JSON.parse(claimManager.interface.formatJson()),
      },
    },
  };

  const targetDirs = [
    path.resolve(__dirname, "../../backend/src/contracts"),
    path.resolve(__dirname, "../../frontend/src/contracts"),
  ];

  for (const dir of targetDirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const filePath = path.join(dir, "deployments.json");
    fs.writeFileSync(filePath, JSON.stringify(deploymentData, null, 2), "utf-8");
    console.log(`[Deploy] Exported contract deployments to: ${filePath}`);
  }

  console.log("[Deploy] Deployment and artifact synchronization complete!");
}

main().catch((error) => {
  console.error("[Deploy] Deployment failed:", error);
  process.exitCode = 1;
});
