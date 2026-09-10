import { isValidObjectId } from "mongoose";
import { ChatConversation } from "../models/ChatConversation";
import { ChatMessage } from "../models/ChatMessage";
import { ApiError } from "../utils/ApiError";
import { AuthUser } from "../middleware/auth";

const ASSISTANT_UNAVAILABLE =
  "The AI assistant is not available in this environment yet. " +
  "Your message was stored securely. The assistant response will be " +
  "provided in a later integration phase. For urgent concerns, contact " +
  "your care provider or visit the nearest health facility.";

export async function createConversation(actor: AuthUser, title?: string) {
  const conversation = await ChatConversation.create({
    user: actor.userId,
    title,
  });
  return toDto(conversation);
}

export async function listConversations(actor: AuthUser, page: number, limit: number) {
  const filter = { user: actor.userId };
  const total = await ChatConversation.countDocuments(filter);
  const items = await ChatConversation.find(filter)
    .sort({ lastMessageAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
  return { items: items.map(toDto), total };
}

export async function getConversation(actor: AuthUser, conversationId: string) {
  validateId(conversationId);
  const conversation = await ChatConversation.findById(conversationId);
  if (!conversation) throw ApiError.notFound("Conversation not found");
  if (conversation.user.toString() !== actor.userId && actor.role !== "ADMIN") {
    throw ApiError.forbidden("You do not have access to this conversation");
  }
  return toDto(conversation);
}

export async function sendMessage(
  actor: AuthUser,
  conversationId: string,
  message: string
) {
  validateId(conversationId);
  const conversation = await ChatConversation.findById(conversationId);
  if (!conversation) throw ApiError.notFound("Conversation not found");
  if (conversation.user.toString() !== actor.userId && actor.role !== "ADMIN") {
    throw ApiError.forbidden("You do not have access to this conversation");
  }

  await ChatMessage.create({
    conversation: conversationId,
    role: "user",
    content: message,
  });

  conversation.lastMessageAt = new Date();
  if (!conversation.title) {
    conversation.title = message.slice(0, 50);
  }
  await conversation.save();

  return {
    userMessage: message,
    assistantMessage: ASSISTANT_UNAVAILABLE,
    requiresHumanReview: false,
  };
}

export async function listMessages(
  actor: AuthUser,
  conversationId: string,
  page: number,
  limit: number
) {
  validateId(conversationId);
  const conversation = await ChatConversation.findById(conversationId);
  if (!conversation) throw ApiError.notFound("Conversation not found");
  if (conversation.user.toString() !== actor.userId && actor.role !== "ADMIN") {
    throw ApiError.forbidden("You do not have access to this conversation");
  }

  const filter = { conversation: conversationId };
  const total = await ChatMessage.countDocuments(filter);
  const messages = await ChatMessage.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  return {
    items: messages
      .map((m) => ({
        id: m._id,
        role: m.role,
        content: m.content,
        createdAt: m.createdAt,
      }))
      .reverse(),
    total,
  };
}

function validateId(id: string): void {
  if (!isValidObjectId(id)) throw ApiError.badRequest("Invalid id format");
}

function toDto(conversation: InstanceType<typeof ChatConversation>) {
  return {
    id: conversation._id,
    user: conversation.user,
    title: conversation.title,
    lastMessageAt: conversation.lastMessageAt,
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
  };
}