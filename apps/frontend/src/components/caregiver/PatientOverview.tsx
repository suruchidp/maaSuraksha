import { useTranslation } from "react-i18next";
import { User, Phone } from "lucide-react";
import { usePregnancy, useHealthMetrics, useAlerts, useAppointments, useReferrals, useUpdateAlertStatus } from "@/hooks/queries";
import { useCurrentLanguage } from "@/hooks/useAuth";
import { formatDate } from "@/lib/date";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { MetricTrendChart } from "@/components/charts/MetricTrendChart";
import { TrimesterLabel, SeverityBadge, AlertStatusBadge, AppointmentStatusBadge, ReferralStatusBadge } from "@/components/status/StatusLabels";
import type { UserDTO } from "@/lib/types";

export function PatientOverview({ patient }: { patient: UserDTO }) {
  const { t } = useTranslation();
  const lang = useCurrentLanguage();
  const pid = patient.id;

  const pregnancy = usePregnancy(pid);
  const metrics = useHealthMetrics(pid, 30);
  const alerts = useAlerts(pid, 20);
  const appointments = useAppointments(pid, 20);
  const referrals = useReferrals(pid, 20);
  const updateAlertStatus = useUpdateAlertStatus();

  const loading =
    pregnancy.isLoading || metrics.isLoading || alerts.isLoading || appointments.isLoading || referrals.isLoading;

  if (loading) return <Spinner />;

  const metricItems = metrics.data?.items ?? [];

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary-50 text-primary-700 flex items-center justify-center">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{patient.name}</h2>
            <p className="text-xs text-gray-500">{patient.email}</p>
            {patient.phone && (
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <Phone className="w-3 h-3" /> {patient.phone}
              </p>
            )}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title={t("caregiver.pregnancy")}>
          {pregnancy.isError && pregnancy.data === undefined ? (
            <EmptyState title={t("pregnancy.notFound")} />
          ) : pregnancy.data ? (
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-xs text-gray-500">{t("pregnancy.gestationalWeek")}</dt>
                <dd className="font-medium text-gray-900 mt-0.5">{pregnancy.data.gestationalWeek} {t("pregnancy.weeks")}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">{t("pregnancy.trimester")}</dt>
                <dd className="font-medium text-gray-900 mt-0.5"><TrimesterLabel trimester={pregnancy.data.trimester} /></dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">{t("pregnancy.dueDate")}</dt>
                <dd className="font-medium text-gray-900 mt-0.5">{formatDate(pregnancy.data.expectedDueDate, lang)}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">{t("pregnancy.riskStatus")}</dt>
                <dd className="mt-0.5">
                  <span className={`text-xs px-2 py-0.5 rounded ${pregnancy.data.isHighRisk ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>
                    {pregnancy.data.isHighRisk ? t("pregnancy.highRisk") : t("pregnancy.lowRisk")}
                  </span>
                </dd>
              </div>
            </dl>
          ) : (
            <EmptyState title={t("common.noData")} />
          )}
        </Card>

        <Card title={t("caregiver.latestMetrics")}>
          {metricItems.length === 0 ? (
            <EmptyState title={t("metrics.none")} />
          ) : (
            <dl className="grid grid-cols-2 gap-3 text-sm">
              {metricItems[0].weight !== undefined && (
                <div>
                  <dt className="text-xs text-gray-500">{t("metrics.weight")}</dt>
                  <dd className="font-medium text-gray-900 mt-0.5">{metricItems[0].weight} kg</dd>
                </div>
              )}
              {metricItems[0].systolicBP !== undefined && (
                <div>
                  <dt className="text-xs text-gray-500">{t("metrics.bp")}</dt>
                  <dd className="font-medium text-gray-900 mt-0.5">
                    {metricItems[0].systolicBP}/{metricItems[0].diastolicBP ?? "â€”"} mmHg
                  </dd>
                </div>
              )}
              {metricItems[0].glucose !== undefined && (
                <div>
                  <dt className="text-xs text-gray-500">{t("metrics.glucose")}</dt>
                  <dd className="font-medium text-gray-900 mt-0.5">{metricItems[0].glucose} mg/dL</dd>
                </div>
              )}
              {metricItems[0].hemoglobin !== undefined && (
                <div>
                  <dt className="text-xs text-gray-500">{t("metrics.hemoglobin")}</dt>
                  <dd className="font-medium text-gray-900 mt-0.5">{metricItems[0].hemoglobin} g/dL</dd>
                </div>
              )}
              <div className="col-span-2">
                <dt className="text-xs text-gray-500">{t("metrics.lastRecorded")}</dt>
                <dd className="text-sm text-gray-700 mt-0.5">{formatDate(metricItems[0].date, lang)}</dd>
              </div>
            </dl>
          )}
          {metricItems.length > 1 && (
            <div className="mt-4">
              <MetricTrendChart metrics={[...metricItems].reverse()} metricKey="systolicBP" color="#db2777" />
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title={t("caregiver.recentAlerts")}>
          {alerts.isError ? (
            <ErrorState message={alerts.error?.message} onRetry={() => alerts.refetch()} />
          ) : (alerts.data?.items ?? []).length === 0 ? (
            <EmptyState title={t("alerts.none")} />
          ) : (
            <ul className="divide-y divide-rose-100/60">
              {(alerts.data?.items ?? []).map((alert) => (
                <li key={alert.id} className="py-3 flex items-start gap-3">
                  <SeverityBadge severity={alert.severity} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{alert.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{alert.message}</p>
                  </div>
                  {alert.status === "pending" ? (
                    <Button size="sm" variant="outline" onClick={() => updateAlertStatus.mutate({ id: alert.id, status: "acknowledged" })}>
                      {t("alerts.acknowledge")}
                    </Button>
                  ) : (
                    <AlertStatusBadge status={alert.status} />
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div className="space-y-6">
          <Card title={t("caregiver.appointments")}>
            {(appointments.data?.items ?? []).length === 0 ? (
              <EmptyState title={t("appointments.none")} />
            ) : (
              <ul className="divide-y divide-rose-100/60">
                {(appointments.data?.items ?? []).slice(0, 4).map((appt) => (
                  <li key={appt.id} className="py-2 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {t(`appointments.typeOptions.${appt.type}`, { defaultValue: appt.type })}
                      </p>
                      <p className="text-xs text-gray-500">{formatDate(appt.date, lang)} Â· {appt.time}</p>
                    </div>
                    <AppointmentStatusBadge status={appt.status} />
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title={t("caregiver.referrals")}>
            {(referrals.data?.items ?? []).length === 0 ? (
              <EmptyState title={t("referrals.none")} />
            ) : (
              <ul className="divide-y divide-rose-100/60">
                {(referrals.data?.items ?? []).slice(0, 4).map((ref) => (
                  <li key={ref.id} className="py-2 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{ref.reason}</p>
                      <p className="text-xs text-gray-500">{formatDate(ref.createdAt, lang)}</p>
                    </div>
                    <ReferralStatusBadge status={ref.status} />
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}