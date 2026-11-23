import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { ethers } from "ethers";
import * as crypto from "crypto";
import { User, IUser } from "../models/User.model";
import { Policy } from "../models/Policy.model";
import { AuditLog } from "../models/AuditLog.model";
import { CryptoService } from "../services/crypto.service";
import { registryContract } from "../config/web3";
import { ENV } from "../config/env";
import { UserRole } from "../constants/roles";

export class AuthController {
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const {
        email,
        password,
        role,
        fullName,
        walletAddress,
        phone,
        dateOfBirth,
        policyNumber,
        hospitalName,
        hospitalId,
        registrationLicenseNo,
        staffName,
        staffId,
        companyName,
        insurerId,
        licenseCode,
        officerName,
      } = req.body;

      if (!email || !password || !role) {
        res.status(400).json({ success: false, error: "Email, password, and role are required." });
        return;
      }

      const normalizedEmail = email.toLowerCase().trim();
      const emailBlindIndex = CryptoService.computeHMAC(normalizedEmail);

      // Check duplicate by email or blind index
      const duplicateQuery: any[] = [
        { email: normalizedEmail },
        { emailBlindIndex },
      ];

      let finalWallet = walletAddress ? walletAddress.toLowerCase().trim() : null;
      if (finalWallet && ethers.isAddress(finalWallet)) {
        duplicateQuery.push({ walletAddress: finalWallet });
      } else {
        // Deterministically assign a valid fresh EVM wallet address so Web3/contract calls work out of the box
        finalWallet = ethers.Wallet.createRandom().address.toLowerCase();
      }

      const existingUser = await User.findOne({ $or: duplicateQuery });
      if (existingUser) {
        res.status(409).json({ success: false, error: "An account with this email or wallet address is already registered." });
        return;
      }

      const passwordHash = await CryptoService.hashPassword(password);

      // Envelope Encryption Keys (X25519 keypair + DEK)
      const x25519Keypair = CryptoService.generateX25519KeyPair();
      const userDek = CryptoService.generateDEK();
      const encDek = CryptoService.encryptAES256GCM(userDek);
      const encPrivKey = CryptoService.encryptAES256GCM(x25519Keypair.privateKeyHex);

      // Role-specific setup
      let effectiveFullName = fullName?.trim() || "";
      let orgName: string | undefined;
      let licNum: string | undefined;
      let entId: string | undefined;
      let stfId: string | undefined;
      let babyJubjubPublic: { ax: string; ay: string } | undefined;
      let babyJubjubEncryptedPriv: { ciphertext: string; iv: string; authTag: string } | undefined;
      let encPatientSecret: { ciphertext: string; iv: string; authTag: string } | undefined;

      const userRole = role as UserRole;

      if (userRole === UserRole.PATIENT) {
        effectiveFullName = effectiveFullName || "Valued Patient";
        const rawSecret = crypto.randomBytes(16).toString("hex");
        encPatientSecret = CryptoService.encryptAES256GCM(rawSecret);
      } else if (userRole === UserRole.HOSPITAL) {
        effectiveFullName = staffName?.trim() || effectiveFullName || "Medical Staff";
        orgName = hospitalName?.trim() || "Accredited Medical Center";
        entId = hospitalId?.trim() || `HOSP-HS-${Math.floor(100 + Math.random() * 900)}`;
        licNum = registrationLicenseNo?.trim() || `LIC-HOSP-${Math.floor(1000 + Math.random() * 9000)}`;
        stfId = staffId?.trim() || `STAFF-${Math.floor(1000 + Math.random() * 9000)}`;

        // Generate genuine BabyJubjub EdDSA signing keypair
        const bjj = await CryptoService.generateBabyJubjubKeyPair();
        babyJubjubPublic = { ax: bjj.ax, ay: bjj.ay };
        babyJubjubEncryptedPriv = CryptoService.encryptAES256GCM(bjj.privKeyHex);
      } else if (userRole === UserRole.INSURER) {
        effectiveFullName = officerName?.trim() || effectiveFullName || "Underwriting Officer";
        orgName = companyName?.trim() || "Health Assurance Ltd.";
        entId = insurerId?.trim() || `INS-HS-${Math.floor(100 + Math.random() * 900)}`;
        licNum = licenseCode?.trim() || `IRDAI-${Math.floor(1000 + Math.random() * 9000)}`;
      }

