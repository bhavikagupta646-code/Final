import mongoose, { Document, Schema } from "mongoose";

export interface IMedicalRecord extends Document {
  recordId: string;
  patientId: mongoose.Types.ObjectId;
  patientWallet: string;
  hospitalId: mongoose.Types.ObjectId;
  hospitalWallet: string;
  encryptedPayload: string; // AES-256-GCM ciphertext hex
  iv: string; // 12-byte IV hex
  authTag: string; // 16-byte auth tag hex
  envelopeKeys: Array<{
    recipientWallet: string;
    encryptedKey: string; // Encrypted DEK
  }>;
  recordHash: string; // HMAC-SHA256 for integrity verification
  hospitalBabyJubjubSignature: {
    r8x: string;
    r8y: string;
    s: string;
  };
  encounterNonce: string;
  createdAt: Date;
  updatedAt: Date;
}

const MedicalRecordSchema = new Schema<IMedicalRecord>(
  {
    recordId: { type: String, required: true, unique: true },
    patientId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    patientWallet: { type: String, required: true, lowercase: true },
    hospitalId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    hospitalWallet: { type: String, required: true, lowercase: true },
    encryptedPayload: { type: String, required: true },
    iv: { type: String, required: true },
    authTag: { type: String, required: true },
    envelopeKeys: [
      {
        recipientWallet: { type: String, required: true, lowercase: true },
        encryptedKey: { type: String, required: true },
      },
    ],
    recordHash: { type: String, required: true },
    hospitalBabyJubjubSignature: {
      r8x: { type: String, required: true },
      r8y: { type: String, required: true },
      s: { type: String, required: true },
    },
    encounterNonce: { type: String, required: true },
  },
  { timestamps: true }
);

export const MedicalRecord = mongoose.model<IMedicalRecord>("MedicalRecord", MedicalRecordSchema);
