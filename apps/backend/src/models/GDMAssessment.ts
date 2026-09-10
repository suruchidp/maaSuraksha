import mongoose, { Schema, Document } from "mongoose";
import { GDMRisk } from "@maasuraksha/shared";

export interface IGDMAssessmentDocument extends Document {
  user: mongoose.Types.ObjectId;
  assessedBy: mongoose.Types.ObjectId;
  status: "pending" | "completed" | "unavailable";
  riskLevel?: GDMRisk;
  riskScore?: number;
  fastingGlucose?: number;
  postprandialGlucose?: number;
  hba1c?: number;
  riskFactors: string[];
  shapValues?: Map<string, number>;
  recommendations: string[];
  modelVersion?: string;
  inputFeatures: Record<string, number>;
  createdAt: Date;
  updatedAt: Date;
}

const gdmAssessmentSchema = new Schema<IGDMAssessmentDocument>(
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
      riskLevel: {
        type: String,
        enum: Object.values(GDMRisk),
      },
      riskScore: {
        type: Number,
        min: 0,
        max: 1,
      },
      fastingGlucose: {
        type: Number,
        min: 20,
        max: 600,
      },
      postprandialGlucose: {
        type: Number,
        min: 20,
        max: 700,
      },
      hba1c: {
        type: Number,
        min: 3,
        max: 15,
      },
      riskFactors: [{ type: String }],
      shapValues: { type: Schema.Types.Mixed },
      recommendations: [{ type: String }],
      modelVersion: { type: String },
      inputFeatures: { type: Schema.Types.Mixed, required: true },
    },
  { timestamps: true }
);

gdmAssessmentSchema.index({ user: 1, createdAt: -1 });
gdmAssessmentSchema.index({ user: 1, riskLevel: 1 });

export const GDMAssessment = mongoose.model<IGDMAssessmentDocument>(
  "GDMAssessment",
  gdmAssessmentSchema
);
