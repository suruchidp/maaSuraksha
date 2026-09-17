import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { HeartPulse, Users, Activity, ChevronRight } from "lucide-react";
import { usePatients } from "@/hooks/queries";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";

export default function DoctorDashboardPage() {
  const { t } = useTranslation();
  const patients = usePatients("", 100);

  if (patients.isLoading) return <Spinner />;

  const items = patients.data?.items ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title={t("doctor.dashboard.title")} subtitle={t("doctor.dashboard.subtitle")} />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={<Users className="w-5 h-5" />} label={t("doctor.dashboard.myPatients")} value={items.length} color="blue" />
        <StatCard icon={<Activity className="w-5 h-5" />} label={t("doctor.dashboard.runAssessments")} value={t("quickHint.runAssessments")} color="green" hint={t("doctor.dashboard.assessmentsHint")} />
        <StatCard icon={<HeartPulse className="w-5 h-5" />} label={t("doctor.dashboard.monitor")} value={t("quickHint.monitor")} color="amber" hint={t("doctor.dashboard.monitorHint")} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title={t("doctor.dashboard.recentPatients")}>
          {patients.isError ? (
            <ErrorState message={patients.error?.message} onRetry={() => patients.refetch()} />
          ) : items.length === 0 ? (
            <EmptyState title={t("doctor.noPatients")} description={t("doctor.noPatientsDescription")} />
          ) : (
            <ul className="divide-y divide-rose-100/60">
              {items.slice(0, 8).map((p) => (
                <li key={p.id}>
                  <Link to={`/doctor/patients/${p.id}`} className="py-3 flex items-center gap-3 hover:bg-rose-50/60 rounded-lg group">
                    <div className="w-10 h-10 rounded-full bg-accent-50 text-accent-700 flex items-center justify-center font-semibold">
                      {p.name.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                      <p className="text-xs text-gray-500 truncate">{p.phone ?? p.email}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title={t("doctor.dashboard.tasks")}>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex gap-2 items-start">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-500 mt-1.5 shrink-0" />
              {t("doctor.tasks.riskAssess")}
            </li>
            <li className="flex gap-2 items-start">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-500 mt-1.5 shrink-0" />
              {t("doctor.tasks.reviewMetrics")}
            </li>
            <li className="flex gap-2 items-start">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-500 mt-1.5 shrink-0" />
              {t("doctor.tasks.refer")}
            </li>
            <li className="flex gap-2 items-start">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-500 mt-1.5 shrink-0" />
              {t("doctor.tasks.recommend")}
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
}