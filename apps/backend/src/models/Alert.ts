import mongoose, { Schema, Document } from "mongoose";
import { AlertSeverity, AlertStatus } from "@maasuraksha/shared";

export interface IAlertDocument extends Document {
  user: mongoose.Types.ObjectId;
  type: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  status: AlertStatus;
  acknowledgedBy?: mongoose.Types.ObjectId;
  acknowledgedAt?: Date;
  source?: string;
  createdAt: Date;
  updatedAt: Date;
}

const alertSchema = new Schema<IAlertDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: [
        "vitals",
        "symptom",
        "assessment",
        "mood_safety",
        "follow_up",
        "appointment",
        "referral",
      ],
    },
    severity: {
      type: String,
      enum: Object.values(AlertSeverity),
      required: true,
      default: AlertSeverity.WARNING,
    },
    title: { type: String, required: true, maxlength: 200 },
    message: { type: String, required: true, maxlength: 2000 },
    status: {
      type: String,
      enum: Object.values(AlertStatus),
      required: true,
      default: AlertStatus.PENDING,
    },
    acknowledgedBy: { type: Schema.Types.ObjectId, ref: "User" },
    acknowledgedAt: { type: Date },
    source: { type: String, maxlength: 100 },
  },
  { timestamps: true }
);

alertSchema.index({ user: 1, status: 1, createdAt: -1 });
alertSchema.index({ user: 1, severity: 1 });
alertSchema.index({ severity: 1, status: 1 });
alertSchema.index({ type: 1 });

export const Alert = mongoose.model<IAlertDocument>("Alert", alertSchema);