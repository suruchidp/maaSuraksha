import { useTranslation } from "react-i18next";
import { Bell } from "lucide-react";
import { useAlerts, useUpdateAlertStatus } from "@/hooks/queries";
import { useCurrentLanguage } from "@/hooks/useAuth";
import { formatDate } from "@/lib/date";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  SeverityBadge,
  AlertStatusBadge,
} from "@/components/status/StatusLabels";
import type { AlertDTO } from "@/lib/types";
import { Language } from "@maasuraksha/shared";

export default function AlertsPage() {
  const { t } = useTranslation();
  const lang = useCurrentLanguage();
  const alerts = useAlerts(undefined, 100);
  const updateStatus = useUpdateAlertStatus();

  if (alerts.isLoading) return <Spinner />;

  const items = [...(alerts.data?.items ?? [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="space-y-6">
      <PageHeader title={t("alerts.title")} subtitle={t("alerts.subtitle")} />

      {alerts.isError ? (
        <ErrorState message={alerts.error?.message} onRetry={() => alerts.refetch()} />
      ) : items.length === 0 ? (
        <Card>
          <EmptyState title={t("alerts.none")} description={t("alerts.noneDescription")} />
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              lang={lang}
              onAcknowledge={(id) => updateStatus.mutate({ id, status: "acknowledged" })}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function AlertCard({
  alert,
  lang,
  onAcknowledge,
}: {
  alert: AlertDTO;
  lang: Language;
  onAcknowledge: (id: string) => void;
}) {
  const { t } = useTranslation();
  return (
    <Card>
      <div className="flex flex-wrap items-center gap-2 mb-1">
        <SeverityBadge severity={alert.severity} />
        <AlertStatusBadge status={alert.status} />
        <span className="text-xs text-gray-400">{formatDate(alert.createdAt, lang)}</span>
      </div>
      <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
        <Bell className="w-4 h-4 text-gray-400" /> {alert.title}
      </h3>
      <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{alert.message}</p>
      {alert.status === "pending" && (
        <div className="mt-3">
          <Button size="sm" variant="outline" onClick={() => onAcknowledge(alert.id)}>
            {t("alerts.acknowledge")}
          </Button>
        </div>
      )}
      {alert.source && <p className="text-xs text-gray-400 mt-2">{t("alerts.source")}: {alert.source}</p>}
    </Card>
  );
}