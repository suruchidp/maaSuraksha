import mongoose, { Schema, Document } from "mongoose";

export interface IChatConversationDocument extends Document {
  user: mongoose.Types.ObjectId;
  title?: string;
  lastMessageAt?: Date;
  busyUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const chatConversationSchema = new Schema<IChatConversationDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: { type: String, maxlength: 200 },
    lastMessageAt: { type: Date },
    busyUntil: Date,
  },
  { timestamps: true }
);

chatConversationSchema.index({ user: 1, lastMessageAt: -1 });
chatConversationSchema.index({ createdAt: -1 });

export const ChatConversation = mongoose.model<IChatConversationDocument>(
  "ChatConversation",
  chatConversationSchema
);
