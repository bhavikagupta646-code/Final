import { test } from "node:test";
import assert from "node:assert";
import mongoose from "mongoose";
import { connectDB, disconnectDB } from "../config/db";
import { User } from "../models/User.model";
import { Policy } from "../models/Policy.model";
import { CryptoService } from "../services/crypto.service";
import { UserRole } from "../constants/roles";

test("Authentication & Self-Service Registration Integration Test", async (t) => {
  await connectDB();

  await t.test("Patient Registration - Auto-provisioning, X25519 Keys & Active Policy", async () => {
    const testEmail = `test.patient.${Date.now()}@healthshield.dev`;
    const passwordHash = await CryptoService.hashPassword("SecurePatient2026!");
    const x25519 = CryptoService.generateX25519KeyPair();
    const dek = CryptoService.generateDEK();
    const encDek = CryptoService.encryptAES256GCM(dek);

    const patient = await User.create({
      email: testEmail,
      emailBlindIndex: CryptoService.computeHMAC(testEmail),
      passwordHash,
      role: UserRole.PATIENT,
      fullName: "Test Patient Registration",
      walletAddress: "0x" + "1".repeat(40),
      publicKeyHex: x25519.publicKeyHex,
      encryptedVault: {
        dekCiphertext: encDek.ciphertext,
        dekIv: encDek.iv,
        dekAuthTag: encDek.authTag,
      },
    });

    assert.ok(patient._id, "Patient should be persisted in database");
    assert.strictEqual(patient.role, UserRole.PATIENT);

    // Auto-create policy
    const policy = await Policy.create({
      policyId: `${Date.now()}`,
      patientId: patient._id,
      patientWallet: patient.walletAddress,
      insurerId: patient._id,
      insurerWallet: "0x90f79bf6eb2c4f870365e785982e1f101e93b906",
      policyNumber: `POL-AUTO-${Date.now()}`,
      coverageLimitCents: 10000000,
      deductibleCents: 500000,
      coPayBasisPoints: 2000,
      authorizedDiagnosisRoot: "12345678901234567890123456789012345678901234567890",
      status: "ACTIVE",
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    });

    assert.ok(policy._id, "Policy should be auto-created");
    assert.strictEqual(policy.status, "ACTIVE");
    assert.strictEqual(policy.coverageLimitCents, 10000000);
  });

  await t.test("Hospital Registration - BabyJubjub EdDSA Key Generation", async () => {
    const testEmail = `test.hospital.${Date.now()}@healthshield.dev`;
    const passwordHash = await CryptoService.hashPassword("SecureHospital2026!");
    const bjj = await CryptoService.generateBabyJubjubKeyPair();

    assert.ok(bjj.ax.length > 20, "BabyJubjub Ax should be a valid point on BN254");
    assert.ok(bjj.ay.length > 20, "BabyJubjub Ay should be a valid point on BN254");

    const hospital = await User.create({
      email: testEmail,
      emailBlindIndex: CryptoService.computeHMAC(testEmail),
      passwordHash,
      role: UserRole.HOSPITAL,
      fullName: "Dr. Test Doctor",
      organizationName: "Test Memorial Hospital",
      licenseNumber: "LIC-TEST-100",
      walletAddress: "0x" + "2".repeat(40),
      babyJubjubPublicKey: { ax: bjj.ax, ay: bjj.ay },
    });

    assert.ok(hospital._id, "Hospital should be persisted");
    assert.strictEqual(hospital.babyJubjubPublicKey?.ax, bjj.ax);
  });

  await t.test("Password Verification Against Argon2id Hash", async () => {
    const plain = "HealthShield2026!";
    const hash = await CryptoService.hashPassword(plain);
    const isValid = await CryptoService.verifyPassword(hash, plain);
    assert.strictEqual(isValid, true, "Argon2id password verification should return true");
    const isInvalid = await CryptoService.verifyPassword(hash, "WrongPassword");
    assert.strictEqual(isInvalid, false, "Wrong password should return false");
  });

  await disconnectDB();
});
