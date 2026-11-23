const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

async function runSetup() {
  const rootDir = path.resolve(__dirname, "../..");
  const buildDir = path.resolve(__dirname, "../build/v1");
  const contractsDir = path.resolve(__dirname, "../../contracts/contracts");
  const contractsV1Dir = path.resolve(__dirname, "../../contracts/contracts/v1");
  const frontendZkpDir = path.resolve(__dirname, "../../frontend/public/zkp/v1");
  const snarkjsBin = path.resolve(rootDir, "node_modules/snarkjs/build/cli.cjs");

  [buildDir, contractsDir, contractsV1Dir, frontendZkpDir].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  console.log("=== HealthShield Groth16 Trusted Setup (pot15) ===");

  const r1csPath = path.join(buildDir, "claim_eligibility.r1cs");
  const pot15_0000 = path.join(buildDir, "pot15_0000.ptau");
  const pot15_0001 = path.join(buildDir, "pot15_0001.ptau");
  const pot15_final = path.join(buildDir, "pot15_final.ptau");
  const zkey_0000 = path.join(buildDir, "claim_eligibility_v1_0000.zkey");
  const zkey_final = path.join(buildDir, "claim_eligibility_v1_final.zkey");
  const vkeyPath = path.join(buildDir, "verification_key_v1.json");
  const solidityVerifierV1Path = path.join(contractsV1Dir, "Verifier_v1.sol");
  const solidityVerifierRootPath = path.join(contractsDir, "Verifier_v1.sol");

  const run = (cmd) => {
    console.log(`> ${cmd}`);
    execSync(cmd, { stdio: "inherit", cwd: rootDir });
  };

  if (!fs.existsSync(pot15_0000)) {
    console.log("[1/6] Creating pot15 accumulator...");
    run(`node "${snarkjsBin}" powersoftau new bn128 15 "${pot15_0000}" -v`);
  }

  if (!fs.existsSync(pot15_0001)) {
    console.log("[2/6] Contributing randomness to ceremony...");
    run(`node "${snarkjsBin}" powersoftau contribute "${pot15_0000}" "${pot15_0001}" --name="HealthShield-1" -v -e="entropy-12345"`);
  }

  if (!fs.existsSync(pot15_final)) {
    console.log("[3/6] Preparing phase 2...");
    run(`node "${snarkjsBin}" powersoftau prepare phase2 "${pot15_0001}" "${pot15_final}" -v`);
  }

  if (!fs.existsSync(zkey_final)) {
    console.log("[4/6] Creating Groth16 proving key (zkey)...");
    run(`node "${snarkjsBin}" groth16 setup "${r1csPath}" "${pot15_final}" "${zkey_0000}"`);
    run(`node "${snarkjsBin}" zkey contribute "${zkey_0000}" "${zkey_final}" --name="HealthShield-ZKey" -v -e="entropy-zkey-67890"`);
  }

  console.log("[5/6] Exporting verification key...");
  run(`node "${snarkjsBin}" zkey export verificationkey "${zkey_final}" "${vkeyPath}"`);

  console.log("[6/6] Generating Verifier_v1.sol for Solidity...");
  run(`node "${snarkjsBin}" zkey export solidityverifier "${zkey_final}" "${solidityVerifierV1Path}"`);

  let verifierContent = fs.readFileSync(solidityVerifierV1Path, "utf-8");
  if (!verifierContent.includes("contract Groth16Verifier")) {
    verifierContent = verifierContent.replace(/contract Verifier/g, "contract Groth16Verifier");
    fs.writeFileSync(solidityVerifierV1Path, verifierContent, "utf-8");
  }
  fs.copyFileSync(solidityVerifierV1Path, solidityVerifierRootPath);

  console.log("[Sync] Copying artifacts to frontend public directory...");
  const wasmSrc = path.join(buildDir, "claim_eligibility_js", "claim_eligibility.wasm");
  fs.copyFileSync(wasmSrc, path.join(frontendZkpDir, "claim_eligibility_v1.wasm"));
  fs.copyFileSync(zkey_final, path.join(frontendZkpDir, "claim_eligibility_v1_final.zkey"));
  fs.copyFileSync(vkeyPath, path.join(frontendZkpDir, "verification_key_v1.json"));

  console.log("=== Setup Complete! Generated Verifier_v1.sol & synchronized frontend zkp assets ===");
}

runSetup().catch((err) => {
  console.error("Setup error:", err);
  process.exit(1);
});
