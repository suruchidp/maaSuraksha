import mongoose, { Schema, Document } from "mongoose";

export interface IDietPlanMeal {
  name: string;
  items: string[];
  notes?: string;
}

export interface IDietPlanDocument extends Document {
  user: mongoose.Types.ObjectId;
  title: string;
  description: string;
  meals: IDietPlanMeal[];
  nutritionalNotes: string;
  disclaimer: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const dietPlanMealSchema = new Schema<IDietPlanMeal>(
  {
    name: { type: String, required: true, maxlength: 200 },
    items: {
      type: [String],
      required: true,
      validate: {
        validator: (v: string[]) => v.length > 0,
        message: "Each meal must include at least one food item",
      },
    },
    notes: { type: String, maxlength: 500 },
  },
  { _id: false }
);

const dietPlanSchema = new Schema<IDietPlanDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: { type: String, required: true, maxlength: 200 },
    description: { type: String, required: true, maxlength: 1000 },
    meals: {
      type: [dietPlanMealSchema],
      required: true,
      validate: {
        validator: (v: IDietPlanMeal[]) => v.length > 0,
        message: "At least one meal is required",
      },
    },
    nutritionalNotes: { type: String, required: true, maxlength: 2000 },
    disclaimer: { type: String, required: true },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

dietPlanSchema.index({ user: 1, createdAt: -1 });
dietPlanSchema.index({ user: 1, title: 1 });

export const DietPlan = mongoose.model<IDietPlanDocument>(
  "DietPlan",
  dietPlanSchema
);