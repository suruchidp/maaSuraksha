import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Bell, CalendarClock, ChevronRight, MapPin, Phone, ShieldAlert, Stethoscope, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { RiskLevel } from "@maasuraksha/shared";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Field } from "@/components/ui/Field";
import { Textarea } from "@/components/ui/Textarea";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { StatCard } from "@/components/ui/StatCard";
import { Spinner } from "@/components/ui/Spinner";
import { HomeVisitStatusBadge } from "@/components/status/StatusLabels";
import { useAuthStore } from "@/stores/authStore";
import { useToastStore } from "@/stores/toastStore";
import { useCurrentLanguage } from "@/hooks/useAuth";
import { getApiErrorMessage } from "@/lib/api";
import { formatCalendarDate } from "@/lib/date";
import { appointmentToday } from "@maasuraksha/shared";
import type { HomeVisitActionInput } from "@/services/homeVisits";
import {
  usePatients,
  useAppointments,
  useAlerts,
  useReferrals,
  useLatestRiskByPatient,
  usePregnancyByPatient,
  useUpdateReferralStatus,
  useReadAlert,
  useHomeVisits,
  useScheduleHomeVisit,
  useCompleteHomeVisit,
  useCancelHomeVisit,
  useEscalateHomeVisit,
} from "@/hooks/queries";

function formatDate(date?: string) {
  if (!date) return "—";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function riskLevelOf(level?: RiskLevel) {
  if (level === RiskLevel.HIGH || level === RiskLevel.CRITICAL) return "High Risk";
  if (level === RiskLevel.MEDIUM) return "Moderate Risk";
  return "Low Risk";
}

function RiskBadge({ riskLevel }: { riskLevel?: RiskLevel }) {
  const high = riskLevel === RiskLevel.HIGH || riskLevel === RiskLevel.CRITICAL;
  const medium = riskLevel === RiskLevel.MEDIUM;
  const cls = high
    ? "bg-red-100 text-red-700 border-red-200"
    : medium
      ? "bg-amber-100 text-amber-700 border-amber-200"
      : "bg-emerald-100 text-emerald-700 border-emerald-200";
  return <span className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-semibold ${cls}`}>{riskLevelOf(riskLevel)}</span>;
}

function StatusBadge({ status }: { status: string }) {
  const cls = status === "confirmed"
    ? "bg-emerald-100 text-emerald-700"
    : status === "completed"
      ? "bg-gray-100 text-gray-600"
      : status === "cancelled" || status === "missed"
        ? "bg-red-100 text-red-700"
        : "bg-amber-100 text-amber-700";
  return <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${cls}`}>{status}</span>;
}

