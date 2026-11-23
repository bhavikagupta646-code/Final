import mongoose, { Document, Schema } from "mongoose";

export interface IPolicy extends Document {
  policyId: string;
  patientId: mongoose.Types.ObjectId;
  patientWallet: string;
  insurerId: mongoose.Types.ObjectId;
  insurerWallet: string;
  policyNumber: string;
  coverageLimitCents: number; // e.g., 5000000 = $50,000
  deductibleCents: number; // e.g., 50000 = $500
  coPayBasisPoints: number; // e.g., 2000 = 20%
  authorizedDiagnosisRoot: string; // Merkle root of authorized ICD-10 codes
  status: "ACTIVE" | "EXPIRED" | "TERMINATED";
  validFrom: Date;
  validUntil: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PolicySchema = new Schema<IPolicy>(
  {
    policyId: { type: String, required: true, unique: true },
    patientId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    patientWallet: { type: String, required: true, lowercase: true },
    insurerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    insurerWallet: { type: String, required: true, lowercase: true },
    policyNumber: { type: String, required: true, unique: true },
    coverageLimitCents: { type: Number, required: true },
    deductibleCents: { type: Number, required: true },
    coPayBasisPoints: { type: Number, required: true },
    authorizedDiagnosisRoot: { type: String, required: true },
    status: { type: String, enum: ["ACTIVE", "EXPIRED", "TERMINATED"], default: "ACTIVE" },
    validFrom: { type: Date, required: true },
    validUntil: { type: Date, required: true },
  },
  { timestamps: true }
);

export const Policy = mongoose.model<IPolicy>("Policy", PolicySchema);
