import mongoose, { Schema, Document } from "mongoose";

export interface IReportDocument extends Document {
  user: mongoose.Types.ObjectId;
  title: string;
  type: string;
  data: Record<string, unknown>;
  generatedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const reportSchema = new Schema<IReportDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: { type: String, required: true, maxlength: 200 },
    type: {
      type: String,
      required: true,
      enum: [
        "pregnancy_summary",
        "health_metrics",
        "risk_assessment",
        "gdm_assessment",
        "ppd_assessment",
        "mood_history",
        "comprehensive",
      ],
    },
    data: {
      type: Schema.Types.Mixed,
      required: true,
    },
    generatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

reportSchema.index({ user: 1, createdAt: -1 });
reportSchema.index({ user: 1, type: 1 });
reportSchema.index({ generatedBy: 1 });

export const Report = mongoose.model<IReportDocument>(
  "Report",
  reportSchema
);