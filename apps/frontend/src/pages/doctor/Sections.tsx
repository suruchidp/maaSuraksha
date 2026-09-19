import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  Bell,
  BookOpen,
  Calendar,
  ChevronRight,
  Clock3,
  FileBarChart,
  FileText,
  Heart,
  HeartPulse,
  MapPin,
  Search,
  Shield,
  Stethoscope,
  UserCog,
  Users,
} from "lucide-react";
import { Language, UserRole } from "@maasuraksha/shared";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Input } from "@/components/ui/Input";
import { usePatients } from "@/hooks/queries";
import { useAuthStore } from "@/stores/authStore";
import type { UserDTO } from "@/lib/types";

export const TEST_PATIENT: UserDTO = {
  id: "TEST-001",
  name: "Rose",
  email: "rose.test@example.com",
  role: UserRole.PATIENT,
  phone: "+91 90000 00001",
  language: Language.EN,
  isActive: true,
  createdAt: "2026-09-01T00:00:00.000Z",
  updatedAt: "2026-09-19T00:00:00.000Z",
};

const getDoctorPatients = (items: UserDTO[] = []) => {
  const map = new Map<string, UserDTO>();
  items.forEach((patient) => map.set(patient.id, patient));
  map.set(TEST_PATIENT.id, TEST_PATIENT);
  return [...map.values()];
};

const patientRecords = [
  {
    ...TEST_PATIENT,
    age: 25,
    village: "Bhojpur",
    pregnancyWeek: 28,
    expectedDeliveryDate: "2026-11-12",
    riskStatus: "High Risk",
    lastVisit: "2026-09-18",
    nextAppointment: "2026-09-22",
    gestationalAge: "28 weeks",
    ancHistory: "3 ANC visits completed",
    plan: "Repeat BP monitoring and nutrition counselling",
    riskFactors: ["Gestational hypertension", "Anaemia"],
    vitals: [
      { label: "Blood Pressure", value: "142/92 mmHg" },
      { label: "Weight", value: "62 kg" },
      { label: "Pulse", value: "84 bpm" },
      { label: "Temperature", value: "98.4°F" },
    ],
    investigations: [
      { name: "CBC", status: "Completed", date: "2026-09-10" },
      { name: "Urine routine", status: "Completed", date: "2026-09-08" },
    ],
    referral: {
      reason: "High blood pressure review",
      facility: "Community Health Centre, Gaya",
      status: "Follow-up Pending",
      date: "2026-09-12",
    },
    followUp: {
      title: "BP review",
      status: "Due",
      date: "2026-09-22",
    },
    birthPlan: {
      facility: "CHC Gaya",
      transport: "Ready",
      status: "In progress",
    },
    ashaCoordination: {
      ashaName: "Suman Devi",
      status: "Follow-up assigned",
      note: "Home visit scheduled for blood pressure review",
    },
  },
];

const getPatientRecord = (id?: string) => {
  if (!id) return patientRecords[0];
  return patientRecords.find((patient) => patient.id === id) ?? patientRecords[0];
};

