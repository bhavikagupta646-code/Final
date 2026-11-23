import { expect } from "chai";
import { ethers } from "hardhat";
import { HealthShieldRegistry, InsuranceClaimManager, MockVerifier } from "../typechain-types";

describe("HealthShield Smart Contract Suite", () => {
  let registry: HealthShieldRegistry;
  let mockVerifier: MockVerifier;
  let claimManager: InsuranceClaimManager;
  let admin: any;
  let patient: any;
  let hospital: any;
  let insurer: any;
  let attacker: any;

  // Mock 12 public inputs matching ClaimEligibility circuit
  const MOCK_AUTH_ROOT = 12345678901234567890n;
  const MOCK_HOSP_AX = 98765432109876543210n;
  const MOCK_HOSP_AY = 11223344556677889900n;
  const MOCK_POLICY_LIMIT = 5000000n; // $50,000 in cents
  const MOCK_DEDUCTIBLE = 50000n; // $500 in cents
  const MOCK_COPAY_BPS = 2000n; // 20%
  const MOCK_PAYOUT = 360000n; // $3,600
  const MOCK_NULLIFIER = 998877665544332211n;
  const MOCK_POLICY_ID = 20269941n;

  const mockProofA: [bigint, bigint] = [1n, 2n];
  const mockProofB: [[bigint, bigint], [bigint, bigint]] = [
    [1n, 2n],
    [3n, 4n],
  ];
  const mockProofC: [bigint, bigint] = [5n, 6n];

  beforeEach(async () => {
    [admin, patient, hospital, insurer, attacker] = await ethers.getSigners();

    // 1. Deploy HealthShieldRegistry
    const RegistryFactory = await ethers.getContractFactory("HealthShieldRegistry");
    registry = await RegistryFactory.deploy(admin.address);
    await registry.waitForDeployment();

    // 2. Deploy MockVerifier
    const MockVerifierFactory = await ethers.getContractFactory("MockVerifier");
    mockVerifier = await MockVerifierFactory.deploy();
    await mockVerifier.waitForDeployment();

    // 3. Deploy InsuranceClaimManager
    const ClaimManagerFactory = await ethers.getContractFactory("InsuranceClaimManager");
    claimManager = await ClaimManagerFactory.deploy(await registry.getAddress(), await mockVerifier.getAddress());
    await claimManager.waitForDeployment();

    // 4. Register hospital with BabyJubjub keys
    await registry.registerHospital(
      hospital.address,
      "HOSP-APL-8821",
      "Apollo Multispeciality Hospital",
      MOCK_HOSP_AX,
      MOCK_HOSP_AY
    );

    // 5. Register insurer
    await registry.registerInsurer(insurer.address, "INS-4092", "HealthSecure Insurance Ltd.");
  });

  function buildPubSignals(overrides: Partial<{ [key: number]: bigint }> = {}): [
    bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint
  ] {
    const signals: [bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint] = [
      MOCK_AUTH_ROOT,
      MOCK_HOSP_AX,
      MOCK_HOSP_AY,
      MOCK_POLICY_LIMIT,
      MOCK_DEDUCTIBLE,
      MOCK_COPAY_BPS,
      MOCK_PAYOUT,
      MOCK_NULLIFIER,
      MOCK_POLICY_ID,
      BigInt(patient.address),
      BigInt(hospital.address),
      BigInt(insurer.address),
    ];
    for (const [idx, val] of Object.entries(overrides)) {
      signals[Number(idx)] = val!;
    }
    return signals;
  }

  describe("HealthShieldRegistry", () => {
    it("should successfully verify registered hospital credentials", async () => {
      const isCertified = await registry.isHospitalCertified(hospital.address, MOCK_HOSP_AX, MOCK_HOSP_AY);
      expect(isCertified).to.be.true;
    });

    it("should reject hospital with forged or mismatched BabyJubjub key", async () => {
      const isCertified = await registry.isHospitalCertified(hospital.address, 999999n, MOCK_HOSP_AY);
      expect(isCertified).to.be.false;
    });

    it("should verify authorized insurer", async () => {
      const isAuth = await registry.isInsurerAuthorized(insurer.address);
      expect(isAuth).to.be.true;
    });
  });

  describe("InsuranceClaimManager", () => {
    it("should accept valid claim with authentic 12 public signals", async () => {
      const pubSignals = buildPubSignals();
      const tx = await claimManager.connect(patient).submitClaim(mockProofA, mockProofB, mockProofC, pubSignals);
      await expect(tx)
        .to.emit(claimManager, "ClaimSubmittedAndApproved")
        .withArgs(MOCK_NULLIFIER, MOCK_POLICY_ID, patient.address, hospital.address, insurer.address, MOCK_PAYOUT, (v: any) => v > 0);

      const claim = await claimManager.getClaim(MOCK_NULLIFIER);
      expect(claim.status).to.equal(1); // VERIFIED_APPROVED
      expect(claim.claimedPayout).to.equal(MOCK_PAYOUT);
      expect(await claimManager.isClaimSpent(MOCK_NULLIFIER)).to.be.true;
    });

    it("should revert on double spending / replaying the same nullifier", async () => {
      const pubSignals = buildPubSignals();
      await claimManager.connect(patient).submitClaim(mockProofA, mockProofB, mockProofC, pubSignals);

      await expect(
        claimManager.connect(patient).submitClaim(mockProofA, mockProofB, mockProofC, pubSignals)
      ).to.be.revertedWithCustomError(claimManager, "NullifierAlreadySpent");
    });

    it("should revert if hospital is not certified in registry", async () => {
      const uncertifiedSignals = buildPubSignals({ 10: BigInt(attacker.address) });
      await expect(
        claimManager.connect(patient).submitClaim(mockProofA, mockProofB, mockProofC, uncertifiedSignals)
      ).to.be.revertedWithCustomError(claimManager, "HospitalNotCertified");
    });

    it("should revert if insurer is not authorized", async () => {
      const unauthorizedSignals = buildPubSignals({ 11: BigInt(attacker.address) });
      await expect(
        claimManager.connect(patient).submitClaim(mockProofA, mockProofB, mockProofC, unauthorizedSignals)
      ).to.be.revertedWithCustomError(claimManager, "InsurerNotAuthorized");
    });

    it("should revert if Groth16 proof fails verification", async () => {
      await mockVerifier.setShouldPass(false);
      const pubSignals = buildPubSignals();
      await expect(
        claimManager.connect(patient).submitClaim(mockProofA, mockProofB, mockProofC, pubSignals)
      ).to.be.revertedWithCustomError(claimManager, "InvalidZKProof");
    });

    it("should allow insurer to settle approved claim", async () => {
      const pubSignals = buildPubSignals();
      await claimManager.connect(patient).submitClaim(mockProofA, mockProofB, mockProofC, pubSignals);

      const settleTx = await claimManager.connect(insurer).settleClaim(MOCK_NULLIFIER);
      await expect(settleTx)
        .to.emit(claimManager, "ClaimSettled")
        .withArgs(MOCK_NULLIFIER, insurer.address, MOCK_PAYOUT, (v: any) => v > 0);

      const claim = await claimManager.getClaim(MOCK_NULLIFIER);
      expect(claim.status).to.equal(2); // SETTLED
    });
  });
});
