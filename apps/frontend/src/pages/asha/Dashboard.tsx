import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CalendarClock, ChevronRight, ClipboardList, Hospital, Users } from "lucide-react";
import { usePatients, useAppointments, useAlerts, useReferrals } from "@/hooks/queries";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { PageHeader } from "@/components/ui/PageHeader";
import { Spinner } from "@/components/ui/Spinner";
import { StatCard } from "@/components/ui/StatCard";

function formatDate(date?: string) {
  if (!date) return "—";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function statusBadge(status: string) {
  if (status === "confirmed") {
    return <span className="rounded-full bg-emerald-100 text-emerald-700 px-2 py-1 text-[10px] font-semibold">{status}</span>;
  }
  if (status === "completed") {
    return <span className="rounded-full bg-gray-100 text-gray-600 px-2 py-1 text-[10px] font-semibold">{status}</span>;
  }
  return <span className="rounded-full bg-amber-100 text-amber-700 px-2 py-1 text-[10px] font-semibold">{status}</span>;
}

export default function ASHADashboardPage() {
  const { t } = useTranslation();

  const patients = usePatients("", 100);
  const appointments = useAppointments();
  const alerts = useAlerts();
  const referrals = useReferrals();

  const patientItems = patients.data?.items ?? [];

  const patientNameMap = useMemo(() => {
    const names = new Map<string, string>();
    patientItems.forEach((patient) => names.set(patient.id, patient.name));
    return names;
  }, [patientItems]);

  const { pendingAlerts, pendingReferrals, upcomingAppointments } = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);

    const alertItems = alerts.data?.items ?? [];
    const pendingAlertsList = alertItems.filter((a) => a.status === "pending");

    const referralItems = referrals.data?.items ?? [];
    const pendingReferralsList = referralItems.filter((r) => r.status === "pending" || r.status === "accepted");

    const appointmentItems = appointments.data?.items ?? [];
    const upcomingAppointmentsList = appointmentItems.filter((a) => a.date >= today && (a.status === "scheduled" || a.status === "confirmed"));

    return {
      pendingAlerts: pendingAlertsList,
      pendingReferrals: pendingReferralsList,
      upcomingAppointments: upcomingAppointmentsList,
    };
  }, [alerts.data, appointments.data, referrals.data]);

  if (patients.isLoading) return <Spinner />;

  return (
    <div className="space-y-6">
      <PageHeader title={t("asha.dashboard.title")} subtitle={t("asha.dashboard.subtitle")} />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={<Users className="w-5 h-5" />} label={t("asha.dashboard.assignedWomen")} value={patientItems.length} color="green" />
        <StatCard icon={<ClipboardList className="w-5 h-5" />} label={t("asha.dashboard.followUpsDue")} value={pendingAlerts.length} color="amber" />
        <StatCard icon={<CalendarClock className="w-5 h-5" />} label={t("asha.dashboard.upcomingVisits")} value={upcomingAppointments.length} color="blue" />
        <StatCard icon={<Hospital className="w-5 h-5" />} label={t("asha.dashboard.pendingReferrals")} value={pendingReferrals.length} color="blush" />
      </div>

      {patients.isError ? (
        <ErrorState message={patients.error?.message} onRetry={() => patients.refetch()} />
      ) : null}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card title={t("asha.dashboard.needsFollowUp")} tone="peach">
          {pendingAlerts.length === 0 ? (
            <EmptyState title={t("asha.noFollowUpsDue")} description={t("asha.noFollowUpsDueDescription")} />
          ) : (
            <div className="space-y-3">
              {pendingAlerts.slice(0, 6).map((alert) => (
                <div key={alert.id} className="rounded-2xl border border-rose-100 bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900">{patientNameMap.get(alert.user) ?? "Assigned patient"}</p>
                      <p className="mt-0.5 text-xs text-gray-500">{alert.title}</p>
                    </div>
                    <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${alert.severity === "critical" || alert.severity === "urgent" ? "border-red-200 bg-red-100 text-red-700" : "border-amber-200 bg-amber-100 text-amber-700"}`}>
                      {alert.severity}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-gray-600">{alert.message}</p>
                  <Link to={`/asha/patients/${alert.user}`} className="mt-3 inline-block rounded-xl border border-rose-100 bg-white px-3 py-2 text-xs font-medium text-gray-700">
                    {t("asha.dashboard.viewPatient")}
                  </Link>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title={t("asha.dashboard.recentPatients")}>
          {patientItems.length === 0 ? (
            <EmptyState title={t("asha.noAssignedWomen")} description={t("asha.noAssignedWomenDescription")} />
          ) : (
            <>
              <ul className="divide-y divide-rose-50/60">
                {patientItems.slice(0, 5).map((patient) => (
                  <li key={patient.id}>
                    <Link to={`/asha/patients/${patient.id}`} className="flex items-center gap-3 rounded-xl py-3 hover:bg-rose-50/60">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-50 font-semibold text-primary-700">{patient.name.charAt(0)}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium text-gray-900">{patient.name}</span>
                        <span className="block truncate text-xs text-gray-500">{patient.phone ?? patient.email}</span>
                      </span>
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </Link>
                  </li>
                ))}
              </ul>
              <Link to="/asha/patients" className="mt-3 inline-block text-sm font-medium text-primary-700">{t("asha.dashboard.viewAll")}</Link>
            </>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card title={t("asha.dashboard.upcomingPatientCare")}>
          {upcomingAppointments.length === 0 ? (
            <EmptyState title={t("asha.noUpcomingAppointments")} description={t("asha.noUpcomingAppointmentsDescription")} />
          ) : (
            <>
              <div className="space-y-3">
                {upcomingAppointments.slice(0, 5).map((appointment) => (
                  <div key={appointment.id} className="rounded-2xl border border-rose-100 bg-white p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-gray-900">{patientNameMap.get(appointment.patient) ?? appointment.patient}</p>
                      {statusBadge(appointment.status)}
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-gray-600">
                      <div>{appointment.type}</div>
                      <div>{formatDate(appointment.date)} · {appointment.time}</div>
                    </div>
                  </div>
                ))}
              </div>
              <Link to="/asha/appointments" className="mt-3 inline-block text-sm font-medium text-primary-700">{t("asha.dashboard.viewAll")}</Link>
            </>
          )}
        </Card>

        <Card title={t("asha.dashboard.pendingReferrals")}>
          {pendingReferrals.length === 0 ? (
            <EmptyState title={t("asha.noPendingReferrals")} description={t("asha.noPendingReferralsDescription")} />
          ) : (
            <>
              <div className="space-y-3">
                {pendingReferrals.slice(0, 5).map((referral) => (
                  <div key={referral.id} className="rounded-2xl border border-rose-100 bg-white p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-gray-900">{patientNameMap.get(referral.patient) ?? referral.patient}</p>
                      <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-700">{referral.status}</span>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-gray-600">
                      <div>{t("asha.dashboard.referralReason")}: {referral.reason}</div>
                      <div>{t("asha.dashboard.referralFacility")}: {referral.facility ?? "—"}</div>
                    </div>
                    <Link to={`/asha/patients/${referral.patient}`} className="mt-3 inline-block text-xs font-medium text-primary-700">
                      {t("asha.dashboard.viewPatient")}
                    </Link>
                  </div>
                ))}
              </div>
              <Link to="/asha/referrals" className="mt-3 inline-block text-sm font-medium text-primary-700">{t("asha.dashboard.viewAll")}</Link>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}