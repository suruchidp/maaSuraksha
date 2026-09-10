import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import {
  Heart,
  Bell,
  Calendar,
  Activity,
  FileText,
  MessageCircle,
  ChevronRight,
} from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import {
  usePregnancy,
  useHealthMetrics,
  useAlerts,
  useAppointments,
  useRecommendations,
} from "@/hooks/queries";
import { useCurrentLanguage } from "@/hooks/useAuth";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import { ErrorState } from "@/components/ui/ErrorState";
import { Badge } from "@/components/ui/Badge";
import { SeverityBadge, AlertStatusBadge, AppointmentStatusBadge } from "@/components/status/StatusLabels";
import { formatDate } from "@/lib/date";

export default function PatientDashboardPage() {
  const { t } = useTranslation();
  const lang = useCurrentLanguage();
  const user = useAuthStore((s) => s.user);

  const pregnancy = usePregnancy();
  const metrics = useHealthMetrics(undefined, 5);
  const alerts = useAlerts(undefined, 10);
  const appointments = useAppointments(undefined, 5);
  const recommendations = useRecommendations(undefined, 10);

  if (
    pregnancy.isLoading ||
    metrics.isLoading ||
    alerts.isLoading ||
    appointments.isLoading ||
    recommendations.isLoading
  ) {
    return <Spinner />;
  }

  const latest = metrics.data?.items?.[0];
  const upcoming = (appointments.data?.items ?? []).find(
    (a) => new Date(a.date) >= new Date() && a.status !== "cancelled" && a.status !== "missed"
  );
  const unreadRecs = (recommendations.data?.items ?? []).filter((r) => !r.isRead).length;
  const openAlerts = (alerts.data?.items ?? []).filter((a) => a.status === "pending").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("dashboard.welcome", { name: user?.name ?? "" })}
        subtitle={t("patient.dashboard.subtitle")}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Activity className="w-5 h-5" />}
          label={t("patient.dashboard.gestationalWeek")}
          value={
            pregnancy.data
              ? `${pregnancy.data.gestationalWeek} ${t("pregnancy.weeks")}`
              : t("common.notSet")
          }
          hint={
            pregnancy.data
              ? t("pregnancy.dueDate", {
                  date: formatDate(pregnancy.data.expectedDueDate, lang),
                })
              : t("patient.dashboard.setUpPregnancy")
          }
        />
        <StatCard
          icon={<Heart className="w-5 h-5" />}
          label={t("patient.dashboard.latestWeight")}
          value={latest?.weight ? `${latest.weight} kg` : t("common.notRecorded")}
          hint={latest ? formatDate(latest.date, lang) : t("patient.dashboard.recordMetric")}
          color="green"
        />
        <StatCard
          icon={<Bell className="w-5 h-5" />}
          label={t("patient.dashboard.openAlerts")}
          value={openAlerts}
          hint={openAlerts ? t("patient.dashboard.alertsNeedAttention") : t("patient.dashboard.allClear")}
          color={openAlerts ? "amber" : "green"}
        />
        <StatCard
          icon={<Calendar className="w-5 h-5" />}
          label={t("patient.dashboard.nextAppointment")}
          value={
            upcoming ? formatDate(upcoming.date, lang) : t("common.noneUpcoming")
          }
          hint={upcoming ? upcoming.type : t("patient.dashboard.bookAppointment")}
          color="blue"
        />
      </div>

      {!pregnancy.data && (
        <Card className="border-primary-200 bg-primary-50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="font-medium text-primary-800">{t("patient.pregnancy.ctaTitle")}</p>
              <p className="text-sm text-primary-700 mt-0.5">{t("patient.pregnancy.ctaDescription")}</p>
            </div>
            <Link to="/patient/pregnancy">
              <span className="inline-flex items-center gap-1 text-sm font-medium text-primary-700 hover:text-primary-800">
                {t("common.setUp")} <ChevronRight className="w-4 h-4" />
              </span>
            </Link>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title={t("patient.dashboard.recentAlerts")}>
          {alerts.isError ? (
            <ErrorState message={alerts.error?.message} onRetry={() => alerts.refetch()} />
          ) : (alerts.data?.items ?? []).length === 0 ? (
            <EmptyState title={t("alerts.none")} />
          ) : (
            <ul className="divide-y divide-gray-100">
              {(alerts.data?.items ?? []).slice(0, 5).map((alert) => (
                <li key={alert.id} className="py-3 flex items-start gap-3">
                  <SeverityBadge severity={alert.severity} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{alert.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{alert.message}</p>
                  </div>
                  <AlertStatusBadge status={alert.status} />
                </li>
              ))}
            </ul>
          )}
          <Link to="/patient/alerts" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700">
            {t("common.viewAll")} <ChevronRight className="w-4 h-4" />
          </Link>
        </Card>

        <Card title={t("patient.dashboard.upcomingAppointments")}>
          {(appointments.data?.items ?? []).length === 0 ? (
            <EmptyState title={t("appointments.none")} description={t("appointments.noneDescription")} />
          ) : (
            <ul className="divide-y divide-gray-100">
              {(appointments.data?.items ?? []).slice(0, 4).map((appt) => (
                <li key={appt.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{appt.type}</p>
                    <p className="text-xs text-gray-500">
                      {formatDate(appt.date, lang)} · {appt.time}
                    </p>
                  </div>
                  <AppointmentStatusBadge status={appt.status} />
                </li>
              ))}
            </ul>
          )}
          <Link to="/patient/appointments" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700">
            {t("common.manage")} <ChevronRight className="w-4 h-4" />
          </Link>
        </Card>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">{t("dashboard.quickActions")}</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <QuickLink to="/patient/assessments" icon={<FileText className="w-5 h-5" />} label={t("nav.assessments")} />
          <QuickLink to="/patient/mood" icon={<MessageCircle className="w-5 h-5" />} label={t("nav.moodJournal")} />
          <QuickLink to="/patient/symptoms" icon={<Activity className="w-5 h-5" />} label={t("nav.symptoms")} />
          <QuickLink to="/patient/metrics" icon={<Heart className="w-5 h-5" />} label={t("nav.healthMetrics")} />
          {unreadRecs > 0 && (
            <QuickLink to="/patient/recommendations" icon={<Bell className="w-5 h-5" />} label={`${t("nav.recommendations")} (${unreadRecs})`} />
          )}
        </div>
      </div>
    </div>
  );
}

function QuickLink({
  to,
  icon,
  label,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      to={to}
      className="card hover:border-primary-200 hover:shadow-md transition-shadow flex items-center gap-3 py-4"
    >
      <div className="w-9 h-9 rounded-lg bg-primary-50 text-primary-700 flex items-center justify-center">
        {icon}
      </div>
      <span className="text-sm font-medium text-gray-800">{label}</span>
    </Link>
  );
}