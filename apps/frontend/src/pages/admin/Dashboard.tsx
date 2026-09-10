import { useTranslation } from "react-i18next";
import { Users, AlertTriangle, HeartPulse, ClipboardList, UserPlus, Activity, Bell } from "lucide-react";
import { useAdminOverview } from "@/hooks/queries";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Spinner } from "@/components/ui/Spinner";
import { ErrorState } from "@/components/ui/ErrorState";

export default function AdminDashboardPage() {
  const { t } = useTranslation();
  const overview = useAdminOverview();

  if (overview.isLoading) return <Spinner />;
  if (overview.isError || !overview.data) {
    return <ErrorState message={overview.error?.message ?? t("common.errorGeneric")} onRetry={() => overview.refetch()} />;
  }

  const d = overview.data;

  return (
    <div className="space-y-6">
      <PageHeader title={t("admin.dashboard.title")} subtitle={t("admin.dashboard.subtitle")} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Users className="w-5 h-5" />} label={t("admin.dashboard.totalUsers")} value={d.users} hint={`${d.activeUsers} ${t("admin.dashboard.active")}`} color="blue" />
        <StatCard icon={<UserPlus className="w-5 h-5" />} label={t("admin.dashboard.patients")} value={d.patients} hint={`${d.ashas} ASHA · ${d.doctors} ${t("admin.dashboard.doctors")}`} color="green" />
        <StatCard icon={<Activity className="w-5 h-5" />} label={t("admin.dashboard.healthMetrics")} value={d.healthMetrics} hint={`${d.pregnancyProfiles} ${t("admin.dashboard.pregnancyProfiles")}`} color="amber" />
        <StatCard icon={<HeartPulse className="w-5 h-5" />} label={t("admin.dashboard.assessments")} value={d.assessments} hint={`${d.symptoms} ${t("admin.dashboard.symptoms")}`} color="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <StatCard icon={<Bell className="w-5 h-5" />} label={t("admin.dashboard.pendingAlerts")} value={d.pendingAlerts} color={d.pendingAlerts > 0 ? "red" : "green"} />
        <StatCard icon={<ClipboardList className="w-5 h-5" />} label={t("admin.dashboard.pendingReferrals")} value={d.pendingReferrals} color={d.pendingReferrals > 0 ? "red" : "green"} />
        <StatCard icon={<AlertTriangle className="w-5 h-5" />} label={t("admin.dashboard.appointments")} value={d.appointments} color="blue" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label={t("admin.dashboard.moodEntries")} value={d.moodEntries} />
        <StatCard label={t("admin.dashboard.usersRole")} value={`${d.patients} ${t("roles.PATIENT")}`} />
        <StatCard label={t("admin.dashboard.ashasRole")} value={d.ashas} />
        <StatCard label={t("admin.dashboard.doctorsRole")} value={d.doctors} />
      </div>
    </div>
  );
}