export function ASHAHighRiskPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const patients = usePatients("", 100);
  const patientItems = patients.data?.items ?? [];
  const riskResults = useLatestRiskByPatient(patientItems);

  const highRiskPatients = useMemo(
    () => patientItems.filter((patient, index) => {
      const level = riskResults[index]?.data?.riskLevel;
      return level === RiskLevel.HIGH || level === RiskLevel.CRITICAL;
    }),
    [patientItems, riskResults]
  );

  if (patients.isLoading) return <Spinner />;

  const query = search.trim().toLowerCase();
  const filtered = highRiskPatients.filter((patient) => !query || `${patient.name} ${patient.email}`.toLowerCase().includes(query));

  return (
    <div className="space-y-6">
      <PageHeader title={t("asha.dashboard.highRiskPregnancies") || "High-Risk Pregnancies"} subtitle="Patients requiring closer monitoring and referral follow-up." />
      <div className="max-w-md">
        <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search patient" aria-label="Search patient" />
      </div>
      {patients.isError ? (
        <ErrorState message={patients.error?.message} onRetry={() => patients.refetch()} />
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState title={t("asha.noHighRisk")} description={t("asha.noHighRiskDescription")} />
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((patient) => {
            const result = riskResults[patientItems.indexOf(patient)];
            const assessment = result?.data;
            return (
              <div key={patient.id} className="rounded-2xl border border-red-100 bg-red-50/40 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <Link to={`/asha/patients/${patient.id}`} className="font-semibold text-gray-900 hover:text-primary-700">{patient.name}</Link>
                    <p className="text-xs text-gray-500">{patient.phone ?? patient.email}</p>
                  </div>
                  <RiskBadge riskLevel={assessment?.riskLevel} />
                </div>
                {assessment && (
                  <div className="mt-3 grid gap-2 text-xs text-gray-600 sm:grid-cols-2">
                    <div className="sm:col-span-2"><span className="font-medium">Risk factors:</span> {assessment.riskFactors.join(", ") || "—"}</div>
                    <div className="sm:col-span-2"><span className="font-medium">Recommendations:</span> {assessment.recommendations.join(" · ") || "—"}</div>
                    <div><span className="font-medium">Assessed:</span> {formatDate(assessment.createdAt)}</div>
                    <div><span className="font-medium">Score:</span> {assessment.riskScore ?? "—"}</div>
                  </div>
                )}
                <div className="mt-3">
                  <Link to={`/asha/patients/${patient.id}`} className="text-sm font-medium text-primary-700">View Patient</Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

type VisitAction = "schedule" | "complete" | "cancel" | "escalate";

export function ASHAHomeVisitsPage() {
  const { t } = useTranslation();
  const lang = useCurrentLanguage();
  const push = useToastStore((s) => s.push);
  const [actionFor, setActionFor] = useState<{ visitId: string; action: VisitAction } | null>(null);

  const visits = useHomeVisits();
  const schedule = useScheduleHomeVisit();
  const complete = useCompleteHomeVisit();
  const cancel = useCancelHomeVisit();
  const escalate = useEscalateHomeVisit();
  const pendingMutation = [schedule, complete, cancel, escalate].find((m) => m.isPending);

  const [scheduledDate, setScheduledDate] = useState(appointmentToday());
  const [scheduledTime, setScheduledTime] = useState("10:00");
  const [visitNotes, setVisitNotes] = useState("");
  const [followUpNeeded, setFollowUpNeeded] = useState(false);
  const [reason, setReason] = useState("");
  const [formError, setFormError] = useState("");

  if (visits.isLoading) return <Spinner />;

  const openAction = (visitId: string, action: VisitAction) => {
    setScheduledDate(appointmentToday());
    setScheduledTime("10:00");
    setVisitNotes("");
    setFollowUpNeeded(false);
    setReason("");
    setFormError("");
    setActionFor({ visitId, action });
  };

  const closeAction = () => {
    if (pendingMutation) return;
    setActionFor(null);
    setFormError("");
  };

  const submitAction = () => {
    if (!actionFor || pendingMutation) return;
    const { visitId, action } = actionFor;

    const mutation =
      action === "schedule"
        ? schedule
        : action === "complete"
          ? complete
          : action === "cancel"
            ? cancel
            : escalate;

    const successKey =
      action === "schedule"
        ? "asha.homeVisits.scheduled"
        : action === "complete"
          ? "asha.homeVisits.completed"
          : action === "cancel"
            ? "asha.homeVisits.cancelled"
            : "asha.homeVisits.escalated";

    const payload: HomeVisitActionInput = { visitId };
    if (action === "schedule") {
      if (!scheduledDate || !scheduledTime) {
        setFormError(t("validation.required"));
        return;
      }
      payload.scheduledDate = scheduledDate;
      payload.scheduledTime = scheduledTime;
      if (visitNotes.trim()) payload.visitNotes = visitNotes.trim();
    } else if (action === "complete") {
      if (visitNotes.trim()) payload.visitNotes = visitNotes.trim();
      payload.followUpNeeded = followUpNeeded;
    } else {
      if (!reason.trim()) {
        setFormError(t("validation.required"));
        return;
      }
      if (action === "cancel") payload.cancelledReason = reason.trim();
      else payload.reason = reason.trim();
    }

    mutation.mutate(payload, {
      onSuccess: () => {
        push(t(successKey), "success");
        setActionFor(null);
        setFormError("");
      },
      onError: (error) => setFormError(getApiErrorMessage(error)),
    });
  };

  const items = visits.data?.items ?? [];

  const submitLabel =
    actionFor?.action === "schedule"
      ? t("asha.homeVisits.scheduleSubmit")
      : actionFor?.action === "complete"
        ? t("asha.homeVisits.completeSubmit")
        : actionFor?.action === "cancel"
          ? t("asha.homeVisits.cancelSubmit")
          : t("asha.homeVisits.escalateSubmit");

  return (
    <div className="space-y-6">
      <PageHeader title={t("asha.homeVisits.title")} subtitle={t("asha.homeVisits.subtitle")} />
      {visits.isError ? (
        <ErrorState message={visits.error?.message} onRetry={() => visits.refetch()} />
      ) : items.length === 0 ? (
        <Card>
          <EmptyState title={t("asha.homeVisits.none")} description={t("asha.homeVisits.noneDescription")} />
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((visit) => (
            <Card key={visit._id}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <Link to={`/asha/patients/${visit.patient}`} className="font-semibold text-gray-900 hover:text-primary-700">
                      {visit.patientName ?? visit.patient}
                    </Link>
                    <HomeVisitStatusBadge status={visit.status} />
                  </div>
                  <p className="mt-1 text-sm font-medium text-gray-700">{visit.reason}</p>
                  <p className="text-xs text-gray-500">
                    {t("homeVisits.date")}: {formatCalendarDate(visit.preferredDate, lang)} · {t("homeVisits.time")}: {visit.preferredTime} {t("homeVisits.indiaTime")}
                  </p>
                  {visit.notes && <p className="mt-0.5 text-xs text-gray-400">{visit.notes}</p>}
                  {visit.scheduledDate && visit.scheduledTime && (
                    <p className="mt-0.5 text-xs text-gray-500">
                      {t("asha.homeVisits.scheduledDate")}: {formatCalendarDate(visit.scheduledDate, lang)} · {visit.scheduledTime}
                    </p>
                  )}
                </div>
                {(visit.status === "pending" || visit.status === "scheduled") && (
                  <div className="flex flex-wrap gap-2">
                    {visit.status === "pending" && (
                      <Button variant="primary" size="sm" onClick={() => openAction(visit._id, "schedule")}>
                        {t("asha.homeVisits.schedule")}
                      </Button>
                    )}
                    {visit.status === "scheduled" && (
                      <Button variant="primary" size="sm" onClick={() => openAction(visit._id, "complete")}>
                        {t("asha.homeVisits.complete")}
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => openAction(visit._id, "cancel")}>
                      {t("asha.homeVisits.cancel")}
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => openAction(visit._id, "escalate")}>
                      {t("asha.homeVisits.escalate")}
                    </Button>
                  </div>
                )}
              </div>

              {actionFor?.visitId === visit._id && (
                <div className="mt-4 space-y-4 rounded-xl border border-rose-100 bg-rose-50/30 p-4">
                  {actionFor.action === "schedule" && (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label={t("asha.homeVisits.scheduledDate")} htmlFor="asha-schedule-date" required>
                        <Input id="asha-schedule-date" type="date" min={appointmentToday()} value={scheduledDate} onChange={(event) => setScheduledDate(event.target.value)} />
                      </Field>
                      <Field label={t("asha.homeVisits.scheduledTime")} htmlFor="asha-schedule-time" required>
                        <Input id="asha-schedule-time" type="time" value={scheduledTime} onChange={(event) => setScheduledTime(event.target.value)} />
                      </Field>
                    </div>
                  )}
                  {(actionFor.action === "schedule" || actionFor.action === "complete") && (
                    <Field label={t("asha.homeVisits.visitNotesOptional")} htmlFor="asha-visit-notes">
                      <Textarea id="asha-visit-notes" rows={2} maxLength={2000} value={visitNotes} onChange={(event) => setVisitNotes(event.target.value)} />
                    </Field>
                  )}
                  {actionFor.action === "complete" && (
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" checked={followUpNeeded} onChange={(event) => setFollowUpNeeded(event.target.checked)} />
                      {t("asha.homeVisits.followUpNeeded")}
                    </label>
                  )}
                  {(actionFor.action === "cancel" || actionFor.action === "escalate") && (
                    <Field
                      label={actionFor.action === "cancel" ? t("asha.homeVisits.cancelledReason") : t("asha.homeVisits.escalateReason")}
                      htmlFor="asha-action-reason"
                      required
                    >
                      <Textarea id="asha-action-reason" rows={3} maxLength={500} value={reason} onChange={(event) => setReason(event.target.value)} />
                    </Field>
                  )}
                  {formError && <p role="alert" className="text-sm text-red-700">{formError}</p>}
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={closeAction} disabled={!!pendingMutation}>
                      {t("asha.homeVisits.close")}
                    </Button>
                    <Button variant={actionFor.action === "escalate" ? "danger" : "primary"} size="sm" onClick={submitAction} loading={!!pendingMutation}>
                      {submitLabel}
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export function ASHAAppointmentsPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const patients = usePatients("", 100);
  const appointments = useAppointments();

  if (patients.isLoading) return <Spinner />;

  const patientNames = new Map(patients.data?.items?.map((p) => [p.id, p.name]) ?? []);
  const today = new Date().toISOString().slice(0, 10);
  const items = appointments.data?.items ?? [];
  const todayCount = items.filter((a) => a.date === today).length;
  const upcomingCount = items.filter((a) => a.date >= today && (a.status === "scheduled" || a.status === "confirmed")).length;
  const completedCount = items.filter((a) => a.status === "completed").length;
  const missedCount = items.filter((a) => a.status === "missed" || a.status === "cancelled").length;

  const query = search.trim().toLowerCase();
  const rows = items.filter((a) => {
    const name = patientNames.get(a.patient) ?? a.patient;
    return !query || `${name} ${a.type}`.toLowerCase().includes(query);
  });

  return (
    <div className="space-y-6">
      <PageHeader title={t("nav.appointments") || "ANC & Appointments"} subtitle="Upcoming, overdue and completed ANC follow-ups." />
      <div className="max-w-md">
        <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search patient" aria-label="Search patient" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Today" value={todayCount} color="amber" />
        <StatCard label="Upcoming" value={upcomingCount} color="blue" />
        <StatCard label="Completed" value={completedCount} color="green" />
        <StatCard label="Missed / Cancelled" value={missedCount} color="red" />
      </div>
      {appointments.isError ? (
        <ErrorState message={appointments.error?.message} onRetry={() => appointments.refetch()} />
      ) : rows.length === 0 ? (
        <Card>
          <EmptyState title={t("asha.noAppointments")} description={t("asha.noAppointmentsDescription")} />
        </Card>
      ) : (
        <div className="space-y-3">
          {rows.map((appointment) => (
            <div key={appointment.id} className="rounded-2xl border border-rose-100 bg-white p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <Link to={`/asha/patients/${appointment.patient}`} className="font-semibold text-gray-900 hover:text-primary-700">{patientNames.get(appointment.patient) ?? appointment.patient}</Link>
                  <p className="text-xs text-gray-500">{appointment.type} · {formatDate(appointment.date)} · {appointment.time}</p>
                </div>
                <StatusBadge status={appointment.status} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ASHADeliveryTrackerPage() {
  const { t } = useTranslation();
  const patients = usePatients("", 100);
  const patientItems = patients.data?.items ?? [];
  const pregnancyResults = usePregnancyByPatient(patientItems);

  if (patients.isLoading) return <Spinner />;

  const profiles = pregnancyResults.filter((r) => r.data).map((r) => r.data!);
  const names = new Map(patientItems.map((p) => [p.id, p.name]));

  return (
    <div className="space-y-6">
      <PageHeader title={t("asha.dashboard.expectedDeliveryTracker") || "Delivery Tracker"} subtitle="Expected deliveries from recorded pregnancy profiles." />
      {profiles.length === 0 ? (
        <Card>
          <EmptyState title={t("asha.noExpectedDeliveries")} description={t("asha.noExpectedDeliveriesDescription")} />
        </Card>
      ) : (
        <div className="grid gap-4 xl:grid-cols-3">
          {profiles.map((profile) => (
            <Card key={profile.id} title={names.get(profile.user) ?? profile.user}>
              <div className="space-y-2 text-sm text-gray-600">
                <p>EDD: {formatDate(profile.expectedDueDate)}</p>
                <p>Week: {profile.gestationalWeek}</p>
                <p>Trimester: {profile.trimester}</p>
                <p>Risk: {profile.isHighRisk ? "High Risk" : "Normal Risk"}</p>
                {profile.riskFactors.length > 0 && <p className="text-xs">Risk factors: {profile.riskFactors.join(", ")}</p>}
                <div className="flex flex-wrap gap-2 pt-2">
                  <Link to={`/asha/patients/${profile.user}`} className="rounded-xl border border-rose-100 px-3 py-2 text-xs font-medium text-gray-700">View Patient</Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export function ASHABirthPreparednessPage() {
  const { t } = useTranslation();
  const patients = usePatients("", 100);

  if (patients.isLoading) return <Spinner />;

  const items = patients.data?.items ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title={t("asha.dashboard.birthPreparedness") || "Birth Preparedness"} subtitle="Track readiness for delivery services and family planning." />
      <Card>
        <p className="text-sm text-gray-600">Birth-preparedness completion is not recorded yet. Use the patient record to review the pregnancy profile and expected delivery date.</p>
      </Card>
      {items.length === 0 ? (
        <Card>
          <EmptyState title={t("asha.noPatients")} description={t("asha.noPatientsDescription")} />
        </Card>
      ) : (
        <Card title={`Assigned patients (${items.length})`}>
          <div className="space-y-2">
            {items.map((patient) => (
              <Link key={patient.id} to={`/asha/patients/${patient.id}`} className="flex items-center justify-between rounded-xl border border-rose-100 bg-white p-3 hover:bg-rose-50/60">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-50 text-primary-700 font-semibold">{patient.name.charAt(0)}</span>
                  <div>
                    <p className="font-medium text-gray-900">{patient.name}</p>
                    <p className="text-xs text-gray-500">{patient.phone ?? patient.email}</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-300" />
              </Link>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

export function ASHAFollowUpsPage() {
  const { t } = useTranslation();
  const patients = usePatients("", 100);
  const appointments = useAppointments();
  const alerts = useAlerts();

  if (patients.isLoading) return <Spinner />;

  const names = new Map(patients.data?.items?.map((p) => [p.id, p.name]) ?? []);
  const today = new Date().toISOString().slice(0, 10);
  const followUps = (appointments.data?.items ?? []).filter((a) => a.date >= today && (a.status === "scheduled" || a.status === "confirmed"));
  const pendingAlerts = (alerts.data?.items ?? []).filter((a) => a.status === "pending");

  return (
    <div className="space-y-6">
      <PageHeader title={t("nav.followUps") || "Follow-ups"} subtitle="Scheduled follow-up visits and pending alerts for your assigned women." />
      <div className="grid gap-4 xl:grid-cols-2">
        <Card title={`${t("asha.dashboard.followUpsDue") || "Follow-ups Due"} (${followUps.length})`}>
          {followUps.length === 0 ? (
            <EmptyState title={t("asha.noFollowUpsDue")} description={t("asha.noFollowUpsDueDescription")} />
          ) : (
            <div className="space-y-3">
              {followUps.slice(0, 12).map((a) => (
                <div key={a.id} className="rounded-xl border border-rose-100 bg-white p-3">
                  <Link to={`/asha/patients/${a.patient}`} className="font-semibold text-gray-900 hover:text-primary-700">{names.get(a.patient) ?? a.patient}</Link>
                  <p className="text-xs text-gray-500">{a.type} · {formatDate(a.date)} · {a.time}</p>
                  <p className="mt-1"><StatusBadge status={a.status} /></p>
                </div>
              ))}
            </div>
          )}
        </Card>
        <Card title={`${t("asha.dashboard.needsFollowUp") || "Needs Follow-up"} (${pendingAlerts.length})`}>
          {pendingAlerts.length === 0 ? (
            <p className="text-sm text-gray-500">No pending alerts.</p>
          ) : (
            <div className="space-y-3">
              {pendingAlerts.slice(0, 12).map((alert) => (
                <div key={alert.id} className="flex items-start gap-3 rounded-xl border border-rose-100 bg-white p-3">
                  <AlertTriangle className="mt-0.5 h-4 w-4 text-red-600" />
                  <div>
                    <p className="font-medium text-gray-900">{alert.title}</p>
                    <p className="text-xs text-gray-500">{alert.message}</p>
                    <p className="mt-1 text-[10px] text-gray-400">{formatDate(alert.createdAt)}</p>
                    {alert.user && (
                      <Link to={`/asha/patients/${alert.user}`} className="mt-1 inline-block text-xs font-medium text-primary-700">View Patient</Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

export function ASHAReferralsPage() {
  const { t } = useTranslation();
  const referrals = useReferrals();
  const patients = usePatients("", 100);
  const updateReferralStatus = useUpdateReferralStatus();

  if (patients.isLoading) return <Spinner />;

  const names = new Map(patients.data?.items?.map((p) => [p.id, p.name]) ?? []);
  const items = referrals.data?.items ?? [];

  const followUp = (id: string) => {
    updateReferralStatus.mutate({ id, status: "completed", note: "Follow-up recorded by ASHA" });
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Referrals" subtitle="Track referrals and scheduled follow-up actions." />
      {referrals.isError ? (
        <ErrorState message={referrals.error?.message} onRetry={() => referrals.refetch()} />
      ) : items.length === 0 ? (
        <Card>
          <EmptyState title={t("asha.noReferrals")} description={t("asha.noReferralsDescription")} />
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((referral) => (
            <div key={referral.id} className="rounded-2xl border border-rose-100 bg-white p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <Link to={`/asha/patients/${referral.patient}`} className="font-semibold text-gray-900 hover:text-primary-700">{names.get(referral.patient) ?? referral.patient}</Link>
                  <p className="text-xs text-gray-500">{referral.facility ?? "Facility not specified"}</p>
                </div>
                <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-700">{referral.status}</span>
              </div>
              <div className="mt-3 grid gap-2 text-xs text-gray-600 sm:grid-cols-2">
                <span>Reason: {referral.reason}</span>
                <span>Referred by: {referral.referredBy}</span>
                <span>Created: {formatDate(referral.createdAt)}</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link to={`/asha/patients/${referral.patient}`} className="rounded-xl border border-rose-100 px-3 py-2 text-xs font-medium text-gray-700">View Patient</Link>
                {referral.status !== "completed" && (
                  <Button variant="primary" size="sm" onClick={() => followUp(referral.id)} disabled={updateReferralStatus.isPending}>Record Follow-up</Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ASHAFacilitiesPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Health Facilities" subtitle="Nearby facilities and referral points for field follow-up." />
      <div className="space-y-3">
        <Card title="Primary Health Centre (PHC)">
          <div className="space-y-3 text-sm text-gray-600">
            <p><MapPin className="mr-1 inline h-4 w-4" /> First point of care for ANC, immunisation and basic labour support.</p>
            <p>Use the patient record to confirm the planned facility and referral points.</p>
          </div>
        </Card>
        <Card title="Community Health Centre (CHC)">
          <div className="space-y-3 text-sm text-gray-600">
            <p><MapPin className="mr-1 inline h-4 w-4" /> Referral hub for higher-risk pregnancies and specialist consultation.</p>
          </div>
        </Card>
        <Card title="District Hospital">
          <div className="space-y-3 text-sm text-gray-600">
            <p><MapPin className="mr-1 inline h-4 w-4" /> Secondary care for delivery, surgery and emergency obstetric services.</p>
          </div>
        </Card>
      </div>
    </div>
  );
}

export function ASHANotificationsPage() {
  const alerts = useAlerts();
  const readAlert = useReadAlert();

  return (
    <div className="space-y-6">
      <PageHeader title="Notifications" subtitle="Service reminders and priority updates." />
      {alerts.isError ? (
        <ErrorState message={alerts.error?.message} onRetry={() => alerts.refetch()} />
      ) : (alerts.data?.items ?? []).length === 0 ? (
        <Card>
          <EmptyState title="No notifications" description="Notifications generated for your assigned patients will appear here." />
        </Card>
      ) : (
        <div className="space-y-3">
          {(alerts.data?.items ?? []).map((alert) => (
            <div key={alert.id} className="flex items-start gap-3 rounded-2xl border border-rose-100 bg-white p-4">
              <Bell className="mt-0.5 h-4 w-4 text-primary-600" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-gray-900">{alert.title}</p>
                <p className="text-xs text-gray-600">{alert.message}</p>
                <p className="mt-1 text-[10px] text-gray-400">{formatDate(alert.createdAt)} · {alert.status} · {alert.severity}</p>
              </div>
              {!alert.readAt && (
                <Button variant="ghost" size="sm" onClick={() => readAlert.mutate(alert.id)}>Mark read</Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ASHAReportsPage() {
  const patients = usePatients("", 100);
  const appointments = useAppointments();
  const alerts = useAlerts();
  const referrals = useReferrals();
  const patientItems = patients.data?.items ?? [];
  const riskResults = useLatestRiskByPatient(patientItems);
  const pregnancyResults = usePregnancyByPatient(patientItems);

  if (patients.isLoading) return <Spinner />;

  const highRisk = patientItems.filter((p, index) => {
    const level = riskResults[index]?.data?.riskLevel;
    return level === RiskLevel.HIGH || level === RiskLevel.CRITICAL;
  }).length;
  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const stats = [
    { label: "Total assigned women", value: patientItems.length },
    { label: "High-risk pregnancies", value: highRisk },
    { label: "Appointments today", value: (appointments.data?.items ?? []).filter((a) => a.date === today).length },
    { label: "Upcoming appointments", value: (appointments.data?.items ?? []).filter((a) => a.date >= today && (a.status === "scheduled" || a.status === "confirmed")).length },
    { label: "Pending follow-ups", value: (alerts.data?.items ?? []).filter((a) => a.status === "pending").length },
    { label: "Referrals", value: referrals.data?.total ?? (referrals.data?.items ?? []).length },
    { label: "Expected deliveries", value: pregnancyResults.filter((r) => r.data).length },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Reports" subtitle="Summary of outreach and maternal care coverage." />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <StatCard key={item.label} label={item.label} value={item.value} />
        ))}
      </div>
    </div>
  );
}

export function ASHAEducationPage() {
  const { t } = useTranslation();
  const resources = [
    { title: "ANC awareness", detail: "Counselling on regular check-ups, danger signs and care planning." },
    { title: "Nutrition during pregnancy", detail: "Balanced diet and supplementation guidance for pregnant women." },
    { title: "Birth preparedness", detail: "Transport, facility selection and family preparation for delivery." },
    { title: "Referral guidance", detail: "When and how to refer a patient for urgent follow-up." },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title={t("nav.education") || "Health Education"} subtitle="Maternal health education resources for ASHA field work." />
      <div className="space-y-3">
        {resources.map((resource) => (
          <Card key={resource.title} title={resource.title}>
            <p className="text-sm text-gray-600">{resource.detail}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function ASHAProfilePage() {
  const { user } = useAuthStore();
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <PageHeader title={t("nav.profile") || "Profile / Settings"} subtitle="ASHA worker profile and assigned support details." />
      <Card title="Profile">
        <div className="grid gap-3 md:grid-cols-2 text-sm text-gray-700">
          <div className="rounded-xl border border-rose-100 bg-rose-50/40 p-3"><p className="text-xs text-gray-500">Name</p><p className="mt-1 font-semibold text-gray-900">{user?.name ?? "ASHA Worker"}</p></div>
          <div className="rounded-xl border border-rose-100 bg-rose-50/40 p-3"><p className="text-xs text-gray-500">Email</p><p className="mt-1 font-semibold text-gray-900">{user?.email ?? "N/A"}</p></div>
          <div className="rounded-xl border border-rose-100 bg-rose-50/40 p-3"><p className="text-xs text-gray-500">Role</p><p className="mt-1 font-semibold text-gray-900">{user?.role ?? "ASHA"}</p></div>
          <div className="rounded-xl border border-rose-100 bg-rose-50/40 p-3"><p className="text-xs text-gray-500">Language</p><p className="mt-1 font-semibold text-gray-900">{user?.language ?? "en"}</p></div>
        </div>
      </Card>
    </div>
  );
}

export function ASHAAlertsPage() {
  const alerts = useAlerts();

  return (
    <div className="space-y-6">
      <PageHeader title="Alerts" subtitle="Priority follow-ups and outreach reminders." />
      {alerts.isError ? (
        <ErrorState message={alerts.error?.message} onRetry={() => alerts.refetch()} />
      ) : (alerts.data?.items ?? []).length === 0 ? (
        <Card>
          <EmptyState title="No alerts" description="Alerts generated for your assigned patients will appear here." />
        </Card>
      ) : (
        <div className="space-y-3">
          {(alerts.data?.items ?? []).map((alert) => (
            <div key={alert.id} className="flex items-start gap-3 rounded-2xl border border-rose-100 bg-white p-4">
              <AlertTriangle className="mt-0.5 h-4 w-4 text-red-600" />
              <div>
                <p className="font-semibold text-gray-900">{alert.title}</p>
                <p className="text-xs text-gray-600">{alert.message}</p>
                <p className="mt-1 text-[10px] text-gray-400">{formatDate(alert.createdAt)} · {alert.severity}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}