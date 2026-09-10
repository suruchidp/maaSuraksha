import { useTranslation } from "react-i18next";
import { useRecommendations, useMarkRecommendationRead } from "@/hooks/queries";
import { useCurrentLanguage } from "@/hooks/useAuth";
import { formatDate } from "@/lib/date";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { PriorityBadge } from "@/components/status/StatusLabels";
import type { RecommendationDTO } from "@/lib/types";
import { Language } from "@maasuraksha/shared";

export default function RecommendationsPage() {
  const { t } = useTranslation();
  const lang = useCurrentLanguage();
  const recommendations = useRecommendations(undefined, 100);
  const markRead = useMarkRecommendationRead();

  if (recommendations.isLoading) return <Spinner />;

  const items = [...(recommendations.data?.items ?? [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="space-y-6">
      <PageHeader title={t("recommendations.title")} subtitle={t("recommendations.subtitle")} />

      {recommendations.isError ? (
        <ErrorState message={recommendations.error?.message} onRetry={() => recommendations.refetch()} />
      ) : items.length === 0 ? (
        <Card>
          <EmptyState title={t("recommendations.none")} description={t("recommendations.noneDescription")} />
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((rec) => (
            <RecommendationCard
              key={rec.id}
              rec={rec}
              lang={lang}
              onMarkRead={(id, read) => markRead.mutate({ id, read })}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function RecommendationCard({
  rec,
  lang,
  onMarkRead,
}: {
  rec: RecommendationDTO;
  lang: Language;
  onMarkRead: (id: string, read: boolean) => void;
}) {
  const { t } = useTranslation();
  return (
    <Card>
      <div className="flex flex-wrap items-center gap-2 mb-1">
        <PriorityBadge priority={rec.priority} />
        <span className="text-xs text-gray-400">
          {formatDate(rec.createdAt, lang)} · {t(`recommendations.category.${rec.category}`, { defaultValue: rec.category })}
        </span>
        {rec.isPersonalized && <span className="text-xs bg-accent-50 text-accent-700 px-2 py-0.5 rounded">{t("recommendations.personalized")}</span>}
        {!rec.isRead && <span className="text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded">{t("recommendations.unread")}</span>}
      </div>
      <h3 className="font-semibold text-gray-900 text-sm">{rec.title}</h3>
      <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{rec.content}</p>
      <div className="mt-3 flex items-center gap-3">
        {!rec.isRead && (
          <Button size="sm" variant="outline" onClick={() => onMarkRead(rec.id, true)}>
            {t("recommendations.markRead")}
          </Button>
        )}
        {rec.source && <span className="text-xs text-gray-400">{t("recommendations.source")}: {rec.source}</span>}
      </div>
    </Card>
  );
}