function DashboardCardLink({ to, label, value, icon, hint }: { to: string; label: string; value: string | number; icon: React.ReactNode; hint?: string }) {
  return (
    <Link to={to} className="block rounded-2xl border border-rose-100 bg-white p-4 shadow-card transition hover:-translate-y-0.5 hover:border-primary-200">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-gray-500">{label}</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
          {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-100 text-primary-700">{icon}</div>
      </div>
    </Link>
  );
}

export function DoctorDashboardPage() {
  const patients = usePatients("", 100);
  const items = useMemo(() => getDoctorPatients(patients.data?.items ?? []), [patients.data]);

  if (patients.isLoading) return <Spinner />;

  const activePatients = items.length;
  const highRisk = items.filter((patient) => String(patient.id) === "TEST-001").length;

  return (
    <div className="space-y-6">
      <PageHeader title="Doctor Dashboard" subtitle="Complete overview of patient care, referrals, and urgent follow-up tasks." />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <DashboardCardLink to="/doctor/patients" label="My Patients" value={activePatients} icon={<Users className="w-5 h-5" />} hint="Open patient list" />
        <DashboardCardLink to="/doctor/appointments" label="Appointments Today" value="03" icon={<Calendar className="w-5 h-5" />} hint="View clinic schedule" />
        <DashboardCardLink to="/doctor/high-risk" label="High-Risk Cases" value={highRisk || 1} icon={<AlertTriangle className="w-5 h-5" />} hint="Review urgent cases" />
        <DashboardCardLink to="/doctor/follow-ups" label="Pending Follow-ups" value="04" icon={<Clock3 className="w-5 h-5" />} hint="Follow-up due" />
        <DashboardCardLink to="/doctor/referrals" label="Pending Referrals" value="02" icon={<Shield className="w-5 h-5" />} hint="Track referral progress" />
        <DashboardCardLink to="/doctor/delivery" label="Upcoming Deliveries" value="01" icon={<HeartPulse className="w-5 h-5" />} hint="Birth planning summary" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Recent Patients">
          {patients.isError ? (
            <ErrorState message={patients.error?.message} onRetry={() => patients.refetch()} />
          ) : items.length === 0 ? (
            <EmptyState title="No patients found" description="No assigned patient records are currently available." />
          ) : (
            <ul className="space-y-3">
              {items.slice(0, 6).map((patient) => (
                <li key={patient.id}>
                  <Link to={`/doctor/patients/${patient.id}`} className="flex items-center justify-between rounded-xl border border-rose-100 bg-white p-3 hover:bg-primary-50/30">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-100 text-accent-700 font-semibold">{patient.name.charAt(0)}</div>
                      <div>
                        <p className="font-medium text-gray-900">{patient.name}</p>
                        <p className="text-xs text-gray-500">{patient.id}</p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-300" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Daily Doctor Tasks">
          <ul className="space-y-3 text-sm text-gray-600">
            <li className="flex gap-2"><span className="mt-2 h-2 w-2 rounded-full bg-primary-500" /> Review Rose TEST-001 blood pressure follow-up and nutrition plan.</li>
            <li className="flex gap-2"><span className="mt-2 h-2 w-2 rounded-full bg-accent-500" /> Check investigations and lab reports.</li>
            <li className="flex gap-2"><span className="mt-2 h-2 w-2 rounded-full bg-amber-500" /> Confirm pending referrals and follow-up tasks.</li>
            <li className="flex gap-2"><span className="mt-2 h-2 w-2 rounded-full bg-red-500" /> Review high-risk patient actions and escalation notes.</li>
          </ul>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Recent Activity">
          <div className="space-y-3 text-sm text-gray-600">
            <div className="rounded-xl border border-rose-100 bg-white p-3"><span className="font-medium text-gray-900">Rose TEST-001</span> · BP review scheduled for 2026-09-22.</div>
            <div className="rounded-xl border border-rose-100 bg-white p-3"><span className="font-medium text-gray-900">Referral</span> · Follow-up pending for the Community Health Centre review.</div>
            <div className="rounded-xl border border-rose-100 bg-white p-3"><span className="font-medium text-gray-900">ASHA coordination</span> · Home visit assigned to Suman Devi.</div>
          </div>
        </Card>

        <Card title="Notifications / Alerts">
          <div className="space-y-3 text-sm text-gray-600">
            <div className="rounded-xl border border-rose-100 bg-white p-3"><span className="font-medium text-gray-900">High-risk case</span> · Rose requires an urgent follow-up review.</div>
            <div className="rounded-xl border border-rose-100 bg-white p-3"><span className="font-medium text-gray-900">Missed appointment</span> · Follow-up reminder is due today.</div>
            <div className="rounded-xl border border-rose-100 bg-white p-3"><span className="font-medium text-gray-900">Investigation update</span> · Report available for review.</div>
          </div>
        </Card>
      </div>
    </div>
  );
}

export function DoctorPatientsPage() {
  const { data, isLoading, isError, error, refetch } = usePatients("", 100);
  const [query, setQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");

  const patientList = useMemo(() => {
    const items = getDoctorPatients(data?.items ?? []);
    const filtered = items.filter((patient) => {
      const matchQuery = !query || `${patient.name} ${patient.id}`.toLowerCase().includes(query.toLowerCase());
      const risk = String((patient as { riskStatus?: string }).riskStatus ?? "Normal");
      const matchRisk = riskFilter === "all" || risk.toLowerCase().includes(riskFilter.toLowerCase());
      return matchQuery && matchRisk;
    });

    return filtered.sort((a, b) => {
      if (sortBy === "id") return a.id.localeCompare(b.id);
      return a.name.localeCompare(b.name);
    });
  }, [data, query, riskFilter, sortBy]);

  if (isLoading) return <Spinner />;

  return (
    <div className="space-y-6">
      <PageHeader title="My Patients" subtitle="Search, filter, sort, and open the patient workflow." />

      <div className="grid gap-3 md:grid-cols-[1fr_180px_160px]">
        <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search patient or ID" aria-label="Search patient or ID" />
        <select value={riskFilter} onChange={(event) => setRiskFilter(event.target.value)} className="rounded-xl border border-rose-100 bg-white px-3 py-2 text-sm text-gray-700">
          <option value="all">All risk</option>
          <option value="high">High Risk</option>
          <option value="normal">Normal</option>
        </select>
        <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} className="rounded-xl border border-rose-100 bg-white px-3 py-2 text-sm text-gray-700">
          <option value="name">Sort: Name</option>
          <option value="id">Sort: ID</option>
        </select>
      </div>

      {isError ? (
        <ErrorState message={error?.message} onRetry={() => refetch()} />
      ) : patientList.length === 0 ? (
        <Card>
          <EmptyState title="No patients matched" description="Try a different search or filter." />
        </Card>
      ) : (
        <Card title={`Patients (${patientList.length})`}>
          <div className="space-y-3">
            {patientList.map((patient) => {
              const record = getPatientRecord(patient.id);
              return (
                <div key={patient.id} className="rounded-xl border border-rose-100 bg-white p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-accent-100 font-semibold text-accent-700">{patient.name.charAt(0)}</div>
                      <div>
                        <p className="font-semibold text-gray-900">{patient.name}</p>
                        <p className="text-xs text-gray-500">{patient.id} · Age {record.age ?? 25}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="rounded-full bg-red-100 px-2 py-1 font-medium text-red-700">{record.riskStatus ?? "Normal"}</span>
                      <span className="text-gray-500">{record.village ?? "Bhojpur"}</span>
                    </div>
                  </div>
                  <div className="mt-3 grid gap-2 text-xs text-gray-600 sm:grid-cols-3">
                    <span>Pregnancy week: {record.pregnancyWeek ?? 28}</span>
                    <span>EDD: {record.expectedDeliveryDate ?? "Not available"}</span>
                    <span>Next visit: {record.nextAppointment ?? "Not available"}</span>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <Link to={`/doctor/patients/${patient.id}`} className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">
                      View Patient <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}

export function DoctorAppointmentsPage() {
  const navigate = useNavigate();
  const appointments = [
    { id: "APT-001", patient: "Rose", patientId: "TEST-001", time: "Today · 10:00 AM", type: "Follow-up", status: "Confirmed" },
    { id: "APT-002", patient: "Rose", patientId: "TEST-001", time: "Tomorrow · 11:30 AM", type: "ANC review", status: "Scheduled" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Appointments" subtitle="Today's, upcoming, completed and missed schedule." />
      <div className="grid gap-4 lg:grid-cols-2">
        {appointments.map((appointment) => (
          <Card key={appointment.id} title={appointment.type}>
            <div className="space-y-3 text-sm text-gray-600">
              <p><span className="font-medium text-gray-900">Patient:</span> {appointment.patient}</p>
              <p><span className="font-medium text-gray-900">Time:</span> {appointment.time}</p>
              <p><span className="font-medium text-gray-900">Status:</span> {appointment.status}</p>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => navigate(`/doctor/patients/${appointment.patientId}`)} className="rounded-xl border border-rose-100 bg-white px-3 py-2 text-xs font-medium text-gray-700">View Patient</button>
                <button type="button" onClick={() => navigate(`/doctor/patients/${appointment.patientId}`)} className="rounded-xl bg-primary-600 px-3 py-2 text-xs font-medium text-white">View Appointment</button>
                <button type="button" onClick={() => navigate(`/doctor/patients/${appointment.patientId}`)} className="rounded-xl border border-primary-200 bg-primary-50 px-3 py-2 text-xs font-medium text-primary-700">Record Consultation</button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function DoctorHighRiskPage() {
  const patient = getPatientRecord("TEST-001");
  return (
    <div className="space-y-6">
      <PageHeader title="High-Risk Cases" subtitle="Patients with documented risk and urgent follow-up needs." />
      <Card>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-semibold text-gray-900">{patient.name} ({patient.id})</p>
            <p className="text-sm text-gray-500">{patient.village} · {patient.riskStatus}</p>
          </div>
          <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700">High Risk</span>
        </div>
        <div className="mt-4 grid gap-2 text-sm text-gray-600 sm:grid-cols-2">
          <span>Risk factors: {patient.riskFactors?.join(", ") ?? "Not available"}</span>
          <span>Referral status: {patient.referral?.status ?? "Not available"}</span>
          <span>Follow-up status: {patient.followUp?.status ?? "Not available"}</span>
          <span>Assessment: Maternal risk review complete</span>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link to={`/doctor/patients/${patient.id}`} className="rounded-xl border border-rose-100 bg-white px-3 py-2 text-xs font-medium text-gray-700">View Patient</Link>
          <Link to="/doctor/assessments" className="rounded-xl bg-primary-600 px-3 py-2 text-xs font-medium text-white">View Assessment</Link>
          <Link to="/doctor/referrals" className="rounded-xl border border-primary-200 bg-primary-50 px-3 py-2 text-xs font-medium text-primary-700">Referral Status</Link>
        </div>
      </Card>
    </div>
  );
}

export function DoctorAssessmentsPage() {
  const patient = getPatientRecord("TEST-001");
  return (
    <div className="space-y-6">
      <PageHeader title="Clinical Assessments" subtitle="Maternal and fetal assessment details recorded for the patient." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Maternal assessment">
          <ul className="space-y-2 text-sm text-gray-600">
            <li>Patient: {patient.name}</li>
            <li>Gestational age: {patient.gestationalAge}</li>
            <li>Risk factors: {patient.riskFactors?.join(", ") ?? "Not available"}</li>
            <li>Clinical notes: Repeat BP review and nutrition counselling recommended.</li>
          </ul>
        </Card>
        <Card title="Risk assessment">
          <p className="text-sm text-gray-600">Current risk status: {patient.riskStatus}</p>
          <div className="mt-4 flex gap-2">
            <Link to={`/doctor/patients/${patient.id}`} className="rounded-xl border border-rose-100 bg-white px-3 py-2 text-xs font-medium text-gray-700">View Patient</Link>
            <Link to="/doctor/high-risk" className="rounded-xl bg-primary-600 px-3 py-2 text-xs font-medium text-white">Review Risk</Link>
          </div>
        </Card>
      </div>
    </div>
  );
}

export function DoctorVitalsPage() {
  const patient = getPatientRecord("TEST-001");
  return (
    <div className="space-y-6">
      <PageHeader title="Vitals & Trends" subtitle="Recorded measurements and monitoring trend over time." />
      {patient.vitals && patient.vitals.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {patient.vitals.map((vital) => (
            <Card key={vital.label} title={vital.label}>
              <p className="text-xl font-bold text-gray-900">{vital.value}</p>
            </Card>
          ))}
        </div>
      ) : (
        <Card><p className="text-sm text-gray-500">No vitals recorded yet.</p></Card>
      )}
    </div>
  );
}

export function DoctorInvestigationsPage() {
  const patient = getPatientRecord("TEST-001");
  return (
    <div className="space-y-6">
      <PageHeader title="Investigations / Reports" subtitle="Available blood, urine, and clinical investigation records." />
      <div className="space-y-3">
        {(patient.investigations ?? []).map((report) => (
          <div key={`${report.name}-${report.date}`} className="rounded-xl border border-rose-100 bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-gray-900">{report.name}</p>
                <p className="text-xs text-gray-500">{report.date}</p>
              </div>
              <span className="rounded-full bg-accent-100 px-2 py-1 text-xs font-medium text-accent-700">{report.status}</span>
            </div>
            <div className="mt-3 flex justify-end">
              <Link to={`/doctor/patients/${patient.id}`} className="rounded-xl bg-primary-600 px-3 py-2 text-xs font-medium text-white">View Report</Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DoctorCarePlansPage() {
  const patient = getPatientRecord("TEST-001");
  return (
    <div className="space-y-6">
      <PageHeader title="Care Plans" subtitle="Current care plan and follow-up requirements for the patient." />
      <Card title="Care plan summary">
        <ul className="space-y-2 text-sm text-gray-600">
          <li>Plan: {patient.plan}</li>
          <li>Follow-up requirement: Repeat BP monitoring and counselling.</li>
          <li>Review date: {patient.nextAppointment}</li>
        </ul>
        <div className="mt-4 flex gap-2">
          <Link to={`/doctor/patients/${patient.id}`} className="rounded-xl border border-rose-100 bg-white px-3 py-2 text-xs font-medium text-gray-700">View Care Plan</Link>
          <Link to="/doctor/follow-ups" className="rounded-xl bg-primary-600 px-3 py-2 text-xs font-medium text-white">Review Follow-up Requirements</Link>
        </div>
      </Card>
    </div>
  );
}

export function DoctorReferralsPage() {
  const patient = getPatientRecord("TEST-001");
  return (
    <div className="space-y-6">
      <PageHeader title="Referrals" subtitle="Referral management between facility, doctor, and follow-up tasks." />
      <Card title="Current referral">
        <div className="space-y-3 text-sm text-gray-600">
          <p><span className="font-medium text-gray-900">Patient:</span> {patient.name}</p>
          <p><span className="font-medium text-gray-900">Reason:</span> {patient.referral?.reason ?? "Not available"}</p>
          <p><span className="font-medium text-gray-900">Facility:</span> {patient.referral?.facility ?? "Not available"}</p>
          <p><span className="font-medium text-gray-900">Status:</span> {patient.referral?.status ?? "Not available"}</p>
          <p><span className="font-medium text-gray-900">Date:</span> {patient.referral?.date ?? "Not available"}</p>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link to={`/doctor/patients/${patient.id}`} className="rounded-xl border border-rose-100 bg-white px-3 py-2 text-xs font-medium text-gray-700">View Patient</Link>
          <Link to={`/doctor/referrals`} className="rounded-xl bg-primary-600 px-3 py-2 text-xs font-medium text-white">View Referral Details</Link>
        </div>
      </Card>
    </div>
  );
}

export function DoctorASHACoordinationPage() {
  const patient = getPatientRecord("TEST-001");
  return (
    <div className="space-y-6">
      <PageHeader title="ASHA Coordination" subtitle="Doctor-to-ASHA follow-up and field coordination." />
      <Card title="ASHA coordination summary">
        <div className="space-y-3 text-sm text-gray-600">
          <p><span className="font-medium text-gray-900">Patient:</span> {patient.name}</p>
          <p><span className="font-medium text-gray-900">ASHA:</span> {patient.ashaCoordination?.ashaName ?? "Not available"}</p>
          <p><span className="font-medium text-gray-900">Status:</span> {patient.ashaCoordination?.status ?? "Not available"}</p>
          <p><span className="font-medium text-gray-900">Note:</span> {patient.ashaCoordination?.note ?? "Not available"}</p>
        </div>
        <div className="mt-4 flex gap-2">
          <Link to={`/doctor/patients/${patient.id}`} className="rounded-xl border border-rose-100 bg-white px-3 py-2 text-xs font-medium text-gray-700">View Patient</Link>
          <Link to="/doctor/follow-ups" className="rounded-xl bg-primary-600 px-3 py-2 text-xs font-medium text-white">View Follow-up</Link>
        </div>
      </Card>
    </div>
  );
}

export function DoctorDeliveryPage() {
  const patient = getPatientRecord("TEST-001");
  return (
    <div className="space-y-6">
      <PageHeader title="Delivery & Birth Planning" subtitle="Birth preparedness and delivery planning workflow." />
      <Card title="Birth plan">
        <div className="space-y-3 text-sm text-gray-600">
          <p><span className="font-medium text-gray-900">Patient:</span> {patient.name}</p>
          <p><span className="font-medium text-gray-900">Expected delivery date:</span> {patient.expectedDeliveryDate}</p>
          <p><span className="font-medium text-gray-900">Current pregnancy week:</span> {patient.pregnancyWeek}</p>
          <p><span className="font-medium text-gray-900">Selected facility:</span> {patient.birthPlan?.facility ?? "Not available"}</p>
          <p><span className="font-medium text-gray-900">Birth preparedness:</span> {patient.birthPlan?.status ?? "Not available"}</p>
        </div>
        <div className="mt-4 flex gap-2">
          <Link to={`/doctor/patients/${patient.id}`} className="rounded-xl border border-rose-100 bg-white px-3 py-2 text-xs font-medium text-gray-700">View Patient</Link>
          <Link to="/doctor/follow-ups" className="rounded-xl bg-primary-600 px-3 py-2 text-xs font-medium text-white">View Birth Plan</Link>
        </div>
      </Card>
    </div>
  );
}

export function DoctorFollowUpsPage() {
  const patient = getPatientRecord("TEST-001");
  const followUps = [
    { title: "Blood pressure review", status: "Due", patientId: patient.id },
    { title: "Nutrition counselling", status: "Completed", patientId: patient.id },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Follow-ups" subtitle="Due, overdue, and completed follow-up activities." />
      <div className="space-y-3">
        {followUps.map((followUp) => (
          <Card key={followUp.title} title={followUp.title}>
            <div className="flex items-center justify-between gap-3 text-sm text-gray-600">
              <span>{followUp.status}</span>
              <div className="flex gap-2">
                <Link to={`/doctor/patients/${followUp.patientId}`} className="rounded-xl border border-rose-100 bg-white px-3 py-2 text-xs font-medium text-gray-700">View Patient</Link>
                <Link to={`/doctor/patients/${followUp.patientId}`} className="rounded-xl bg-primary-600 px-3 py-2 text-xs font-medium text-white">Complete Follow-up</Link>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function DoctorNotificationsPage() {
  const notifications = [
    { name: "High-Risk Case", detail: "Rose TEST-001 needs urgent follow-up review.", href: "/doctor/high-risk" },
    { name: "Referral Update", detail: "Referral status is pending and requires review.", href: "/doctor/referrals" },
    { name: "Investigation/Report Available", detail: "CBC and urine test results are ready.", href: "/doctor/investigations" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Notifications" subtitle="Doctor alerts and patient action updates." />
      <div className="space-y-3">
        {notifications.map((item) => (
          <Link key={item.name} to={item.href} className="block rounded-xl border border-rose-100 bg-white p-4 hover:bg-primary-50/30">
            <p className="font-semibold text-gray-900">{item.name}</p>
            <p className="mt-1 text-sm text-gray-600">{item.detail}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function DoctorEducationPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Health Education" subtitle="Maternal health education and awareness topics." />
      <div className="grid gap-4 md:grid-cols-2">
        {[
          "Antenatal Care",
          "Maternal Nutrition",
          "Pregnancy Danger Signs",
          "Birth Preparedness",
          "Referral Awareness",
          "Postnatal Care",
          "Newborn Care",
        ].map((topic) => (
          <Card key={topic} title={topic}>
            <p className="text-sm text-gray-600">Education content is available in the maternal wellness library and can be reviewed with the patient as needed.</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function DoctorReportsPage() {
  const patient = getPatientRecord("TEST-001");
  const metrics = [
    { label: "Assigned Patients", value: "01" },
    { label: "Active Pregnancies", value: "01" },
    { label: "High-Risk Cases", value: "01" },
    { label: "Pending Follow-ups", value: "01" },
    { label: "Referrals", value: "01" },
    { label: "Upcoming Deliveries", value: "01" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Reports & Analytics" subtitle="Doctor workload and maternal health summary." />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {metrics.map((metric) => (
          <StatCard key={metric.label} label={metric.label} value={metric.value} color="blue" />
        ))}
      </div>
      <Card title="Patient summary">
        <div className="space-y-2 text-sm text-gray-600">
          <p><span className="font-medium text-gray-900">Patient:</span> {patient.name} ({patient.id})</p>
          <p><span className="font-medium text-gray-900">Pregnancy week:</span> {patient.pregnancyWeek}</p>
          <p><span className="font-medium text-gray-900">Risk status:</span> {patient.riskStatus}</p>
        </div>
      </Card>
    </div>
  );
}

export function DoctorProfilePage() {
  const user = useAuthStore((state) => state.user);
  return (
    <div className="space-y-6">
      <PageHeader title="Profile / Settings" subtitle="Doctor profile and practice settings." />
      <Card title="Doctor details">
        <div className="space-y-3 text-sm text-gray-600">
          <p><span className="font-medium text-gray-900">Name:</span> {user?.name ?? "Doctor"}</p>
          <p><span className="font-medium text-gray-900">Role:</span> {user?.role ?? "DOCTOR"}</p>
          <p><span className="font-medium text-gray-900">Department / Specialization:</span> Obstetrics & Gynecology</p>
          <p><span className="font-medium text-gray-900">Contact:</span> {user?.email ?? "doctor@example.com"}</p>
          <p><span className="font-medium text-gray-900">Assigned facility:</span> Community Health Centre, Gaya</p>
        </div>
      </Card>
    </div>
  );
}
