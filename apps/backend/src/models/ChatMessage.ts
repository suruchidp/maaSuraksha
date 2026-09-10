import mongoose, { Schema, Document } from "mongoose";

export interface IChatMessageDocument extends Document {
  conversation: mongoose.Types.ObjectId;
  role: "user" | "assistant";
  content: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const chatMessageSchema = new Schema<IChatMessageDocument>(
  {
    conversation: {
      type: Schema.Types.ObjectId,
      ref: "ChatConversation",
      required: true,
    },
    role: {
      type: String,
      enum: ["user", "assistant"],
      required: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: 4000,
    },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

chatMessageSchema.index({ conversation: 1, createdAt: 1 });
chatMessageSchema.index({ role: 1 });

export const ChatMessage = mongoose.model<IChatMessageDocument>(
  "ChatMessage",
  chatMessageSchema
);