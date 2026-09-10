import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Users, ChevronRight } from "lucide-react";
import { usePatients } from "@/hooks/queries";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";

export default function ASHADashboardPage() {
  const { t } = useTranslation();
  const patients = usePatients("", 100);

  if (patients.isLoading) return <Spinner />;

  const items = patients.data?.items ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title={t("asha.dashboard.title")} subtitle={t("asha.dashboard.subtitle")} />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={<Users className="w-5 h-5" />}
          label={t("asha.dashboard.assignedPatients")}
          value={items.length}
          color="green"
        />
      </div>

      {patients.isError ? (
        <ErrorState message={patients.error?.message} onRetry={() => patients.refetch()} />
      ) : items.length === 0 ? (
        <Card>
          <EmptyState title={t("asha.noPatients")} description={t("asha.noPatientsDescription")} />
        </Card>
      ) : (
        <Card title={t("asha.dashboard.recentPatients")}>
          <ul className="divide-y divide-gray-100">
            {items.slice(0, 10).map((p) => (
              <li key={p.id}>
                <Link to={`/asha/patients/${p.id}`} className="py-3 flex items-center gap-3 hover:bg-gray-50 rounded-lg group">
                  <div className="w-10 h-10 rounded-full bg-primary-50 text-primary-700 flex items-center justify-center font-semibold">
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
        </Card>
      )}
    </div>
  );
}