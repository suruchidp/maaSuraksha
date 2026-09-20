import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CalendarClock, ChevronRight, HeartPulse, Users } from "lucide-react";
import { RiskLevel } from "@maasuraksha/shared";
import { usePatients, useAppointments, useLatestRiskByPatient } from "@/hooks/queries";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";

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

function RiskBadge({ riskLevel }: { riskLevel?: RiskLevel }) {
  if (riskLevel === RiskLevel.HIGH || riskLevel === RiskLevel.CRITICAL) {
    return <span className="inline-flex rounded-full border border-red-200 bg-red-50 px-2 py-1 text-[10px] font-semibold text-red-700">High Risk</span>;
  }
  if (riskLevel === RiskLevel.MEDIUM) {
    return <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-700">Moderate Risk</span>;
  }
  return null;
}

export default function DoctorDashboardPage() {
  const { t } = useTranslation();
  const patients = usePatients("", 100);
  const appointments = useAppointments();

  const patientItems = patients.data?.items ?? [];
  const riskResults = useLatestRiskByPatient(patientItems);

  const { patientNameMap, upcomingAppointments, reviewNeeded } = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const names = new Map<string, string>();
    patientItems.forEach((patient) => names.set(patient.id, patient.name));

    const appointmentItems = appointments.data?.items ?? [];
    const upcomingAppointmentsList = appointmentItems.filter((a) => a.date >= today && (a.status === "scheduled" || a.status === "confirmed"));

    const high: typeof patientItems = [];
    patientItems.forEach((patient, index) => {
      const riskLevel = riskResults[index]?.data?.riskLevel;
      if (riskLevel === RiskLevel.HIGH || riskLevel === RiskLevel.CRITICAL) high.push(patient);
    });

    return {
      patientNameMap: names,
      upcomingAppointments: upcomingAppointmentsList,
      reviewNeeded: high,
    };
  }, [patientItems, appointments.data, riskResults]);

  if (patients.isLoading) return <Spinner />;

  return (
    <div className="space-y-6">
      <PageHeader title={t("doctor.dashboard.title")} subtitle={t("doctor.dashboard.subtitle")} />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={<Users className="w-5 h-5" />} label={t("doctor.dashboard.myPatients")} value={patientItems.length} color="blue" />
        <StatCard icon={<CalendarClock className="w-5 h-5" />} label={t("doctor.dashboard.upcomingAppointments")} value={upcomingAppointments.length} color="amber" />
        <StatCard icon={<HeartPulse className="w-5 h-5" />} label={t("doctor.dashboard.highRiskReview")} value={reviewNeeded.length} color="red" />
      </div>

      {patients.isError ? (
        <ErrorState message={patients.error?.message} onRetry={() => patients.refetch()} />
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title={t("doctor.dashboard.recentPatients")}>
          {patientItems.length === 0 ? (
            <EmptyState title={t("doctor.noPatients")} description={t("doctor.noPatientsDescription")} />
          ) : (
            <>
              <ul className="divide-y divide-rose-50/60">
                {patientItems.slice(0, 5).map((patient) => {
                  const riskLevel = riskResults[patientItems.indexOf(patient)]?.data?.riskLevel;
                  return (
                    <li key={patient.id}>
                      <Link to={`/doctor/patients/${patient.id}`} className="flex items-center gap-3 rounded-xl py-3 hover:bg-rose-50/60">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-50 font-semibold text-accent-700">{patient.name.charAt(0)}</div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-gray-900">{patient.name}</p>
                          <p className="truncate text-xs text-gray-500">{patient.phone ?? patient.email}</p>
                        </div>
                        <RiskBadge riskLevel={riskLevel} />
                        <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
              <Link to="/doctor/patients" className="mt-3 inline-block text-sm font-medium text-primary-700">{t("doctor.dashboard.viewAll")}</Link>
            </>
          )}
        </Card>

        <Card title={t("doctor.dashboard.reviewNeeded")}>
          {reviewNeeded.length === 0 ? (
            <EmptyState title={t("doctor.noReviewNeeded")} description={t("doctor.noReviewNeededDescription")} />
          ) : (
            <>
              <div className="space-y-3">
                {reviewNeeded.slice(0, 5).map((patient) => {
                  const result = riskResults[patientItems.indexOf(patient)];
                  const assessment = result?.data;
                  return (
                    <div key={patient.id} className="rounded-2xl border border-red-100 bg-red-50/40 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <Link to={`/doctor/patients/${patient.id}`} className="font-semibold text-gray-900 hover:text-primary-700">{patient.name}</Link>
                        <RiskBadge riskLevel={assessment?.riskLevel} />
                      </div>
                      {assessment && assessment.riskFactors.length > 0 ? (
                        <p className="mt-2 text-xs text-gray-600">{assessment.riskFactors.join(", ")}</p>
                      ) : null}
                    </div>
                  );
                })}
              </div>
              <Link to="/doctor/high-risk" className="mt-3 inline-block text-sm font-medium text-primary-700">{t("doctor.dashboard.viewAll")}</Link>
            </>
          )}
        </Card>
      </div>

      <Card title={t("doctor.dashboard.upcomingAppointments")}>
        {upcomingAppointments.length === 0 ? (
          <EmptyState title={t("doctor.noUpcomingAppointments")} description={t("doctor.noUpcomingAppointmentsDescription")} />
        ) : (
          <>
            <div className="space-y-3">
              {upcomingAppointments.slice(0, 6).map((appointment) => (
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
            <Link to="/doctor/appointments" className="mt-3 inline-block text-sm font-medium text-primary-700">{t("doctor.dashboard.viewAll")}</Link>
          </>
        )}
      </Card>
    </div>
  );
}