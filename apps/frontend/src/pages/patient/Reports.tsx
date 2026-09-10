import { useTranslation } from "react-i18next";
import { FileBarChart, Download } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useReports, useCreateReport } from "@/hooks/queries";
import { useCurrentLanguage } from "@/hooks/useAuth";
import { getApiErrorMessage } from "@/lib/api";
import { useToastStore } from "@/stores/toastStore";
import { formatDate } from "@/lib/date";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";

export default function ReportsPage() {
  const { t } = useTranslation();
  const lang = useCurrentLanguage();
  const user = useAuthStore((s) => s.user);
  const push = useToastStore((s) => s.push);
  const reports = useReports(50);
  const create = useCreateReport();

  const requestSnapshot = () => {
    if (!user) return;
    create.mutate(
      {
        input: {
          type: "snapshot",
          title: t("reports.snapshotTitle"),
          data: { generatedAt: new Date().toISOString() },
        },
        userId: user.id,
      },
      {
        onSuccess: () => push(t("reports.generated"), "success"),
        onError: (err) => push(getApiErrorMessage(err), "error"),
      }
    );
  };

  if (reports.isLoading) return <Spinner />;

  const items = [...(reports.data?.items ?? [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="space-y-6">
      <PageHeader title={t("reports.title")} subtitle={t("reports.subtitle")} />

      <div className="flex items-center justify-end">
        <Button onClick={requestSnapshot} loading={create.isPending}>
          <Download className="w-4 h-4" />
          {t("reports.requestSnapshot")}
        </Button>
      </div>

      {reports.isError ? (
        <ErrorState message={reports.error?.message} onRetry={() => reports.refetch()} />
      ) : items.length === 0 ? (
        <Card>
          <EmptyState title={t("reports.none")} description={t("reports.noneDescription")} />
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((report) => (
            <Card key={report.id}>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary-50 text-primary-700 flex items-center justify-center shrink-0">
                  <FileBarChart className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-gray-900 text-sm">{report.title}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {t(`report.type.${report.type}`, { defaultValue: report.type })} · {formatDate(report.createdAt, lang)}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}