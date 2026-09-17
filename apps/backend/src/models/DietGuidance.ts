import mongoose, { Schema, Document } from "mongoose";
import { DIET_GUIDANCE_INTENTS } from "@maasuraksha/shared";
import type { DietGuidanceIntent } from "@maasuraksha/shared";

export interface IDietGuidanceReference {
  assessmentId: mongoose.Types.ObjectId;
  assessmentType: "maternal" | "gdm";
  modelVersion?: string;
}

export interface IDietGuidanceSection {
  key: string;
  heading: Record<string, string>;
  body?: Record<string, string>;
  bullets?: Record<string, string>[];
}

export interface IDietGuidanceAttribution {
  id: string;
  title: string;
  url: string;
}

export interface IDietGuidanceDocument extends Document {
  user: mongoose.Types.ObjectId;
  sourceType: "SYSTEM";
  templateKey: string;
  dedupeKey: string;
  intent: DietGuidanceIntent;
  contentVersion: string;
  priority: "low" | "medium" | "high";
  title: string;
  titleLocalized: Record<string, string>;
  sections: IDietGuidanceSection[];
  rationale: string;
  rationaleLocalized: Record<string, string>;
  disclaimer: string;
  disclaimerLocalized: Record<string, string>;
  attribution: IDietGuidanceAttribution[];
  references?: IDietGuidanceReference[];
  createdAt: Date;
  updatedAt: Date;
}

const dietGuidanceReferenceSchema = new Schema<IDietGuidanceReference>(
  {
    assessmentId: { type: Schema.Types.ObjectId, required: true },
    assessmentType: {
      type: String,
      enum: ["maternal", "gdm"],
      required: true,
    },
    modelVersion: { type: String },
  },
  { _id: false }
);

const dietGuidanceSectionSchema = new Schema<IDietGuidanceSection>(
  {
    key: { type: String, required: true },
    heading: { type: Schema.Types.Mixed, required: true },
    body: { type: Schema.Types.Mixed },
    bullets: { type: [Schema.Types.Mixed] },
  },
  { _id: false }
);

const dietGuidanceAttributionSchema = new Schema<IDietGuidanceAttribution>(
  {
    id: { type: String, required: true },
    title: { type: String, required: true },
    url: { type: String, required: true },
  },
  { _id: false }
);

const dietGuidanceSchema = new Schema<IDietGuidanceDocument>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    sourceType: {
      type: String,
      enum: ["SYSTEM"],
      default: "SYSTEM",
      required: true,
    },
    templateKey: { type: String, required: true },
    dedupeKey: { type: String, required: true },
    intent: { type: String, enum: DIET_GUIDANCE_INTENTS, required: true },
    contentVersion: { type: String, required: true },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    title: { type: String, required: true, maxlength: 200 },
    titleLocalized: { type: Schema.Types.Mixed, required: true },
    sections: { type: [dietGuidanceSectionSchema], default: [] },
    rationale: { type: String, maxlength: 400 },
    rationaleLocalized: { type: Schema.Types.Mixed },
    disclaimer: { type: String, required: true },
    disclaimerLocalized: { type: Schema.Types.Mixed, required: true },
    attribution: { type: [dietGuidanceAttributionSchema], default: [] },
    references: { type: [dietGuidanceReferenceSchema], default: [] },
  },
  { timestamps: true }
);

dietGuidanceSchema.index({ user: 1, createdAt: -1 });
dietGuidanceSchema.index({ user: 1, dedupeKey: 1 }, { unique: true });
dietGuidanceSchema.index({ user: 1, intent: 1 });

export const DietGuidance = mongoose.model<IDietGuidanceDocument>(
  "DietGuidance",
  dietGuidanceSchema
);