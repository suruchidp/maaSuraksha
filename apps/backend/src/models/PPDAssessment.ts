import mongoose, { Schema, Document } from "mongoose";
import { PPDSeverity } from "@maasuraksha/shared";

export interface IPPDAssessmentDocument extends Document {
  user: mongoose.Types.ObjectId;
  assessedBy: mongoose.Types.ObjectId;
  status: "pending" | "completed" | "unavailable";
  edinburghAnswers?: number[];
  edinburghScore?: number;
  severity?: PPDSeverity;
  riskFactors: string[];
  screeningText?: string;
  modelConfidence?: number;
  nlpAnalysis?: {
    sentiment: string;
    keywords: string[];
    riskIndicators: string[];
  };
  recommendations: string[];
  modelVersion?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ppdAssessmentSchema = new Schema<IPPDAssessmentDocument>(
{
      user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      assessedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      status: {
        type: String,
        enum: ["pending", "completed", "unavailable"],
        required: true,
        default: "pending",
      },
      edinburghAnswers: {
        type: [Number],
        min: 0,
        max: 3,
        validate: {
          validator: (v: number[]) => v.length === 0 || v.length === 10,
          message: "EPDS requires exactly 10 answers when provided",
        },
      },
      edinburghScore: {
        type: Number,
        min: 0,
        max: 30,
      },
      severity: {
        type: String,
        enum: Object.values(PPDSeverity),
      },
      riskFactors: [{ type: String }],
      screeningText: { type: String },
      modelConfidence: { type: Number, min: 0, max: 1 },
      nlpAnalysis: {
        sentiment: { type: String },
        keywords: [{ type: String }],
        riskIndicators: [{ type: String }],
      },
      recommendations: [{ type: String }],
      modelVersion: { type: String },
    },
  { timestamps: true }
);

ppdAssessmentSchema.index({ user: 1, createdAt: -1 });
ppdAssessmentSchema.index({ user: 1, severity: 1 });
ppdAssessmentSchema.index({ severity: 1 });

export const PPDAssessment = mongoose.model<IPPDAssessmentDocument>(
  "PPDAssessment",
  ppdAssessmentSchema
);
