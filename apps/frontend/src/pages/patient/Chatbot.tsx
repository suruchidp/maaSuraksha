import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Send, Bot, User, AlertTriangle } from "lucide-react";
import { useConversations, useCreateConversation, useMessages, useSendMessage } from "@/hooks/queries";
import { useCurrentLanguage } from "@/hooks/useAuth";
import { formatDate } from "@/lib/date";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { getApiErrorMessage } from "@/lib/api";
import { useToastStore } from "@/stores/toastStore";

export default function ChatbotPage() {
  const { t } = useTranslation();
  const lang = useCurrentLanguage();
  const push = useToastStore((s) => s.push);

  const conversations = useConversations();
  const createConversation = useCreateConversation();
  const [activeId, setActiveId] = useState<string | null>(null);
  const messages = useMessages(activeId ?? "");
  const sendMutation = useSendMessage(activeId ?? "");
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const [requiresHuman, setRequiresHuman] = useState(false);

  const conversationsList = conversations.data?.items ?? [];

  useEffect(() => {
    if (!activeId && conversationsList.length > 0 && !conversations.isLoading) {
      setActiveId(conversationsList[0].id);
    }
  }, [conversationsList, activeId, conversations.isLoading]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.data]);

  const ensureConversation = async (): Promise<string | null> => {
    if (activeId) return activeId;
    try {
      const conv = await createConversation.mutateAsync(undefined);
      setActiveId(conv.id);
      return conv.id;
    } catch (e) {
      push(getApiErrorMessage(e), "error");
      return null;
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    const convId = await ensureConversation();
    if (!convId) return;
    setDraft("");
    sendMutation.mutate(text, {
      onSuccess: (result) => {
        setRequiresHuman(result.requiresHumanReview);
      },
      onError: (err) => push(getApiErrorMessage(err), "error"),
    });
  };

  const messageItems = messages.data?.items ?? [];
  const userMessages = messageItems.filter((m) => m.role === "user");

  return (
    <div className="space-y-6">
      <PageHeader title={t("chatbot.title")} subtitle={t("chatbot.subtitle")} />

      <div className="rounded-2xl bg-lavender-50/80 border border-lavender-200/80 p-3 text-sm text-lavender-900 flex items-start gap-2 shadow-sm">
        <Bot className="w-4 h-4 mt-0.5 shrink-0" />
        <div>
          <p>{t("chatbot.disclaimer")}</p>
          <p className="text-xs text-primary-700 mt-1">{t("chatbot.emergency")}</p>
        </div>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="grid grid-cols-1 sm:grid-cols-[240px_1fr] h-[60vh]">
          <div className="border-r border-rose-100/70 bg-cream-50/40 p-3 space-y-1 overflow-y-auto hidden sm:block">
            {conversations.isLoading ? (
              <Spinner />
            ) : conversationsList.length === 0 ? (
              <p className="text-xs text-gray-400 px-2">{t("chatbot.noConversations")}</p>
            ) : (
              conversationsList.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveId(c.id)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-colors ${
                    activeId === c.id ? "bg-primary-100/70 text-primary-800 font-medium" : "text-gray-600 hover:bg-rose-50/60"
                  }`}
                >
                  <p className="font-medium truncate">{c.title || t("chatbot.untitled")}</p>
                  {c.lastMessageAt && (
                    <p className="text-xs text-gray-400">{formatDate(c.lastMessageAt, lang)}</p>
                  )}
                </button>
              ))
            )}
          </div>

          <div className="flex flex-col h-[60vh]">
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-cream-50/60 to-white">
              {!activeId ? (
                <EmptyState title={t("chatbot.startPrompt")} description={t("chatbot.startDescription")} />
              ) : messages.isLoading ? (
                <Spinner />
              ) : messageItems.length === 0 ? (
                <EmptyState title={t("chatbot.startPrompt")} />
              ) : (
                messageItems.map((m) => (
                  <MessageBubble key={m.id} role={m.role} content={m.content} />
                ))
              )}
              <div ref={bottomRef} />
            </div>

            {requiresHuman && (
              <div className="flex items-start gap-2 text-sm text-amber-800 bg-amber-50 border-t border-amber-200 px-4 py-2.5">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                <p>{t("chatbot.humanReview")}</p>
              </div>
            )}

            <form onSubmit={handleSend} className="border-t border-gray-100 p-3 flex items-end gap-2 bg-white">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={2}
                className="input-field flex-1 resize-none"
                placeholder={t("chatbot.placeholder")}
                aria-label={t("chatbot.placeholder")}
              />
              <Button type="submit" loading={sendMutation.isPending} disabled={!draft.trim()}>
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">{t("chatbot.send")}</span>
              </Button>
            </form>
          </div>
        </div>
      </Card>

      <p className="text-xs text-gray-400">
        {t("chatbot.messagesNote")} {userMessages.length > 0 ? `(${userMessages.length})` : ""}
      </p>
    </div>
  );
}

function MessageBubble({ role, content }: { role: "user" | "assistant"; content: string }) {
  const isUser = role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[80%] flex gap-2 ${isUser ? "flex-row-reverse" : ""}`}>
        <div
          className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
            isUser ? "bg-primary-100 text-primary-700" : "bg-accent-100 text-accent-700"
          }`}
        >
          {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
        </div>
        <div
          className={`rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap shadow-sm ${
            isUser ? "bg-primary-600 text-white" : "bg-white border border-rose-100/80 text-gray-700"
          }`}
        >
          {content}
        </div>
      </div>
    </div>
  );
}