      // Create User in MongoDB
      const newUser = await User.create({
        email: normalizedEmail,
        emailBlindIndex,
        passwordHash,
        role: userRole,
        fullName: effectiveFullName,
        walletAddress: finalWallet,
        publicKeyHex: x25519Keypair.publicKeyHex,
        phone: phone || undefined,
        dateOfBirth: dateOfBirth || undefined,
        organizationName: orgName,
        licenseNumber: licNum,
        entityId: entId,
        staffId: stfId,
        babyJubjubPublicKey: babyJubjubPublic,
        babyJubjubPrivateKeyEncrypted: babyJubjubEncryptedPriv,
        encryptedVault: {
          dekCiphertext: encDek.ciphertext,
          dekIv: encDek.iv,
          dekAuthTag: encDek.authTag,
          privKeyCiphertext: encPrivKey.ciphertext,
          privKeyIv: encPrivKey.iv,
          privKeyAuthTag: encPrivKey.authTag,
          patientSecretCiphertext: encPatientSecret?.ciphertext,
        },
      });

      // Role-specific post-provisioning
      if (userRole === UserRole.PATIENT) {
        // Auto-provision an active policy linked to default insurer
        const existingInsurer = await User.findOne({ role: UserRole.INSURER });
        const assignedInsurerWallet = existingInsurer?.walletAddress || "0x90f79bf6eb2c4f870365e785982e1f101e93b906";
        const assignedPolicyNumber = policyNumber?.trim() || `POL-HS-2026-${Math.floor(1000 + Math.random() * 9000)}`;
        const assignedPolicyId = `${Math.floor(10000000 + Math.random() * 90000000)}`;

        await Policy.create({
          policyId: assignedPolicyId,
          patientId: newUser._id,
          patientWallet: newUser.walletAddress,
          insurerId: existingInsurer?._id || newUser._id,
          insurerWallet: assignedInsurerWallet,
          policyNumber: assignedPolicyNumber,
          coverageLimitCents: 10000000, // ₹1,00,000 / $100,000 in cents
          deductibleCents: 500000,      // ₹5,000 / $5,000 in cents
          coPayBasisPoints: 2000,       // 20%
          authorizedDiagnosisRoot: "12345678901234567890123456789012345678901234567890",
          status: "ACTIVE",
          validFrom: new Date(),
          validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        });
      } else if (userRole === UserRole.HOSPITAL && babyJubjubPublic) {
        // On-chain registration attempt (wrapped in graceful try/catch)
        try {
          const tx = await registryContract.registerHospital(
            newUser.walletAddress,
            entId || "HOSP-HS",
            orgName || "Hospital",
            BigInt(babyJubjubPublic.ax),
            BigInt(babyJubjubPublic.ay)
          );
          await tx.wait(1);
          console.log(`[Blockchain] Registered hospital on HealthShieldRegistry: ${tx.hash}`);
        } catch (blockchainErr: any) {
          console.warn("[Blockchain] Registry call skipped or offline:", blockchainErr.message);
        }
      } else if (userRole === UserRole.INSURER) {
        // On-chain registration attempt (wrapped in graceful try/catch)
        try {
          const tx = await registryContract.registerInsurer(
            newUser.walletAddress,
            entId || "INS-HS",
            orgName || "Insurer"
          );
          await tx.wait(1);
          console.log(`[Blockchain] Registered insurer on HealthShieldRegistry: ${tx.hash}`);
        } catch (blockchainErr: any) {
          console.warn("[Blockchain] Registry call skipped or offline:", blockchainErr.message);
        }
      }

      // Audit Log
      await AuditLog.create({
        eventType: "USER_REGISTERED",
        actorWallet: newUser.walletAddress,
        actorRole: newUser.role,
        targetResource: "User",
        resourceId: newUser._id.toString(),
      });

