import mongoose, { Schema, Document } from "mongoose";
import { Language, EDUCATIONAL_CATEGORIES } from "@maasuraksha/shared";

export interface IEducationalContentDocument extends Document {
  title: Record<Language, string>;
  body: Record<Language, string>;
  category: string;
  tags: string[];
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const localizedFields = Object.values(Language).reduce((acc, lang) => {
  acc[lang] = { type: String, required: true };
  return acc;
}, {} as Record<string, { type: typeof String; required: boolean }>);

const educationalContentSchema = new Schema<IEducationalContentDocument>(
  {
    title: {
      type: localizedFields,
      required: true,
    },
    body: {
      type: localizedFields,
      required: true,
    },
    category: {
      type: String,
      required: true,
      enum: EDUCATIONAL_CATEGORIES,
    },
    tags: [{ type: String }],
    isActive: { type: Boolean, default: true },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

educationalContentSchema.index({ category: 1, isActive: 1 });
educationalContentSchema.index({ tags: 1 });
educationalContentSchema.index({ "title.en": 1, "title.hi": 1, "title.kn": 1 });

export const EducationalContent = mongoose.model<IEducationalContentDocument>(
  "EducationalContent",
  educationalContentSchema
);