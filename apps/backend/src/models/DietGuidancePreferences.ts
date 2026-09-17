import mongoose, { Schema, Document } from "mongoose";
import { DIET_MEAL_PREFERENCES, DIET_REGIONS } from "@maasuraksha/shared";
import type { DietMealPreference, DietRegion } from "@maasuraksha/shared";

export interface IDietGuidancePreferencesDocument extends Document {
  user: mongoose.Types.ObjectId;
  mealPreference: DietMealPreference;
  region?: DietRegion;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const dietGuidancePreferencesSchema = new Schema<IDietGuidancePreferencesDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    mealPreference: {
      type: String,
      enum: DIET_MEAL_PREFERENCES,
      required: true,
    },
    region: { type: String, enum: DIET_REGIONS },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export const DietGuidancePreferences = mongoose.model<IDietGuidancePreferencesDocument>(
  "DietGuidancePreferences",
  dietGuidancePreferencesSchema
);