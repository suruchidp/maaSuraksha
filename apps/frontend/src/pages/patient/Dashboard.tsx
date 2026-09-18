import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import {
  Heart,
  Bell,
  Calendar,
  Activity,
  FileText,
  Scale,
  Salad,
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
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { Spinner } from "@/components/ui/Spinner";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { SeverityBadge, AlertStatusBadge, AppointmentStatusBadge } from "@/components/status/StatusLabels";
import { PregnancyHero } from "@/components/patient/PregnancyHero";
import { QuickActionCard } from "@/components/patient/QuickActionCard";
import { RecentAssessments } from "@/components/patient/RecentAssessments";
import { formatDate, formatCalendarDate } from "@/lib/date";

export default function PatientDashboardPage() {
  const { t } = useTranslation();
  const lang = useCurrentLanguage();
  const user = useAuthStore((s) => s.user);

  const pregnancy = usePregnancy();
  const metrics = useHealthMetrics(undefined, 5);
  const alerts = useAlerts(undefined, 10);
  const appointments = useAppointments(undefined, 5, 1, "upcoming");
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
  const unreadRecs = (recommendations.data?.items ?? []).filter((r) => !r.isRead).length;
  const openAlerts = (alerts.data?.items ?? []).filter((a) => a.status === "pending").length;

  const hasBP =
    latest && (latest.systolicBP !== undefined || latest.diastolicBP !== undefined);

  return (
    <div className="space-y-6">
      <PregnancyHero
        name={user?.name ?? ""}
        gestationalWeek={pregnancy.data?.gestationalWeek}
        trimester={pregnancy.data?.trimester}
        dueDate={pregnancy.data ? formatDate(pregnancy.data.expectedDueDate, lang) : undefined}
      />

      {pregnancy.data && <Card><Link to="/patient/pregnancy" className="font-semibold text-primary-700 underline">{t('tracking.title')}</Link><p className="mt-2">{pregnancy.data.status === 'completed' ? t('tracking.completed_note') : pregnancy.data.datingNeedsReview ? t('tracking.dating_review') : `${pregnancy.data.gestationalWeek} ${t('pregnancy.weeks')}${pregnancy.data.gestationalDays !== undefined ? ` + ${pregnancy.data.gestationalDays} ${t('tracking.days')}` : ''}`}</p></Card>}
      {/* Quick actions */}
      <div>
        <h2 className="section-title mb-3">{t("dashboard.quickActions")}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
          <QuickActionCard
            to="/patient/assessments"
            icon={<FileText className="w-5 h-5" />}
            label={t("nav.assessments")}
            description={t("patient.dashboard.quickAssessments")}
            accent="blush"
          />
          <QuickActionCard
            to="/patient/metrics"
            icon={<Heart className="w-5 h-5" />}
            label={t("nav.healthMetrics")}
            description={t("patient.dashboard.quickMetrics")}
            accent="sage"
          />
          <QuickActionCard
            to="/patient/appointments"
            icon={<Calendar className="w-5 h-5" />}
            label={t("nav.appointments")}
            description={t("patient.dashboard.quickAppointments")}
            accent="peach"
          />
          <QuickActionCard
            to="/patient/recommendations"
            icon={<FileText className="w-5 h-5" />}
            label={t("nav.recommendations")}
            description={t("patient.dashboard.quickRecommendations")}
            accent="lavender"
            badge={unreadRecs}
          />
          <QuickActionCard
            to="/patient/diet"
            icon={<Salad className="w-5 h-5" />}
            label={t("nav.dietGuidance")}
            description={t("patient.dashboard.quickDiet")}
            accent="cream"
          />
          <QuickActionCard
            to="/patient/alerts"
            icon={<Bell className="w-5 h-5" />}
            label={t("nav.alerts")}
            description={t("patient.dashboard.quickAlerts")}
            accent="blush"
          />
        </div>
      </div>

      {/* Health overview */}
      <div>
        <h2 className="section-title mb-3">{t("patient.dashboard.healthOverview")}</h2>
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
            icon={<Scale className="w-5 h-5" />}
            label={t("patient.dashboard.latestWeight")}
            value={latest?.weight ? `${latest.weight} kg` : t("common.notRecorded")}
            hint={latest ? formatDate(latest.date, lang) : t("patient.dashboard.recordMetric")}
            color="green"
          />
          <StatCard
            icon={<Heart className="w-5 h-5" />}
            label={t("metrics.bp")}
            value={
              hasBP
                ? `${latest?.systolicBP ?? "—"}/${latest?.diastolicBP ?? "—"}`
                : t("common.notRecorded")
            }
            hint={
              hasBP
                ? t("metrics.unitMmHg")
                : t("patient.dashboard.recordMetric")
            }
            color="blush"
          />
          <StatCard
            icon={<Bell className="w-5 h-5" />}
            label={t("patient.dashboard.openAlerts")}
            value={openAlerts}
            hint={openAlerts ? t("patient.dashboard.alertsNeedAttention") : t("patient.dashboard.allClear")}
            color={openAlerts ? "amber" : "green"}
          />
        </div>
      </div>

      {/* Care details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title={t("patient.dashboard.recentAlerts")}>
          {alerts.isError ? (
            <ErrorState message={alerts.error?.message} onRetry={() => alerts.refetch()} />
          ) : (alerts.data?.items ?? []).length === 0 ? (
            <EmptyState compact title={t("alerts.none")} />
          ) : (
            <ul className="space-y-0">
              {(alerts.data?.items ?? []).slice(0, 5).map((alert) => (
                <li key={alert.id} className="py-3 flex items-start gap-3 border-b border-rose-100/60 last:border-0">
                  <SeverityBadge severity={alert.severity} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-800 truncate">{alert.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{alert.message}</p>
                  </div>
                  <AlertStatusBadge status={alert.status} />
                </li>
              ))}
            </ul>
          )}
          <Link
            to="/patient/alerts"
            className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary-700 hover:text-primary-800"
          >
            {t("common.viewAll")} <ChevronRight className="w-4 h-4" />
          </Link>
        </Card>

        <Card title={t("patient.dashboard.upcomingAppointments")}>
          {appointments.isError ? <ErrorState message={appointments.error?.message} onRetry={() => appointments.refetch()} /> : (appointments.data?.items ?? []).length === 0 ? (
            <EmptyState compact title={t("appointments.none")} description={t("appointments.noneDescription")} />
          ) : (
            <ul className="space-y-0">
              {(appointments.data?.items ?? []).slice(0, 4).map((appt) => (
                <li key={appt.id} className="py-3 flex items-center justify-between gap-3 border-b border-rose-100/60 last:border-0">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{t(`appointments.typeOptions.${appt.type}`, { defaultValue: appt.type })}</p>
                    <p className="text-xs text-gray-500">
                      {formatCalendarDate(appt.date, lang)} · {appt.time} · {t("appointments.workflow.indiaTime")}
                    </p>
                  </div>
                  <AppointmentStatusBadge status={appt.status} />
                </li>
              ))}
            </ul>
          )}
          <Link
            to="/patient/appointments"
            className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary-700 hover:text-primary-800"
          >
            {t("common.manage")} <ChevronRight className="w-4 h-4" />
          </Link>
        </Card>

        {user?.id && <RecentAssessments userId={user.id} />}
      </div>
    </div>
  );
}