import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Bell } from "lucide-react";
import { useAlerts, useUpdateAlertStatus, useReadAlert } from "@/hooks/queries";
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
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const alerts = useAlerts(undefined, 20, page, status || undefined);
  const updateStatus = useUpdateAlertStatus();
  const readAlert = useReadAlert();

  const items = [...(alerts.data?.items ?? [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="space-y-6">
      <PageHeader title={t("alerts.title")} subtitle={t("alerts.subtitle")} actions={
        <Button variant="outline" loading={alerts.isFetching} onClick={() => alerts.refetch()}>{t("alerts.refresh")}</Button>
      } />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2" role="group" aria-label={t("alerts.filter")}>
          {["", "unread", "pending", "acknowledged", "resolved"].map((value) => (
            <Button key={value} size="sm" variant={status === value ? "primary" : "outline"}
              aria-pressed={status === value}
              onClick={() => { setStatus(value); setPage(1); updateStatus.reset(); }}>
              {value === "unread" ? t("alerts.unread") : value ? t(`status.alert.${value}`) : t("alerts.all")}
            </Button>
          ))}
        </div>
        {alerts.data && !alerts.isError && <p className="text-sm text-gray-500">{t("alerts.count", { count: alerts.data.total })}</p>}
      </div>
      {updateStatus.isError && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{t("alerts.updateError")}</p>}
      {readAlert.isError && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{t("alerts.readError")}</p>}
      {updateStatus.isSuccess && <p role="status" className="rounded-xl bg-green-50 p-3 text-sm text-green-700">{t("alerts.acknowledged")}</p>}

      {alerts.isLoading ? <Spinner /> : alerts.isError ? (
        <ErrorState message={alerts.error?.message} onRetry={() => alerts.refetch()} />
      ) : items.length === 0 ? (
        <Card>
          <EmptyState icon={<Bell className="w-6 h-6 text-primary-400" aria-hidden />}
            title={t(status ? "alerts.noMatches" : "alerts.none")}
            description={t(status ? "alerts.noMatchesDescription" : "alerts.noneDescription")} />
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onRead={(id) => readAlert.mutate(id, { onSuccess: () => { if (status === "unread" && items.length === 1 && page > 1) setPage(page - 1); } })}
              reading={readAlert.isPending}
              lang={lang}
              busy={updateStatus.isPending}
              saving={updateStatus.isPending && updateStatus.variables?.id === alert.id}
              onAcknowledge={(id) => updateStatus.mutate({ id, status: "acknowledged" }, {
                onSuccess: () => { if (["pending", "unread"].includes(status) && items.length === 1 && page > 1) setPage(page - 1); },
              })}
            />
          ))}
        </div>
      )}
      {!alerts.isError && !alerts.isLoading && (page > 1 || (alerts.data?.totalPages ?? 0) > 1) && (
        <nav className="flex items-center justify-between gap-3" aria-label={t("alerts.page", { page, total: alerts.data?.totalPages ?? page })}>
          <Button variant="outline" disabled={page === 1 || alerts.isFetching} onClick={() => setPage(page - 1)}>{t("alerts.previous")}</Button>
          <span className="text-sm text-gray-500">{t("alerts.page", { page, total: Math.max(page, alerts.data?.totalPages ?? 1) })}</span>
          <Button variant="outline" disabled={page >= (alerts.data?.totalPages ?? 1) || alerts.isFetching} onClick={() => setPage(page + 1)}>{t("alerts.next")}</Button>
        </nav>
      )}
    </div>
  );
}

function AlertCard({
  alert,
  lang,
  onAcknowledge,
  busy,
  saving,
  onRead,
  reading,
}: {
  alert: AlertDTO;
  lang: Language;
  onAcknowledge: (id: string) => void;
  busy: boolean;
  saving: boolean;
  onRead: (id: string) => void;
  reading: boolean;
}) {
  const { t } = useTranslation();
  return (
    <Card>
      <div className="flex flex-wrap items-center gap-2 mb-1">
        <SeverityBadge severity={alert.severity} />
        <span className="text-xs text-gray-500">{t(`alerts.categories.${alert.type}`, { defaultValue: alert.type })}</span>
        <span className="text-xs font-medium text-primary-700">{t(alert.readAt ? "alerts.read" : "alerts.unread")}</span>
        <AlertStatusBadge status={alert.status} />
        <span className="text-xs text-gray-400">{formatDate(alert.createdAt, lang)}</span>
      </div>
      <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
        <Bell className="w-4 h-4 text-gray-400" /> {alert.title}
      </h3>
      <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{alert.message}</p>
      {!alert.readAt && <Button className="mt-2" size="sm" variant="ghost" disabled={reading} onClick={() => onRead(alert.id)}>{t("alerts.markRead")}</Button>}
      {alert.status === "pending" && (
        <div className="mt-3">
          <Button size="sm" variant="outline" disabled={busy} loading={saving} onClick={() => onAcknowledge(alert.id)}>
            {t(saving ? "alerts.acknowledging" : "alerts.acknowledge")}
          </Button>
        </div>
      )}
      {alert.source && <p className="text-xs text-gray-400 mt-2">{t("alerts.source")}: {alert.source}</p>}
    </Card>
  );
}
