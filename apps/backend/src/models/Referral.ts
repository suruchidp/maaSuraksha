import mongoose, { Schema, Document } from "mongoose";
import { ReferralStatus } from "@maasuraksha/shared";

export interface IReferralDocument extends Document {
  patient: mongoose.Types.ObjectId;
  referredBy: mongoose.Types.ObjectId;
  referredTo?: mongoose.Types.ObjectId;
  facility?: string;
  reason: string;
  notes?: string;
  sourceKey?: string;
  status: ReferralStatus;
  history?: {
    status: ReferralStatus;
    changedBy: mongoose.Types.ObjectId;
    changedAt: Date;
    note?: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const referralStatusHistorySchema = new Schema(
  {
    status: {
      type: String,
      enum: Object.values(ReferralStatus),
      required: true,
    },
    changedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    changedAt: { type: Date, required: true, default: Date.now },
    note: { type: String, maxlength: 500 },
  },
  { _id: false }
);

const referralSchema = new Schema<IReferralDocument>(
  {
    patient: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    referredBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    referredTo: { type: Schema.Types.ObjectId, ref: "User" },
    facility: { type: String, maxlength: 200 },
    reason: { type: String, required: true, maxlength: 1000 },
    notes: { type: String, maxlength: 1000 },
    sourceKey: String,
    status: {
      type: String,
      enum: Object.values(ReferralStatus),
      required: true,
      default: ReferralStatus.PENDING,
    },
    history: [referralStatusHistorySchema],
  },
  { timestamps: true }
);

referralSchema.index({ patient: 1, createdAt: -1 });
referralSchema.index({ referredBy: 1 });
referralSchema.index({ referredTo: 1 });
referralSchema.index({ status: 1 });
referralSchema.index({ facility: 1 });
referralSchema.index({ patient: 1, sourceKey: 1 }, { unique: true, partialFilterExpression: { sourceKey: { $type: 'string' } } });

export const Referral = mongoose.model<IReferralDocument>(
  "Referral",
  referralSchema
);
