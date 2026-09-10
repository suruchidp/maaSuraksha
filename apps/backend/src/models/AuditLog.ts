import mongoose, { Schema, Document } from "mongoose";

export interface IAuditLogDocument extends Document {
  user: mongoose.Types.ObjectId;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: Date;
  updatedAt: Date;
}

const auditLogSchema = new Schema<IAuditLogDocument>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    action: { type: String, required: true },
    resource: { type: String, required: true },
    resourceId: { type: String },
    details: { type: Schema.Types.Mixed },
    ipAddress: { type: String },
  },
  { timestamps: true }
);

auditLogSchema.index({ user: 1 });
auditLogSchema.index({ resource: 1 });
auditLogSchema.index({ createdAt: -1 });

export const AuditLog = mongoose.model<IAuditLogDocument>(
  "AuditLog",
  auditLogSchema
);
