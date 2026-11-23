import mongoose, { Document, Schema } from "mongoose";

export interface IClaim extends Document {
  claimId: string;
  nullifier: string; // Hex/Decimal nullifier to prevent double-spending
  policyId: string;
  patientWallet: string;
  hospitalWallet: string;
  insurerWallet: string;
  claimedPayoutCents: number;
  status: "SUBMITTED" | "VERIFIED_APPROVED" | "SETTLED" | "REJECTED";
  proof: {
    a: [string, string];
    b: [[string, string], [string, string]];
    c: [string, string];
  };
  publicSignals: string[]; // Fixed 12 public signals
  onChainTxHash?: string;
  submittedAt: Date;
  settledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ClaimSchema = new Schema<IClaim>(
  {
    claimId: { type: String, required: true, unique: true },
    nullifier: { type: String, required: true, unique: true },
    policyId: { type: String, required: true },
    patientWallet: { type: String, required: true, lowercase: true },
    hospitalWallet: { type: String, required: true, lowercase: true },
    insurerWallet: { type: String, required: true, lowercase: true },
    claimedPayoutCents: { type: Number, required: true },
    status: {
      type: String,
      enum: ["SUBMITTED", "VERIFIED_APPROVED", "SETTLED", "REJECTED"],
      default: "VERIFIED_APPROVED",
    },
    proof: {
      a: [{ type: String }],
      b: [[{ type: String }]],
      c: [{ type: String }],
    },
    publicSignals: [{ type: String }],
    onChainTxHash: { type: String },
    submittedAt: { type: Date, default: Date.now },
    settledAt: { type: Date },
  },
  { timestamps: true }
);

export const Claim = mongoose.model<IClaim>("Claim", ClaimSchema);
