import mongoose, { Schema, Document } from "mongoose";
import { RECOMMENDATION_CATEGORIES, RECOMMENDATION_PRIORITIES } from "@maasuraksha/shared";

export interface IRecommendationReference {
  assessmentId: mongoose.Types.ObjectId;
  assessmentType: "maternal" | "gdm" | "ppd";
  modelVersion?: string;
}

export interface IRecommendationDocument extends Document {
  user: mongoose.Types.ObjectId;
  category: string;
  title: string;
  content: string;
  priority: string;
  isPersonalized: boolean;
  source?: string;
  isRead: boolean;
  sourceType: "SYSTEM" | "CARE_TEAM";
  titleLocalized?: Record<string, string>;
  contentLocalized?: Record<string, string>;
  reason?: string;
  reasonLocalized?: Record<string, string>;
  references?: IRecommendationReference[];
  templateKey?: string;
  createdAt: Date;
  updatedAt: Date;
}

const recommendationReferenceSchema = new Schema<IRecommendationReference>(
  {
    assessmentId: {
      type: Schema.Types.ObjectId,
      ref: "MaternalRiskAssessment",
    },
    assessmentType: {
      type: String,
      enum: ["maternal", "gdm", "ppd"],
    },
    modelVersion: { type: String },
  },
  { _id: false }
);

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
      enum: RECOMMENDATION_CATEGORIES,
    },
    title: { type: String, required: true, maxlength: 200 },
    content: { type: String, required: true, maxlength: 2000 },
    priority: {
      type: String,
      required: true,
      enum: RECOMMENDATION_PRIORITIES,
      default: "medium",
    },
    isPersonalized: { type: Boolean, default: false },
    source: { type: String, maxlength: 200 },
    isRead: { type: Boolean, default: false },
    sourceType: {
      type: String,
      enum: ["SYSTEM", "CARE_TEAM"],
      default: "CARE_TEAM",
    },
    titleLocalized: { type: Schema.Types.Mixed },
    contentLocalized: { type: Schema.Types.Mixed },
    reason: { type: String, maxlength: 400 },
    reasonLocalized: { type: Schema.Types.Mixed },
    references: { type: [recommendationReferenceSchema], default: [] },
    templateKey: { type: String },
  },
  { timestamps: true }
);

recommendationSchema.index({ user: 1, createdAt: -1 });
recommendationSchema.index({ user: 1, category: 1 });
recommendationSchema.index({ user: 1, isRead: 1 });
recommendationSchema.index({ user: 1, sourceType: 1 });
recommendationSchema.index({ "references.assessmentId": 1, templateKey: 1 });

export const Recommendation = mongoose.model<IRecommendationDocument>(
  "Recommendation",
  recommendationSchema
);
