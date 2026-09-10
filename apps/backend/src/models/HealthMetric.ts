import mongoose, { Schema, Document } from "mongoose";

export interface IHealthMetricDocument extends Document {
  user: mongoose.Types.ObjectId;
  date: Date;
  systolicBP?: number;
  diastolicBP?: number;
  weight?: number;
  glucose?: number;
  heartRate?: number;
  temperature?: number;
  hemoglobin?: number;
  recordedBy?: mongoose.Types.ObjectId;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const healthMetricSchema = new Schema<IHealthMetricDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: { type: Date, required: true, default: Date.now },
    systolicBP: {
      type: Number,
      min: 50,
      max: 300,
    },
    diastolicBP: {
      type: Number,
      min: 20,
      max: 200,
    },
    weight: {
      type: Number,
      min: 20,
      max: 300,
    },
    glucose: {
      type: Number,
      min: 20,
      max: 600,
    },
    heartRate: {
      type: Number,
      min: 30,
      max: 250,
    },
    temperature: {
      type: Number,
      min: 33,
      max: 43,
    },
    hemoglobin: {
      type: Number,
      min: 2,
      max: 25,
    },
    recordedBy: { type: Schema.Types.ObjectId, ref: "User" },
    notes: { type: String, maxlength: 500 },
  },
  { timestamps: true }
);

healthMetricSchema.index({ user: 1, date: -1 });
healthMetricSchema.index({ user: 1, createdAt: -1 });

export const HealthMetric = mongoose.model<IHealthMetricDocument>(
  "HealthMetric",
  healthMetricSchema
);
