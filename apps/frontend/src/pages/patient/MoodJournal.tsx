import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, Bell } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useMoodEntries, useCreateMoodEntry } from "@/hooks/queries";
import { useCurrentLanguage } from "@/hooks/useAuth";
import { buildSchemas } from "@/lib/schemas";
import { getApiErrorMessage } from "@/lib/api";
import { useToastStore } from "@/stores/toastStore";
import { formatDate } from "@/lib/date";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { SentimentBadge } from "@/components/status/StatusLabels";

type MoodForm = { journalText: string };

export default function MoodJournalPage() {
  const { t } = useTranslation();
  const lang = useCurrentLanguage();
  const user = useAuthStore((s) => s.user);
  const push = useToastStore((s) => s.push);
  const schemas = buildSchemas(t);

  const entries = useMoodEntries(undefined, 50);
  const create = useCreateMoodEntry();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MoodForm>({ resolver: zodResolver(schemas.moodEntry) });

  const [recentSafety, setRecentSafety] = useState(false);

  const onSubmit = (data: MoodForm) => {
    create.mutate(
      { input: { journalText: data.journalText }, userId: user?.id },
      {
        onSuccess: (result) => {
          push(t("mood.saved"), "success");
          if (result.safetyFlag) {
            push(t("mood.safetyAttention"), "warning");
            setRecentSafety(true);
          }
          reset();
        },
        onError: (err) => push(getApiErrorMessage(err), "error"),
      }
    );
  };

  if (entries.isLoading) return <Spinner />;

  return (
    <div className="space-y-6">
      <PageHeader title={t("mood.title")} subtitle={t("mood.subtitle")} />

      {recentSafety && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 flex items-start gap-3">
          <Bell className="w-5 h-5 text-amber-600 mt-0.5" />
          <div className="text-sm text-amber-800">
            <p className="font-medium">{t("mood.safetyAttention")}</p>
            <p className="mt-0.5">{t("mood.safetyHelp")}</p>
          </div>
        </div>
      )}

      <Card title={t("mood.writeTitle")}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <Field label={t("mood.journalText")} htmlFor="journalText" error={errors.journalText?.message} hint={t("mood.journalHint")} required>
            <Textarea id="journalText" rows={5} {...register("journalText")} />
          </Field>
          <Button type="submit" loading={create.isPending}>
            {t("mood.submit")}
          </Button>
          <p className="text-xs text-gray-400 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" /> {t("mood.confidentialNote")}
          </p>
        </form>
      </Card>

      <Card title={t("mood.history")}>
        {entries.isError ? (
          <ErrorState message={entries.error?.message} onRetry={() => entries.refetch()} />
        ) : (entries.data?.items ?? []).length === 0 ? (
          <EmptyState title={t("mood.none")} description={t("mood.noneDescription")} />
        ) : (
          <ul className="divide-y divide-gray-100">
            {(entries.data?.items ?? [])
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .map((entry) => (
                <li key={entry.id} className="py-3">
                  <div className="flex items-center gap-2">
                    <SmStatusBadge entry={entry} />
                    <span className="text-xs text-gray-400">{formatDate(entry.createdAt, lang)}</span>
                  </div>
                  <p className="text-sm text-gray-700 mt-1.5 whitespace-pre-wrap">{entry.journalText}</p>
                  {(entry.keywords?.length ?? 0) > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {entry.keywords.map((k) => (
                        <span key={k} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                          {k}
                        </span>
                      ))}
                    </div>
                  )}
                  {entry.safetyFlag && (
                    <p className="mt-2 text-sm text-amber-700 flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4" /> {entry.safetyNotes ?? t("mood.safetyAttention")}
                    </p>
                  )}
                </li>
              ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function SmStatusBadge({ entry }: { entry: { status: string; sentiment?: string } }) {
  const { t } = useTranslation();
  if (entry.status === "pending") {
    return <Badge color="amber">{t("mood.status.pending")}</Badge>;
  }
  if (entry.status === "unavailable") {
    return <Badge color="gray">{t("status.assessment.unavailable")}</Badge>;
  }
  return <SentimentBadge sentiment={entry.sentiment} />;
}