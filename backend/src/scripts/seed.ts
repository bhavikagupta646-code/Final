import mongoose from "mongoose";
import { connectDB, disconnectDB } from "../config/db";
import { User } from "../models/User.model";
import { Policy } from "../models/Policy.model";
import { CryptoService } from "../services/crypto.service";
import { UserRole } from "../constants/roles";

async function seed() {
  console.log("🌱 Seeding HealthShield database...");
  await connectDB();

  // Clear existing demo entities
  await User.deleteMany({ email: { $in: ["patient@healthshield.dev", "hospital@healthshield.dev", "insurer@healthshield.dev", "admin@healthshield.dev"] } });

  const passwordHash = await CryptoService.hashPassword("HealthShield2026!");
  const patientKeypair = CryptoService.generateX25519KeyPair();
  const hospitalKeypair = CryptoService.generateX25519KeyPair();
  const insurerKeypair = CryptoService.generateX25519KeyPair();

  // 1. Patient
  const patient = await User.create({
    email: "patient@healthshield.dev",
    passwordHash,
    role: UserRole.PATIENT,
    fullName: "Alex Mercer",
    walletAddress: "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
    publicKeyHex: patientKeypair.publicKeyHex,
  });

  // 2. Hospital
  const hospital = await User.create({
    email: "hospital@healthshield.dev",
    passwordHash,
    role: UserRole.HOSPITAL,
    fullName: "Dr. Elena Rostova",
    walletAddress: "0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc",
    organizationName: "Metropolitan General Hospital",
    licenseNumber: "HOSP-NY-9921",
    publicKeyHex: hospitalKeypair.publicKeyHex,
    babyJubjubPublicKey: {
      ax: "1122334455667788990011223344556677889900112233445566778899001122",
      ay: "9988776655443322110099887766554433221100998877665544332211009988",
    },
  });

  // 3. Insurer
  const insurer = await User.create({
    email: "insurer@healthshield.dev",
    passwordHash,
    role: UserRole.INSURER,
    fullName: "Aegis Health Underwriting",
    walletAddress: "0x90f79bf6eb2c4f870365e785982e1f101e93b906",
    organizationName: "Aegis Life & Health Assurance Ltd.",
    licenseNumber: "INS-US-4029",
    publicKeyHex: insurerKeypair.publicKeyHex,
  });

  // 4. Policy for Patient
  await Policy.deleteMany({ policyNumber: "POL-HS-2026-99" });
  await Policy.create({
    policyId: "20269941",
    patientId: patient._id,
    patientWallet: patient.walletAddress,
    insurerId: insurer._id,
    insurerWallet: insurer.walletAddress,
    policyNumber: "POL-HS-2026-99",
    coverageLimitCents: 5000000, // $50,000
    deductibleCents: 50000, // $500
    coPayBasisPoints: 2000, // 20%
    authorizedDiagnosisRoot: "12345678901234567890123456789012345678901234567890",
    status: "ACTIVE",
    validFrom: new Date("2026-01-01"),
    validUntil: new Date("2026-12-31"),
  });

  console.log("✅ Seed completed successfully!");
  console.log("Demo Credentials: Password for all is HealthShield2026!");
  console.log("- Patient: patient@healthshield.dev (Wallet: 0x70997970c51812dc3a010c7d01b50e0d17dc79c8)");
  console.log("- Hospital: hospital@healthshield.dev (Wallet: 0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc)");
  console.log("- Insurer: insurer@healthshield.dev (Wallet: 0x90f79bf6eb2c4f870365e785982e1f101e93b906)");

  await disconnectDB();
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
