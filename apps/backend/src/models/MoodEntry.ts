import mongoose, { Schema, Document } from "mongoose";
import { MoodSentiment } from "@maasuraksha/shared";

export interface IMoodEntryDocument extends Document {
  user: mongoose.Types.ObjectId;
  journalText: string;
  status: "pending" | "analyzed" | "unavailable";
  sentiment?: MoodSentiment;
  sentimentScore?: number;
  keywords: string[];
  safetyFlag: boolean;
  safetyNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const moodEntrySchema = new Schema<IMoodEntryDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    journalText: {
      type: String,
      required: true,
      maxlength: 2000,
    },
    status: {
      type: String,
      enum: ["pending", "analyzed", "unavailable"],
      required: true,
      default: "pending",
    },
    sentiment: {
      type: String,
      enum: Object.values(MoodSentiment),
    },
    sentimentScore: {
      type: Number,
      min: 0,
      max: 1,
    },
    keywords: [{ type: String }],
    safetyFlag: { type: Boolean, default: false, index: true },
    safetyNotes: { type: String, maxlength: 500 },
  },
  { timestamps: true }
);

moodEntrySchema.index({ user: 1, createdAt: -1 });
moodEntrySchema.index({ user: 1, sentiment: 1 });
moodEntrySchema.index({ safetyFlag: 1, createdAt: -1 });

export const MoodEntry = mongoose.model<IMoodEntryDocument>(
  "MoodEntry",
  moodEntrySchema
);
