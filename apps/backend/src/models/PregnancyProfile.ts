import mongoose, { Schema, Document } from "mongoose";
import { Trimester } from "@maasuraksha/shared";

export interface IPregnancyProfileDocument extends Document {
  user: mongoose.Types.ObjectId;
  lmp: Date;
  expectedDueDate: Date;
  gestationalWeek: number;
  trimester: Trimester;
  gravida?: number;
  para?: number;
  isHighRisk: boolean;
  riskFactors: string[];
  medicalHistory: string[];
  createdAt: Date;
  updatedAt: Date;
}

const pregnancyProfileSchema = new Schema<IPregnancyProfileDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    lmp: { type: Date, required: true },
    expectedDueDate: { type: Date, required: true },
    gestationalWeek: {
      type: Number,
      required: true,
      min: 0,
      max: 42,
    },
    trimester: {
      type: Number,
      enum: Object.values(Trimester).filter((v) => typeof v === "number"),
      required: true,
    },
    gravida: { type: Number, min: 0, max: 20 },
    para: { type: Number, min: 0, max: 20 },
    isHighRisk: { type: Boolean, default: false },
    riskFactors: [{ type: String }],
    medicalHistory: [{ type: String }],
  },
  { timestamps: true }
);

pregnancyProfileSchema.index({ expectedDueDate: 1 });
pregnancyProfileSchema.index({ isHighRisk: 1 });

export const PregnancyProfile = mongoose.model<IPregnancyProfileDocument>(
  "PregnancyProfile",
  pregnancyProfileSchema
);
