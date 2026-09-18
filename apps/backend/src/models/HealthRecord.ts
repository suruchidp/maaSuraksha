import mongoose, { Schema } from "mongoose";
const schema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    category: {
      type: String,
      enum: [
        "lab_result",
        "ultrasound",
        "prescription",
        "discharge",
        "visit",
        "other",
      ],
      required: true,
    },
    title: { type: String, required: true, maxlength: 200 },
    date: { type: Date, required: true },
    provider: { type: String, maxlength: 200 },
    details: { type: String, required: true, maxlength: 10000 },
    recordedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    authorRole: { type: String, required: true },
    isArchived: { type: Boolean, default: false },
  },
  { timestamps: true },
);
schema.index({ user: 1, isArchived: 1, date: -1 });
export const HealthRecord = mongoose.model("HealthRecord", schema);
