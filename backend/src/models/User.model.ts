import mongoose, { Document, Schema } from "mongoose";
import { UserRole } from "../constants/roles";

export interface IUser extends Document {
  email: string;
  emailBlindIndex?: string;
  passwordHash: string;
  role: UserRole;
  fullName: string;
  walletAddress: string;
  publicKeyHex?: string; // X25519 public key hex for envelope encryption
  babyJubjubPublicKey?: {
    ax: string;
    ay: string;
  };
  organizationName?: string;
  licenseNumber?: string;
  entityId?: string;
  staffId?: string;
  phone?: string;
  dateOfBirth?: string;
  encryptedVault?: {
    dekCiphertext: string;
    dekIv: string;
    dekAuthTag: string;
    privKeyCiphertext?: string;
    privKeyIv?: string;
    privKeyAuthTag?: string;
    patientSecretCiphertext?: string;
  };
  babyJubjubPrivateKeyEncrypted?: {
    ciphertext: string;
    iv: string;
    authTag: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    emailBlindIndex: { type: String, index: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: Object.values(UserRole), required: true },
    fullName: { type: String, required: true, trim: true },
    walletAddress: { type: String, required: true, lowercase: true, trim: true },
    publicKeyHex: { type: String },
    babyJubjubPublicKey: {
      ax: { type: String },
      ay: { type: String },
    },
    organizationName: { type: String },
    licenseNumber: { type: String },
    entityId: { type: String },
    staffId: { type: String },
    phone: { type: String },
    dateOfBirth: { type: String },
    encryptedVault: {
      dekCiphertext: { type: String },
      dekIv: { type: String },
      dekAuthTag: { type: String },
      privKeyCiphertext: { type: String },
      privKeyIv: { type: String },
      privKeyAuthTag: { type: String },
      patientSecretCiphertext: { type: String },
    },
    babyJubjubPrivateKeyEncrypted: {
      ciphertext: { type: String },
      iv: { type: String },
      authTag: { type: String },
    },
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>("User", UserSchema);
