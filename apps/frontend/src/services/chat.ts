import { httpGet, httpPost, httpList } from "@/lib/api";
import {
  ChatConversationDTO,
  ChatMessageDTO,
  SendMessageResult,
} from "@/lib/types";
import type { ChatMessageInput } from "@maasuraksha/shared";

export async function createConversation(title?: string) {
  return httpPost<ChatConversationDTO>("/chat", { title });
}

export async function listConversations(params?: Record<string, unknown>) {
  return httpList<ChatConversationDTO>("/chat", params);
}

export async function getConversation(id: string) {
  return httpGet<ChatConversationDTO>(`/chat/${id}`);
}

export async function sendMessage(conversationId: string, message: string) {
  const body: ChatMessageInput = { conversationId, message };
  return httpPost<SendMessageResult>(`/chat/${conversationId}/messages`, body);
}

export async function listMessages(
  conversationId: string,
  params?: Record<string, unknown>
) {
  return httpList<ChatMessageDTO>(`/chat/${conversationId}/messages`, params);
}