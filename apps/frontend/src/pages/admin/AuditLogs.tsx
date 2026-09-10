import { useTranslation } from "react-i18next";
import { useAuditLogs } from "@/hooks/queries";
import { useCurrentLanguage } from "@/hooks/useAuth";
import { formatDate } from "@/lib/date";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";

export default function AdminAuditLogsPage() {
  const { t } = useTranslation();
  const lang = useCurrentLanguage();
  const logs = useAuditLogs(200);

  if (logs.isLoading) return <Spinner />;

  const items = logs.data?.items ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title={t("admin.audit.title")} subtitle={t("admin.audit.subtitle")} />

      {logs.isError ? (
        <ErrorState message={logs.error?.message} onRetry={() => logs.refetch()} />
      ) : items.length === 0 ? (
        <Card>
          <EmptyState title={t("admin.audit.none")} />
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                  <th className="py-2 pr-3 font-medium">{t("admin.audit.time")}</th>
                  <th className="py-2 pr-3 font-medium">{t("admin.audit.actor")}</th>
                  <th className="py-2 pr-3 font-medium">{t("admin.audit.action")}</th>
                  <th className="py-2 pr-3 font-medium">{t("admin.audit.resource")}</th>
                  <th className="py-2 font-medium">{t("admin.audit.resourceId")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((log) => (
                  <tr key={log.id}>
                    <td className="py-2 pr-3 text-gray-500 whitespace-nowrap">{formatDate(log.createdAt, lang)}</td>
                    <td className="py-2 pr-3 text-gray-900">
                      {log.actor ? `${log.actor.name} (${t(`roles.${log.actor.role}`)})` : t("common.system")}
                    </td>
                    <td className="py-2 pr-3">
                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">{log.action}</span>
                    </td>
                    <td className="py-2 pr-3 text-gray-600">{log.resource}</td>
                    <td className="py-2 text-gray-400 text-xs">{log.resourceId ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}