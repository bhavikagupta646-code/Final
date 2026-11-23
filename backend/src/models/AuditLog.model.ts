import mongoose, { Document, Schema } from "mongoose";

export interface IAuditLog extends Document {
  eventType: string;
  actorWallet: string;
  actorRole: string;
  targetResource: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  timestamp: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    eventType: { type: String, required: true },
    actorWallet: { type: String, required: true, lowercase: true },
    actorRole: { type: String, required: true },
    targetResource: { type: String, required: true },
    resourceId: { type: String },
    details: { type: Schema.Types.Mixed },
    ipAddress: { type: String },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

export const AuditLog = mongoose.model<IAuditLog>("AuditLog", AuditLogSchema);
