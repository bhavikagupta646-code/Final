import { Request, Response } from "express";
import { MedicalRecord } from "../models/MedicalRecord.model";
import { User } from "../models/User.model";
import { AuditLog } from "../models/AuditLog.model";
import { CryptoService } from "../services/crypto.service";
import { SSEService } from "../services/sse.service";
import { UserRole } from "../constants/roles";

export class RecordController {
  /**
   * Hospital creates encrypted medical record
   */
  static async createRecord(req: Request, res: Response): Promise<void> {
    try {
      const hospitalUser = req.user!;
      const {
        patientWallet,
        diagnosisCode,
        billedAmountCents,
        encounterDetails,
        hospitalBabyJubjubSignature,
        encounterNonce,
      } = req.body;

      if (!patientWallet || !diagnosisCode || !billedAmountCents) {
        res.status(400).json({ success: false, error: "Missing required record fields." });
        return;
      }

      const patient = await User.findOne({ walletAddress: patientWallet.toLowerCase() });
      if (!patient) {
        res.status(404).json({ success: false, error: "Patient wallet not registered in HealthShield." });
        return;
      }

      // Generate random Data Encryption Key (DEK) for this specific record
      const dek = CryptoService.generateX25519KeyPair().privateKeyHex.slice(0, 64);

      // Encrypt sensitive clinical payload with DEK using AES-256-GCM
      const rawPayload = JSON.stringify({
        diagnosisCode,
        billedAmountCents,
        encounterDetails: encounterDetails || "General Consultation & Treatment",
        hospitalWallet: hospitalUser.walletAddress,
        patientWallet: patient.walletAddress,
        createdAt: new Date().toISOString(),
      });

      const { ciphertext, iv, authTag } = CryptoService.encryptAES256GCM(rawPayload, dek);

      // Envelope encryption: encrypt DEK with master key (and recipient key if configured)
      const encryptedDek = CryptoService.encryptAES256GCM(dek);

      const recordHash = CryptoService.computeHMAC(ciphertext + iv + authTag);

      const recordId = `REC-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;

      const newRecord = await MedicalRecord.create({
        recordId,
        patientId: patient._id,
        patientWallet: patient.walletAddress,
        hospitalId: hospitalUser.id,
        hospitalWallet: hospitalUser.walletAddress,
        encryptedPayload: ciphertext,
        iv,
        authTag,
        envelopeKeys: [
          {
            recipientWallet: patient.walletAddress,
            encryptedKey: JSON.stringify(encryptedDek),
          },
          {
            recipientWallet: hospitalUser.walletAddress,
            encryptedKey: JSON.stringify(encryptedDek),
          },
        ],
        recordHash,
        hospitalBabyJubjubSignature: hospitalBabyJubjubSignature || {
          r8x: "1122334455",
          r8y: "9988776655",
          s: "5544332211",
        },
        encounterNonce: encounterNonce || `${Date.now()}`,
      });

      // Audit log
      await AuditLog.create({
        eventType: "MEDICAL_RECORD_CREATED",
        actorWallet: hospitalUser.walletAddress,
        actorRole: hospitalUser.role,
        targetResource: "MedicalRecord",
        resourceId: newRecord.recordId,
      });

      // Real-time SSE alert to patient
      SSEService.sendToUser(patient.walletAddress, "RECORD_CREATED", {
        recordId: newRecord.recordId,
        hospitalWallet: hospitalUser.walletAddress,
        createdAt: newRecord.createdAt,
      });

      res.status(201).json({
        success: true,
        data: {
          record: {
            recordId: newRecord.recordId,
            patientWallet: newRecord.patientWallet,
            hospitalWallet: newRecord.hospitalWallet,
            recordHash: newRecord.recordHash,
            createdAt: newRecord.createdAt,
          },
        },
      });
    } catch (err: any) {
      console.error("[RecordController.createRecord] Error:", err);
      res.status(500).json({ success: false, error: err.message || "Failed to create medical record." });
    }
  }

  /**
   * Retrieves records for current user
   */
  static async getRecords(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user!;
      let filter: any = {};

      if (user.role === UserRole.PATIENT) {
        filter = { patientWallet: user.walletAddress.toLowerCase() };
      } else if (user.role === UserRole.HOSPITAL) {
        filter = { hospitalWallet: user.walletAddress.toLowerCase() };
      } else if (user.role === UserRole.ADMIN) {
        filter = {};
      } else {
        res.status(403).json({ success: false, error: "Access denied. Insurers cannot access raw medical records." });
        return;
      }

      const records = await MedicalRecord.find(filter).sort({ createdAt: -1 });

      res.status(200).json({ success: true, data: { records } });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * Decrypts specific record for authorized patient or hospital
   */
  static async decryptRecord(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user!;
      const { recordId } = req.params;

      const record = await MedicalRecord.findOne({ recordId });
      if (!record) {
        res.status(404).json({ success: false, error: "Record not found." });
        return;
      }

      if (
        user.role !== UserRole.ADMIN &&
        user.walletAddress.toLowerCase() !== record.patientWallet.toLowerCase() &&
        user.walletAddress.toLowerCase() !== record.hospitalWallet.toLowerCase()
      ) {
        res.status(403).json({ success: false, error: "Unauthorized to decrypt this record." });
        return;
      }

      // Decrypt envelope DEK
      const userKeyEntry = record.envelopeKeys.find(
        (k) => k.recipientWallet.toLowerCase() === user.walletAddress.toLowerCase()
      ) || record.envelopeKeys[0];

      const encryptedDekObj = JSON.parse(userKeyEntry.encryptedKey);
      const dek = CryptoService.decryptAES256GCM(
        encryptedDekObj.ciphertext,
        encryptedDekObj.iv,
        encryptedDekObj.authTag
      );

      // Decrypt payload with DEK
      const decryptedString = CryptoService.decryptAES256GCM(
        record.encryptedPayload,
        record.iv,
        record.authTag,
        dek
      );

      const parsedPayload = JSON.parse(decryptedString);

      res.status(200).json({
        success: true,
        data: {
          recordId: record.recordId,
          payload: parsedPayload,
          hospitalBabyJubjubSignature: record.hospitalBabyJubjubSignature,
          encounterNonce: record.encounterNonce,
        },
      });
    } catch (err: any) {
      console.error("[RecordController.decryptRecord] Error:", err);
      res.status(500).json({ success: false, error: "Decryption failed or invalid key." });
    }
  }
}
