import mongoose, { Schema, Document } from "mongoose";
import { HomeVisitStatus } from "@maasuraksha/shared";

export interface IHomeVisitDocument extends Document {
  patient: mongoose.Types.ObjectId;
  requestedBy: mongoose.Types.ObjectId;
  reason: string;
  notes?: string;
  preferredDate: string;
  preferredTime: string;
  status: HomeVisitStatus;
  scheduledDate?: string;
  scheduledTime?: string;
  scheduledBy?: mongoose.Types.ObjectId;
  completedAt?: Date;
  completedBy?: mongoose.Types.ObjectId;
  visitNotes?: string;
  followUpNeeded?: boolean;
  result?: Record<string, number>;
  referralId?: mongoose.Types.ObjectId;
  escalatedTo?: mongoose.Types.ObjectId;
  escalateReason?: string;
  cancelledReason?: string;
  history: {
    status: HomeVisitStatus;
    changedBy: mongoose.Types.ObjectId;
    changedAt: Date;
    note?: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const historyEntrySchema = new Schema(
  {
    status: {
      type: String,
      enum: Object.values(HomeVisitStatus),
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

const homeVisitSchema = new Schema<IHomeVisitDocument>(
  {
    patient: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    requestedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reason: { type: String, required: true, maxlength: 500 },
    notes: { type: String, maxlength: 1000 },
    preferredDate: { type: String, required: true },
    preferredTime: {
      type: String,
      required: true,
      match: /^([01]\d|2[0-3]):[0-5]\d$/,
    },
    status: {
      type: String,
      enum: Object.values(HomeVisitStatus),
      required: true,
      default: HomeVisitStatus.PENDING,
    },
    scheduledDate: String,
    scheduledTime: String,
    scheduledBy: { type: Schema.Types.ObjectId, ref: "User" },
    completedAt: Date,
    completedBy: { type: Schema.Types.ObjectId, ref: "User" },
    visitNotes: { type: String, maxlength: 2000 },
    followUpNeeded: Boolean,
    result: { type: Map, of: Number },
    referralId: { type: Schema.Types.ObjectId, ref: "Referral" },
    escalatedTo: { type: Schema.Types.ObjectId, ref: "User" },
    escalateReason: { type: String, maxlength: 500 },
    cancelledReason: { type: String, maxlength: 500 },
    history: {
      type: [historyEntrySchema],
      default: [],
    },
  },
  { timestamps: true }
);

homeVisitSchema.index({ patient: 1, createdAt: -1 });
homeVisitSchema.index({ requestedBy: 1 });
homeVisitSchema.index({ status: 1 });

export const HomeVisit = mongoose.model<IHomeVisitDocument>(
  "HomeVisit",
  homeVisitSchema
);