      // Generate Access & Refresh Tokens
      const accessToken = jwt.sign(
        {
          id: newUser._id.toString(),
          email: newUser.email,
          role: newUser.role,
          walletAddress: newUser.walletAddress,
        },
        ENV.JWT_SECRET,
        { expiresIn: "15m" }
      );

      const refreshToken = jwt.sign(
        { id: newUser._id.toString() },
        ENV.JWT_REFRESH_SECRET,
        { expiresIn: "7d" }
      );

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: ENV.NODE_ENV === "production",
        sameSite: ENV.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(201).json({
        success: true,
        data: {
          user: {
            id: newUser._id,
            email: newUser.email,
            role: newUser.role,
            fullName: newUser.fullName,
            walletAddress: newUser.walletAddress,
            organizationName: newUser.organizationName,
            licenseNumber: newUser.licenseNumber,
            entityId: newUser.entityId,
            publicKeyHex: newUser.publicKeyHex,
            babyJubjubPublicKey: newUser.babyJubjubPublicKey,
          },
          accessToken,
        },
      });
    } catch (err: any) {
      console.error("[AuthController.register] Error:", err);
      res.status(500).json({ success: false, error: err.message || "Registration failed." });
    }
  }

  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ success: false, error: "Email and password are required." });
        return;
      }

      const normalizedEmail = email.toLowerCase().trim();
      const user = await User.findOne({ email: normalizedEmail });
      if (!user) {
        res.status(401).json({ success: false, error: "Invalid email or password." });
        return;
      }

      const isValid = await CryptoService.verifyPassword(user.passwordHash, password);
      if (!isValid) {
        res.status(401).json({ success: false, error: "Invalid email or password." });
        return;
      }

      const accessToken = jwt.sign(
        {
          id: user._id.toString(),
          email: user.email,
          role: user.role,
          walletAddress: user.walletAddress,
        },
        ENV.JWT_SECRET,
        { expiresIn: "15m" }
      );

      const refreshToken = jwt.sign(
        { id: user._id.toString() },
        ENV.JWT_REFRESH_SECRET,
        { expiresIn: "7d" }
      );

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: ENV.NODE_ENV === "production",
        sameSite: ENV.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(200).json({
        success: true,
        data: {
          user: {
            id: user._id,
            email: user.email,
            role: user.role,
            fullName: user.fullName,
            walletAddress: user.walletAddress,
            organizationName: user.organizationName,
            licenseNumber: user.licenseNumber,
            entityId: user.entityId,
            publicKeyHex: user.publicKeyHex,
            babyJubjubPublicKey: user.babyJubjubPublicKey,
          },
          accessToken,
        },
      });
    } catch (err: any) {
      console.error("[AuthController.login] Error:", err);
      res.status(500).json({ success: false, error: err.message || "Login failed." });
    }
  }

  static async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const token = req.cookies?.refreshToken || req.body?.refreshToken;
      if (!token) {
        res.status(401).json({ success: false, error: "Refresh token required." });
        return;
      }

      const decoded = jwt.verify(token, ENV.JWT_REFRESH_SECRET) as { id: string };
      const user = await User.findById(decoded.id);

      if (!user) {
        res.status(401).json({ success: false, error: "User not found." });
        return;
      }

      const accessToken = jwt.sign(
        {
          id: user._id.toString(),
          email: user.email,
          role: user.role,
          walletAddress: user.walletAddress,
        },
        ENV.JWT_SECRET,
        { expiresIn: "15m" }
      );

      res.status(200).json({ success: true, data: { accessToken } });
    } catch {
      res.status(401).json({ success: false, error: "Invalid or expired refresh token." });
    }
  }

  static async me(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: "Not authenticated." });
        return;
      }

      const user = await User.findById(req.user.id).select("-passwordHash -encryptedVault -babyJubjubPrivateKeyEncrypted");
      if (!user) {
        res.status(404).json({ success: false, error: "User not found." });
        return;
      }

      res.status(200).json({ success: true, data: { user } });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async logout(_req: Request, res: Response): Promise<void> {
    res.clearCookie("refreshToken");
    res.status(200).json({ success: true, message: "Logged out successfully." });
  }
}
