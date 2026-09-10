import mongoose, { Schema, Document } from "mongoose";
import { RiskLevel } from "@maasuraksha/shared";

export interface IMaternalRiskAssessmentDocument extends Document {
  user: mongoose.Types.ObjectId;
  assessedBy: mongoose.Types.ObjectId;
  status: "pending" | "completed" | "unavailable";
  riskLevel?: RiskLevel;
  riskScore?: number;
  riskFactors: string[];
  shapValues?: Map<string, number>;
  recommendations: string[];
  modelVersion?: string;
  inputFeatures: Record<string, number>;
  createdAt: Date;
  updatedAt: Date;
}

const maternalRiskAssessmentSchema =
  new Schema<IMaternalRiskAssessmentDocument>(
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
        enum: Object.values(RiskLevel),
      },
      riskScore: {
        type: Number,
        min: 0,
        max: 1,
      },
      riskFactors: [{ type: String }],
      shapValues: { type: Schema.Types.Mixed },
      recommendations: [{ type: String }],
      modelVersion: { type: String },
      inputFeatures: { type: Schema.Types.Mixed, required: true },
    },
    { timestamps: true }
  );

maternalRiskAssessmentSchema.index({ user: 1, createdAt: -1 });
maternalRiskAssessmentSchema.index({ user: 1, riskLevel: 1 });
maternalRiskAssessmentSchema.index({ riskLevel: 1 });

export const MaternalRiskAssessment =
  mongoose.model<IMaternalRiskAssessmentDocument>(
    "MaternalRiskAssessment",
    maternalRiskAssessmentSchema
  );
