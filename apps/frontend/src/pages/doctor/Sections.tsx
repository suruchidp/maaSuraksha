import { useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Bell } from "lucide-react";
import { RiskLevel } from "@maasuraksha/shared";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/stores/authStore";
import {
  usePatients,
  useAppointments,
  useAlerts,
  useReferrals,
  useLatestRiskByPatient,
  usePregnancy,
  usePregnancyByPatient,
  useHealthMetrics,
  useHealthRecords,
  useMaternalRiskHistory,
  useGDMHistory,
  usePPDHistory,
  useRecommendations,
  useMarkRecommendationRead,
  useUpdateReferralStatus,
  useReadAlert,
} from "@/hooks/queries";
import type { UserDTO } from "@/lib/types";

function formatDate(date?: string) {
  if (!date) return "—";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function RiskBadge({ riskLevel }: { riskLevel?: RiskLevel }) {
  const high = riskLevel === RiskLevel.HIGH || riskLevel === RiskLevel.CRITICAL;
  const medium = riskLevel === RiskLevel.MEDIUM;
  const cls = high
    ? "bg-red-100 text-red-700 border-red-200"
    : medium
      ? "bg-amber-100 text-amber-700 border-amber-200"
      : "bg-emerald-100 text-emerald-700 border-emerald-200";
  const label = high ? "High Risk" : medium ? "Moderate Risk" : "Low Risk";
  return <span className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-semibold ${cls}`}>{label}</span>;
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

function PatientPicker({ patients, value, onChange, label = "Patient" }: { patients: UserDTO[]; value: string; onChange: (id: string) => void; label?: string }) {
  return (
    <label className="block max-w-md">
      <span className="mb-1 block text-xs font-medium text-gray-500">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-300"
      >
        {patients.map((patient) => (
          <option key={patient.id} value={patient.id}>{patient.name}</option>
        ))}
      </select>
    </label>
  );
}

/* ---------- Appointments ---------- */
export function DoctorAppointmentsPage() {
  const [search, setSearch] = useState("");
  const patients = usePatients("", 100);
  const appointments = useAppointments();

  if (patients.isLoading) return <Spinner />;

  const names = new Map(patients.data?.items?.map((p) => [p.id, p.name]) ?? []);
  const today = new Date().toISOString().slice(0, 10);
  const items = appointments.data?.items ?? [];
  const filtered = items.filter((a) => {
    const name = names.get(a.patient) ?? a.patient;
    return !search.trim() || `${name} ${a.type}`.toLowerCase().includes(search.trim().toLowerCase());
  });
  const todayAppts = filtered.filter((a) => a.date === today);
  const upcomingAppts = filtered.filter((a) => a.date > today && (a.status === "scheduled" || a.status === "confirmed"));
  const completedAppts = filtered.filter((a) => a.status === "completed");

  return (
    <div className="space-y-6">
      <PageHeader title="Appointments" subtitle="Upcoming consults, assessments and follow-ups." />
      <div className="max-w-md">
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search patient" aria-label="Search patient" />
      </div>
      {appointments.isError ? (
        <ErrorState message={appointments.error?.message} onRetry={() => appointments.refetch()} />
      ) : filtered.length === 0 ? (
        <Card><EmptyState title="No appointments" description="Appointments for your patients will appear here." /></Card>
      ) : (
        <div className="grid gap-4 xl:grid-cols-3">
          <Card title={`Today (${todayAppts.length})`}>
            <div className="space-y-3">
              {todayAppts.length === 0 && <p className="text-sm text-gray-500">No appointments today.</p>}
              {todayAppts.map((a) => (
                <div key={a.id} className="rounded-xl border border-rose-100 bg-white p-3">
                  <Link to={`/doctor/patients/${a.patient}`} className="font-semibold text-gray-900 hover:text-primary-700">{names.get(a.patient) ?? a.patient}</Link>
                  <p className="text-xs text-gray-500">{a.type} · {a.time}</p>
                  <p className="mt-1"><StatusBadge status={a.status} /></p>
                </div>
              ))}
            </div>
          </Card>
          <Card title={`Upcoming (${upcomingAppts.length})`}>
            <div className="space-y-3">
              {upcomingAppts.length === 0 && <p className="text-sm text-gray-500">No upcoming appointments.</p>}
              {upcomingAppts.map((a) => (
                <div key={a.id} className="rounded-xl border border-rose-100 bg-white p-3">
                  <Link to={`/doctor/patients/${a.patient}`} className="font-semibold text-gray-900 hover:text-primary-700">{names.get(a.patient) ?? a.patient}</Link>
                  <p className="text-xs text-gray-500">{a.type} · {formatDate(a.date)} · {a.time}</p>
                  <p className="mt-1"><StatusBadge status={a.status} /></p>
                </div>
              ))}
            </div>
          </Card>
          <Card title={`Completed (${completedAppts.length})`}>
            <div className="space-y-3">
              {completedAppts.length === 0 && <p className="text-sm text-gray-500">No completed appointments.</p>}
              {completedAppts.map((a) => (
                <div key={a.id} className="rounded-xl border border-rose-100 bg-white p-3">
                  <Link to={`/doctor/patients/${a.patient}`} className="font-semibold text-gray-900 hover:text-primary-700">{names.get(a.patient) ?? a.patient}</Link>
                  <p className="text-xs text-gray-500">{a.type} · {formatDate(a.date)}</p>
                  <p className="mt-1"><StatusBadge status={a.status} /></p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

/* ---------- High risk ---------- */
export function DoctorHighRiskPage() {
  const [search, setSearch] = useState("");
  const patients = usePatients("", 100);
  const patientItems = patients.data?.items ?? [];
  const riskResults = useLatestRiskByPatient(patientItems);

  if (patients.isLoading) return <Spinner />;

  const highRisk = patientItems.filter((p, index) => {
    const level = riskResults[index]?.data?.riskLevel;
    return level === RiskLevel.HIGH || level === RiskLevel.CRITICAL;
  });
  const query = search.trim().toLowerCase();
  const rows = highRisk.filter((p) => !query || `${p.name} ${p.email}`.toLowerCase().includes(query));

  return (
    <div className="space-y-6">
      <PageHeader title="High-Risk Patients" subtitle="Patients whose latest maternal risk assessment is high or critical." />
      <div className="max-w-md">
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search patient" aria-label="Search patient" />
      </div>
      {rows.length === 0 ? (
        <Card><EmptyState title="No high-risk patients" description="Patients with a high or critical maternal risk assessment will appear here." /></Card>
      ) : (
        <div className="space-y-3">
          {rows.map((patient) => {
            const result = riskResults[patientItems.indexOf(patient)];
            const assessment = result?.data;
            return (
              <div key={patient.id} className="rounded-2xl border border-red-100 bg-red-50/40 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <Link to={`/doctor/patients/${patient.id}`} className="font-semibold text-gray-900 hover:text-primary-700">{patient.name}</Link>
                    <p className="text-xs text-gray-500">{patient.phone ?? patient.email}</p>
                  </div>
                  <RiskBadge riskLevel={assessment?.riskLevel} />
                </div>
                {assessment && (
                  <div className="mt-3 grid gap-2 text-xs text-gray-600 sm:grid-cols-2">
                    <div className="sm:col-span-2"><span className="font-medium">Risk factors:</span> {assessment.riskFactors.join(", ") || "—"}</div>
                    <div className="sm:col-span-2"><span className="font-medium">Recommendations:</span> {assessment.recommendations.join(" · ") || "—"}</div>
                    <div><span className="font-medium">Score:</span> {assessment.riskScore ?? "—"}</div>
                    <div><span className="font-medium">Assessed:</span> {formatDate(assessment.createdAt)}</div>
                  </div>
                )}
                <div className="mt-3">
                  <Link to={`/doctor/patients/${patient.id}`} className="text-sm font-medium text-primary-700">Review Patient</Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ---------- Assessments ---------- */
export function DoctorAssessmentsPage() {
  const patients = usePatients("", 100);
  const patientItems = patients.data?.items ?? [];
  const [selectedId, setSelectedId] = useState("");
  const [tab, setTab] = useState<"maternal" | "gdm" | "ppd">("maternal");
  const selected = selectedId || patientItems[0]?.id;

  const maternal = useMaternalRiskHistory(selected);
  const gdm = useGDMHistory(selected);
  const ppd = usePPDHistory(selected);

  if (patients.isLoading) return <Spinner />;

  const tabData = tab === "maternal" ? maternal.data?.items ?? [] : tab === "gdm" ? gdm.data?.items ?? [] : ppd.data?.items ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Assessments" subtitle="Maternal, GDM and PPD risk assessment history for the selected patient." />
      {patientItems.length === 0 ? (
        <Card><EmptyState title="No patients assigned" description="Patients assigned to you will appear here." /></Card>
      ) : (
        <>
          <PatientPicker patients={patientItems} value={selected} onChange={setSelectedId} />
          <div className="flex flex-wrap gap-2">
            {(["maternal", "gdm", "ppd"] as const).map((t) => (
              <button key={t} type="button" onClick={() => setTab(t)} className={`rounded-xl px-3 py-2 text-xs font-medium ${tab === t ? "bg-primary-600 text-white" : "border border-gray-200 bg-white text-gray-600"}`}>
                {t === "maternal" ? "Maternal" : t === "gdm" ? "GDM" : "PPD"}
              </button>
            ))}
          </div>
          {tabData.length === 0 ? (
            <Card><EmptyState title="No assessments recorded" description="Assessment history for this patient will appear here once assessments are run." /></Card>
          ) : (
            <div className="space-y-3">
              {tabData.map((item) => {
                const assessment = item as { id: string; riskLevel?: string; riskScore?: number; severity?: string; edinburghScore?: number; modelConfidence?: number; riskFactors?: string[]; recommendations?: string[]; createdAt: string; message?: string };
                const isPPD = "severity" in assessment;
                const levelLabel = assessment.severity ?? assessment.riskLevel ?? "pending";
                return (
                  <Card key={assessment.id} title={`${formatDate(assessment.createdAt)} · ${levelLabel}`}>
                    <div className="space-y-2 text-sm text-gray-600">
                      {isPPD ? (
                        <>
                          {typeof assessment.edinburghScore === "number" && <p><span className="font-medium">EPDS score:</span> {assessment.edinburghScore}/30</p>}
                          {typeof assessment.modelConfidence === "number" && <p><span className="font-medium">Model confidence:</span> {assessment.modelConfidence}</p>}
                        </>
                      ) : (
                        <p><span className="font-medium">Score:</span> {assessment.riskScore ?? "—"}</p>
                      )}
                      {assessment.riskFactors && assessment.riskFactors.length > 0 && <p><span className="font-medium">Risk factors:</span> {assessment.riskFactors.join(", ")}</p>}
                      {assessment.recommendations && assessment.recommendations.length > 0 && <p><span className="font-medium">Recommendations:</span> {assessment.recommendations.join(" · ")}</p>}
                      {assessment.message && <p className="text-xs text-gray-400">{assessment.message}</p>}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ---------- Vitals ---------- */
export function DoctorVitalsPage() {
  const patients = usePatients("", 100);
  const patientItems = patients.data?.items ?? [];
  const [selectedId, setSelectedId] = useState("");
  const selected = selectedId || patientItems[0]?.id;
  const metrics = useHealthMetrics(selected, 20);

  if (patients.isLoading) return <Spinner />;

  const items = [...(metrics.data?.items ?? [])].sort((a, b) => a.date.localeCompare(b.date));
  const latest = items[items.length - 1];
  const vitals = latest
    ? [
        { label: "Blood Pressure", value: latest.systolicBP != null && latest.diastolicBP != null ? `${latest.systolicBP}/${latest.diastolicBP} mmHg` : "—" },
        { label: "Weight", value: latest.weight != null ? `${latest.weight} kg` : "—" },
        { label: "Glucose", value: latest.glucose != null ? `${latest.glucose} mg/dL` : "—" },
        { label: "Heart Rate", value: latest.heartRate != null ? `${latest.heartRate} bpm` : "—" },
        { label: "Temperature", value: latest.temperature != null ? `${latest.temperature} °C` : "—" },
        { label: "Hemoglobin", value: latest.hemoglobin != null ? `${latest.hemoglobin} g/dL` : "—" },
      ]
    : [];

  return (
    <div className="space-y-6">
      <PageHeader title="Vitals" subtitle="Latest recorded health metrics for the selected patient." />
      {patientItems.length === 0 ? (
        <Card><EmptyState title="No patients assigned" description="Patients assigned to you will appear here." /></Card>
      ) : (
        <>
          <PatientPicker patients={patientItems} value={selected} onChange={setSelectedId} />
          {metrics.isError ? (
            <ErrorState message={metrics.error?.message} onRetry={() => metrics.refetch()} />
          ) : vitals.length === 0 ? (
            <Card><EmptyState title="No vitals recorded" description="Health metrics recorded for this patient will appear here." /></Card>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {vitals.map((v) => (
                  <Card key={v.label} title={v.label}>
                    <p className="text-xl font-semibold text-gray-900">{v.value}</p>
                  </Card>
                ))}
              </div>
              <Card title="Recent Readings">
                <div className="space-y-2">
                  {items.slice(-8).reverse().map((m) => (
                    <div key={m.id} className="flex items-center justify-between rounded-xl border border-rose-100 bg-white p-3 text-sm">
                      <span className="text-gray-600">{formatDate(m.date)}</span>
                      <span className="text-gray-800">
                        {m.systolicBP != null && m.diastolicBP != null ? `${m.systolicBP}/${m.diastolicBP} BP · ` : ""}
                        {m.weight != null ? `${m.weight} kg · ` : ""}
                        {m.glucose != null ? `${m.glucose} mg/dL` : ""}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            </>
          )}
        </>
      )}
    </div>
  );
}

/* ---------- Investigations ---------- */
export function DoctorInvestigationsPage() {
  const patients = usePatients("", 100);
  const patientItems = patients.data?.items ?? [];
  const [selectedId, setSelectedId] = useState("");
  const selected = selectedId || patientItems[0]?.id;
  const records = useHealthRecords(selected, 50);

  if (patients.isLoading) return <Spinner />;

  const items = records.data?.items ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Investigations & Records" subtitle="Lab results, ultrasounds, prescriptions and discharge records." />
      {patientItems.length === 0 ? (
        <Card><EmptyState title="No patients assigned" description="Patients assigned to you will appear here." /></Card>
      ) : (
        <>
          <PatientPicker patients={patientItems} value={selected} onChange={setSelectedId} />
          {records.isError ? (
            <ErrorState message={records.error?.message} onRetry={() => records.refetch()} />
          ) : items.length === 0 ? (
            <Card><EmptyState title="No records available" description="Health records uploaded for this patient will appear here." /></Card>
          ) : (
            <div className="space-y-3">
              {items.map((record) => (
                <Card key={record.id} title={`${record.category} · ${record.title}`}>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p><span className="font-medium">Date:</span> {formatDate(record.date)}</p>
                    {record.provider && <p><span className="font-medium">Provider:</span> {record.provider}</p>}
                    <p className="whitespace-pre-wrap">{record.details}</p>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ---------- Care Plans ---------- */
export function DoctorCarePlansPage() {
  const patients = usePatients("", 100);
  const patientItems = patients.data?.items ?? [];
  const [selectedId, setSelectedId] = useState("");
  const selected = selectedId || patientItems[0]?.id;
  const recommendations = useRecommendations(selected);
  const markRead = useMarkRecommendationRead();

  if (patients.isLoading) return <Spinner />;

  const items = recommendations.data?.items ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Care Plans & Recommendations" subtitle="Personalised recommendations created for the selected patient." />
      {patientItems.length === 0 ? (
        <Card><EmptyState title="No patients assigned" description="Patients assigned to you will appear here." /></Card>
      ) : (
        <>
          <PatientPicker patients={patientItems} value={selected} onChange={setSelectedId} />
          {recommendations.isError ? (
            <ErrorState message={recommendations.error?.message} onRetry={() => recommendations.refetch()} />
          ) : items.length === 0 ? (
            <Card><EmptyState title="No care recommendations" description="Recommendations generated for this patient will appear here." /></Card>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <Card key={item.id} title={item.title}>
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border px-2 py-1 text-[10px] font-semibold text-gray-700">{item.priority}</span>
                      <span className="rounded-full border px-2 py-1 text-[10px] font-semibold text-gray-700">{item.category}</span>
                    </div>
                    <p className="text-sm text-gray-600">{item.content}</p>
                    <p className="text-[10px] text-gray-400">{formatDate(item.createdAt)}{item.isRead ? " · read" : ""}</p>
                    <Button variant="ghost" size="sm" onClick={() => markRead.mutate({ id: item.id, read: true })} disabled={markRead.isPending || item.isRead}>Mark as read</Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ---------- Referrals ---------- */
export function DoctorReferralsPage() {
  const referrals = useReferrals();
  const patients = usePatients("", 100);
  const updateReferralStatus = useUpdateReferralStatus();

  if (patients.isLoading) return <Spinner />;

  const names = new Map(patients.data?.items?.map((p) => [p.id, p.name]) ?? []);
  const items = referrals.data?.items ?? [];

  const act = (id: string, status: "accepted" | "completed") => {
    updateReferralStatus.mutate({ id, status, note: `Referral ${status} by doctor` });
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Referrals" subtitle="Manage referral requests and follow their status." />
      {referrals.isError ? (
        <ErrorState message={referrals.error?.message} onRetry={() => referrals.refetch()} />
      ) : items.length === 0 ? (
        <Card><EmptyState title="No referrals" description="Referrals made for your patients will appear here." /></Card>
      ) : (
        <div className="space-y-3">
          {items.map((referral) => (
            <div key={referral.id} className="rounded-2xl border border-rose-100 bg-white p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <Link to={`/doctor/patients/${referral.patient}`} className="font-semibold text-gray-900 hover:text-primary-700">{names.get(referral.patient) ?? referral.patient}</Link>
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
                <Link to={`/doctor/patients/${referral.patient}`} className="rounded-xl border border-rose-100 px-3 py-2 text-xs font-medium text-gray-700">View Patient</Link>
                {referral.status === "pending" && (
                  <Button variant="primary" size="sm" onClick={() => act(referral.id, "accepted")} disabled={updateReferralStatus.isPending}>Accept</Button>
                )}
                {referral.status !== "completed" && (
                  <Button variant="ghost" size="sm" onClick={() => act(referral.id, "completed")} disabled={updateReferralStatus.isPending}>Mark Completed</Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- ASHA coordination ---------- */
export function DoctorASHACoordinationPage() {
  const patients = usePatients("", 100);
  const appointments = useAppointments();

  if (patients.isLoading) return <Spinner />;

  const names = new Map(patients.data?.items?.map((p) => [p.id, p.name]) ?? []);
  const items = (appointments.data?.items ?? []).filter((a) => a.ashaName || a.asha);

  return (
    <div className="space-y-6">
      <PageHeader title="ASHA Coordination" subtitle="Appointments and follow-ups linked to an assigned ASHA worker." />
      {items.length === 0 ? (
        <Card><EmptyState title="No ASHA coordination yet" description="Appointments linked to ASHA workers for your patients will appear here." /></Card>
      ) : (
        <div className="space-y-3">
          {items.map((a) => (
            <div key={a.id} className="rounded-2xl border border-rose-100 bg-white p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <Link to={`/doctor/patients/${a.patient}`} className="font-semibold text-gray-900 hover:text-primary-700">{names.get(a.patient) ?? a.patient}</Link>
                  <p className="text-xs text-gray-500">{a.type} · {formatDate(a.date)} · {a.time}</p>
                </div>
                <StatusBadge status={a.status} />
              </div>
              <p className="mt-3 text-xs text-gray-600">ASHA: {a.ashaName ?? "Assigned ASHA worker"}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- Delivery ---------- */
export function DoctorDeliveryPage() {
  const patients = usePatients("", 100);
  const patientItems = patients.data?.items ?? [];
  const [selectedId, setSelectedId] = useState("");
  const selected = selectedId || patientItems[0]?.id;
  const pregnancy = usePregnancy(selected);

  if (patients.isLoading) return <Spinner />;

  const profile = pregnancy.data;

  return (
    <div className="space-y-6">
      <PageHeader title="Delivery Planning" subtitle="Pregnancy profile and expected delivery details." />
      {patientItems.length === 0 ? (
        <Card><EmptyState title="No patients assigned" description="Patients assigned to you will appear here." /></Card>
      ) : (
        <>
          <PatientPicker patients={patientItems} value={selected} onChange={setSelectedId} />
          {pregnancy.isError && !pregnancy.data ? (
            <Card><EmptyState title="No pregnancy profile yet" description="Once a pregnancy profile is recorded, the expected delivery details will appear here." /></Card>
          ) : profile ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <Card title="Expected Due Date"><p className="text-xl font-semibold text-gray-900">{formatDate(profile.expectedDueDate)}</p></Card>
              <Card title="Gestational Week"><p className="text-xl font-semibold text-gray-900">{profile.gestationalWeek}</p></Card>
              <Card title="Trimester"><p className="text-xl font-semibold text-gray-900">{profile.trimester}</p></Card>
              <Card title="Risk"><RiskBadge riskLevel={profile.isHighRisk ? RiskLevel.HIGH : RiskLevel.LOW} /></Card>
              <Card title="Status"><p className="text-xl font-semibold text-gray-900">{profile.status ?? "active"}</p></Card>
              <Card title="Days to Due"><p className="text-xl font-semibold text-gray-900">{profile.daysToDue ?? "—"}</p></Card>
            </div>
          ) : null}
          {profile && profile.riskFactors.length > 0 && (
            <Card title="Risk Factors">
              <ul className="list-inside list-disc text-sm text-gray-600">{profile.riskFactors.map((f) => <li key={f}>{f}</li>)}</ul>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

/* ---------- Follow-ups ---------- */
export function DoctorFollowUpsPage() {
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
      <PageHeader title="Follow-ups" subtitle="Scheduled follow-up duties and pending alerts." />
      <div className="grid gap-4 xl:grid-cols-2">
        <Card title={`Scheduled Follow-ups (${followUps.length})`}>
          {followUps.length === 0 ? (
            <p className="text-sm text-gray-500">No upcoming follow-ups.</p>
          ) : (
            <div className="space-y-3">
              {followUps.slice(0, 12).map((a) => (
                <div key={a.id} className="rounded-xl border border-rose-100 bg-white p-3">
                  <Link to={`/doctor/patients/${a.patient}`} className="font-semibold text-gray-900 hover:text-primary-700">{names.get(a.patient) ?? a.patient}</Link>
                  <p className="text-xs text-gray-500">{a.type} · {formatDate(a.date)} · {a.time}</p>
                  <p className="mt-1"><StatusBadge status={a.status} /></p>
                </div>
              ))}
            </div>
          )}
        </Card>
        <Card title={`Pending Alerts (${pendingAlerts.length})`}>
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

/* ---------- Notifications ---------- */
export function DoctorNotificationsPage() {
  const alerts = useAlerts();
  const readAlert = useReadAlert();

  return (
    <div className="space-y-6">
      <PageHeader title="Notifications" subtitle="Service reminders and priority updates." />
      {alerts.isError ? (
        <ErrorState message={alerts.error?.message} onRetry={() => alerts.refetch()} />
      ) : (alerts.data?.items ?? []).length === 0 ? (
        <Card><EmptyState title="No notifications" description="Notifications generated for your patients will appear here." /></Card>
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
              {!alert.readAt && <Button variant="ghost" size="sm" onClick={() => readAlert.mutate(alert.id)}>Mark read</Button>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- Education ---------- */
export function DoctorEducationPage() {
  const resources = [
    { title: "Maternal risk assessment", detail: "Understand the maternal risk model, SHAP explanations and when to escalate care." },
    { title: "GDM screening", detail: "Interpret fasting, postprandial glucose and HbA1c for gestational diabetes follow-up." },
    { title: "PPD screening", detail: "Use Edinburgh scoring and NLP screening text for post-partum depression care." },
    { title: "Referral best practice", detail: "When and how to refer patients to higher facilities for safe delivery." },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Care Education" subtitle="Clinical guidance for maternal health practice." />
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

/* ---------- Reports ---------- */
export function DoctorReportsPage() {
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
  const stats = [
    { label: "Total assigned patients", value: patientItems.length },
    { label: "High-risk patients", value: highRisk },
    { label: "Appointments today", value: (appointments.data?.items ?? []).filter((a) => a.date === today).length },
    { label: "Pending alerts", value: (alerts.data?.items ?? []).filter((a) => a.status === "pending").length },
    { label: "Referrals", value: referrals.data?.total ?? (referrals.data?.items ?? []).length },
    { label: "Pregnancy profiles", value: pregnancyResults.filter((r) => r.data).length },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Reports" subtitle="Summary of caseload and care activity." />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {stats.map((item) => (
          <StatCard key={item.label} label={item.label} value={item.value} />
        ))}
      </div>
    </div>
  );
}

/* ---------- Profile ---------- */
export function DoctorProfilePage() {
  const { user } = useAuthStore();
  return (
    <div className="space-y-6">
      <PageHeader title="Profile / Settings" subtitle="Doctor profile and care team details." />
      <Card title="Profile">
        <div className="grid gap-3 md:grid-cols-2 text-sm text-gray-700">
          <div className="rounded-xl border border-rose-100 bg-rose-50/40 p-3"><p className="text-xs text-gray-500">Name</p><p className="mt-1 font-semibold text-gray-900">{user?.name ?? "Doctor"}</p></div>
          <div className="rounded-xl border border-rose-100 bg-rose-50/40 p-3"><p className="text-xs text-gray-500">Email</p><p className="mt-1 font-semibold text-gray-900">{user?.email ?? "N/A"}</p></div>
          <div className="rounded-xl border border-rose-100 bg-rose-50/40 p-3"><p className="text-xs text-gray-500">Role</p><p className="mt-1 font-semibold text-gray-900">{user?.role ?? "DOCTOR"}</p></div>
          <div className="rounded-xl border border-rose-100 bg-rose-50/40 p-3"><p className="text-xs text-gray-500">Language</p><p className="mt-1 font-semibold text-gray-900">{user?.language ?? "en"}</p></div>
        </div>
      </Card>
    </div>
  );
}