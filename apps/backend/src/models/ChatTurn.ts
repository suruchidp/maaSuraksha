import mongoose, { Schema } from 'mongoose';

// A question and reply are one atomic document: a successful send never leaves
// an orphan question or loses the assistant reply on reload.
const schema = new Schema({
  conversation: { type: Schema.Types.ObjectId, ref: 'ChatConversation', required: true },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  requestId: { type: String, required: true },
  question: { type: String, required: true, maxlength: 2000 },
  reply: { type: String, required: true, maxlength: 4000 },
  userMessageId: { type: Schema.Types.ObjectId, required: true },
  assistantMessageId: { type: Schema.Types.ObjectId, required: true },
  language: { type: String, enum: ['en', 'hi', 'kn'], required: true },
  useHealthContext: { type: Boolean, required: true },
  allowExternalAi: { type: Boolean, default: false },
  metadata: { type: Schema.Types.Mixed, required: true },
}, { timestamps: true });
schema.index({ conversation: 1, requestId: 1 }, { unique: true });
schema.index({ conversation: 1, createdAt: -1 });
schema.index({ user: 1, createdAt: -1 });
export const ChatTurn = mongoose.model('ChatTurn', schema);
