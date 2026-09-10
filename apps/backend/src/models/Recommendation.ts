import mongoose, { Schema, Document } from "mongoose";

export interface IRecommendationDocument extends Document {
  user: mongoose.Types.ObjectId;
  category: string;
  title: string;
  content: string;
  priority: string;
  isPersonalized: boolean;
  source?: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const recommendationSchema = new Schema<IRecommendationDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    category: {
      type: String,
      required: true,
      enum: [
        "nutrition",
        "exercise",
        "rest",
        "medical",
        "mental_health",
        "general",
        "warning",
      ],
    },
    title: { type: String, required: true, maxlength: 200 },
    content: { type: String, required: true, maxlength: 2000 },
    priority: {
      type: String,
      required: true,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    isPersonalized: { type: Boolean, default: false },
    source: { type: String, maxlength: 200 },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

recommendationSchema.index({ user: 1, createdAt: -1 });
recommendationSchema.index({ user: 1, category: 1 });
recommendationSchema.index({ user: 1, isRead: 1 });

export const Recommendation = mongoose.model<IRecommendationDocument>(
  "Recommendation",
  recommendationSchema
);
