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

export function getChatCapabilities() {return httpGet<{externalAiAvailable:boolean;externalProvider:string}>('/chat/capabilities');}
export async function sendMessage(conversationId: string, message: string, options?: {requestId:string;language:'en'|'hi'|'kn';useHealthContext:boolean;allowExternalAi?:boolean}) {
  const body: ChatMessageInput = { conversationId, message, requestId:options?.requestId ?? crypto.randomUUID(),language:options?.language ?? 'en',useHealthContext:options?.useHealthContext ?? false,allowExternalAi:options?.allowExternalAi ?? false };
  return httpPost<SendMessageResult>(`/chat/${conversationId}/messages`, body);
}

export async function listMessages(
  conversationId: string,
  params?: Record<string, unknown>
) {
  return httpList<ChatMessageDTO>(`/chat/${conversationId}/messages`, params);
}
