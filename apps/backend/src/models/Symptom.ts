import mongoose, { Schema, Document } from "mongoose";

export interface ISymptomDocument extends Document {
  user: mongoose.Types.ObjectId;
  date: Date;
  symptoms: string[];
  severity: string;
  notes?: string;
  reportedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const symptomSchema = new Schema<ISymptomDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: { type: Date, required: true, default: Date.now },
    symptoms: {
      type: [String],
      required: true,
      validate: {
        validator: (v: string[]) => v.length > 0,
        message: "At least one symptom is required",
      },
    },
    severity: {
      type: String,
      required: true,
      enum: ["mild", "moderate", "severe", "critical"],
    },
    notes: { type: String, maxlength: 1000 },
    reportedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

symptomSchema.index({ user: 1, date: -1 });
symptomSchema.index({ user: 1, severity: 1 });
symptomSchema.index({ severity: 1 });

export const Symptom = mongoose.model<ISymptomDocument>(
  "Symptom",
  symptomSchema
);
