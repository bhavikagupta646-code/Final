import { ethers, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log(`[Seed Entities] Connecting on network: ${network.name}`);
  const [admin, , hospitalSigner, insurerSigner] = await ethers.getSigners();

  const deploymentsPath = path.resolve(__dirname, "../../backend/src/contracts/deployments.json");
  if (!fs.existsSync(deploymentsPath)) {
    throw new Error("deployments.json not found! Run deploy first.");
  }

  const { contracts } = JSON.parse(fs.readFileSync(deploymentsPath, "utf-8"));
  const registry = await ethers.getContractAt("HealthShieldRegistry", contracts.HealthShieldRegistry.address, admin);

  console.log(`[Seed Entities] HealthShieldRegistry address: ${await registry.getAddress()}`);

  const hospitalAddress = hospitalSigner ? hospitalSigner.address : "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC";
  const insurerAddress = insurerSigner ? insurerSigner.address : "0x90F79bf6EB2c4f870365E785982E1f101E93b906";

  const hospitalAx = 11223344556677889900n;
  const hospitalAy = 99887766554433221100n;

  // 1. Register Hospital
  try {
    const isCert = await registry.isHospitalCertified(hospitalAddress, hospitalAx, hospitalAy);
    if (!isCert) {
      console.log(`[Seed Entities] Registering Hospital: ${hospitalAddress}...`);
      const tx = await registry.registerHospital(
        hospitalAddress,
        "HOSP-APL-8821",
        "Apollo Multispeciality Hospital",
        hospitalAx,
        hospitalAy
      );
      await tx.wait();
      console.log("[Seed Entities] Hospital registered successfully!");
    } else {
      console.log("[Seed Entities] Hospital already registered and certified.");
    }
  } catch (err: any) {
    console.log(`[Seed Entities] Hospital registration notice: ${err.message}`);
  }

  // 2. Register Insurer
  try {
    const isAuth = await registry.isInsurerAuthorized(insurerAddress);
    if (!isAuth) {
      console.log(`[Seed Entities] Registering Insurer: ${insurerAddress}...`);
      const tx = await registry.registerInsurer(
        insurerAddress,
        "INS-4092",
        "HealthSecure Insurance Ltd."
      );
      await tx.wait();
      console.log("[Seed Entities] Insurer registered successfully!");
    } else {
      console.log("[Seed Entities] Insurer already registered and authorized.");
    }
  } catch (err: any) {
    console.log(`[Seed Entities] Insurer registration notice: ${err.message}`);
  }

  console.log("[Seed Entities] On-Chain entity seeding complete!");
}

main().catch((err) => {
  console.error("[Seed Entities] Failed:", err);
  process.exitCode = 1;
});
