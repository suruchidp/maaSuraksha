import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertTriangle, Bell, CalendarClock, ChevronRight, Clock3, MapPin, Phone, ShieldAlert, Stethoscope, Users, Wifi, WifiOff } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatCard } from "@/components/ui/StatCard";
import { useAuthStore } from "@/stores/authStore";

const basePatients = [
  {
    id: "p-101",
    name: "Anita Verma",
    village: "Bhojpur",
    age: 26,
    pregnancyWeek: 28,
    edd: "2026-11-12",
    riskStatus: "High Risk",
    phone: "+91 98765 43210",
    nextANC: "2026-09-18",
    nextFollowUp: "2026-09-20",
    currentStatus: "Monitoring",
    lastANC: "2026-09-04",
    plannedFacility: "PHC Bhojpur",
    referralFacility: "Community Health Centre, Gaya",
    riskFactor: "Gestational hypertension",
  },
  {
    id: "p-102",
    name: "Meera Singh",
    village: "Sarai",
    age: 24,
    pregnancyWeek: 20,
    edd: "2026-12-02",
    riskStatus: "Normal Risk",
    phone: "+91 98765 43211",
    nextANC: "2026-09-29",
    nextFollowUp: "2026-09-21",
    currentStatus: "Stable",
    lastANC: "2026-08-28",
    plannedFacility: "Sub-centre Sarai",
    referralFacility: "PHC Sarai",
    riskFactor: "None noted",
  },
  {
    id: "p-103",
    name: "Rani Patel",
    village: "Kushwaha",
    age: 29,
    pregnancyWeek: 35,
    edd: "2026-10-09",
    riskStatus: "High Risk",
    phone: "+91 98765 43212",
    nextANC: "2026-09-16",
    nextFollowUp: "2026-09-17",
    currentStatus: "Delivery Soon",
    lastANC: "2026-09-11",
    plannedFacility: "District Hospital",
    referralFacility: "District Hospital, Gaya",
    riskFactor: "Previous C-section",
  },
  {
    id: "p-104",
    name: "Sita Devi",
    village: "Panchayat",
    age: 22,
    pregnancyWeek: 12,
    edd: "2027-01-18",
    riskStatus: "Normal Risk",
    phone: "+91 98765 43213",
    nextANC: "2026-09-27",
    nextFollowUp: "2026-09-30",
    currentStatus: "Follow-up Due",
    lastANC: "2026-08-30",
    plannedFacility: "PHC Panchayat",
    referralFacility: "PHC Panchayat",
    riskFactor: "No high-risk indicators",
  },
  {
    id: "p-105",
    name: "Laxmi Kumari",
    village: "Bhojpur",
    age: 31,
    pregnancyWeek: 32,
    edd: "2026-10-31",
    riskStatus: "High Risk",
    phone: "+91 98765 43214",
    nextANC: "2026-09-19",
    nextFollowUp: "2026-09-18",
    currentStatus: "Follow-up Due",
    lastANC: "2026-09-01",
    plannedFacility: "CHC Rafiganj",
    referralFacility: "CHC Rafiganj",
    riskFactor: "Anaemia and low BP",
  },
  {
    id: "p-106",
    name: "Rose",
    village: "Bhojpur",
    age: 25,
    pregnancyWeek: 24,
    edd: "2026-11-27",
    riskStatus: "High Risk",
    phone: "+91 90000 00001",
    nextANC: "2026-09-22",
    nextFollowUp: "2026-09-23",
    currentStatus: "Monitoring",
    lastANC: "2026-09-10",
    plannedFacility: "PHC Bhojpur",
    referralFacility: "PHC Bhojpur",
    riskFactor: "Anaemia and blood pressure monitoring",
  },
] as const;

const homeVisitGroups = {
  today: [
    { patient: "Rani Patel", village: "Kushwaha", time: "09:30 AM", week: 35, risk: "High Risk", purpose: "ANC reminder and birth preparedness" },
    { patient: "Anita Verma", village: "Bhojpur", time: "11:00 AM", week: 28, risk: "High Risk", purpose: "Blood pressure review and counselling" },
    { patient: "Rose", village: "Bhojpur", time: "15:00 PM", week: 24, risk: "High Risk", purpose: "Follow-up for anaemia and blood pressure review" },
  ],
  upcoming: [
    { patient: "Sita Devi", village: "Panchayat", time: "2026-09-21 15:30", week: 12, risk: "Normal Risk", purpose: "Home visit for nutrition and check-in" },
    { patient: "Meera Singh", village: "Sarai", time: "2026-09-23 10:00", week: 20, risk: "Normal Risk", purpose: "Follow-up after ANC review" },
  ],
  overdue: [
    { patient: "Laxmi Kumari", village: "Bhojpur", time: "2026-09-12 09:00", week: 32, risk: "High Risk", purpose: "High-risk follow-up and medication counselling" },
  ],
  completed: [
    { patient: "Neha Kumari", village: "Sarai", time: "2026-09-10 08:30", week: 18, risk: "Normal Risk", purpose: "Routine counselling and symptom check" },
  ],
};

const ancSummary = [
  { label: "ANC completed", value: 14 },
  { label: "ANC due soon", value: 5 },
  { label: "ANC overdue", value: 2 },
  { label: "Upcoming appointments", value: 7 },
  { label: "Missed appointments", value: 3 },
];

const deliveryTracker = [
  { patient: "Rani Patel", pregnancyWeek: 35, edd: "2026-10-09", facility: "District Hospital", birthPreparedness: "Complete", transportStatus: "Ready", risk: "High Risk" },
  { patient: "Laxmi Kumari", pregnancyWeek: 32, edd: "2026-10-31", facility: "CHC Rafiganj", birthPreparedness: "Partial", transportStatus: "Pending", risk: "High Risk" },
  { patient: "Anita Verma", pregnancyWeek: 28, edd: "2026-11-12", facility: "PHC Bhojpur", birthPreparedness: "In progress", transportStatus: "Ready", risk: "High Risk" },
  { patient: "Rose", pregnancyWeek: 24, edd: "2026-11-27", facility: "PHC Bhojpur", birthPreparedness: "In progress", transportStatus: "Ready", risk: "High Risk" },
];

const referralList = [
  { patient: "Laxmi Kumari", reason: "Anaemia and blood pressure review", facility: "CHC Rafiganj", date: "2026-09-10", status: "Follow-up Pending", followUp: "2026-09-18" },
  { patient: "Anita Verma", reason: "Hypertension review", facility: "Community Health Centre, Gaya", date: "2026-09-08", status: "Referred", followUp: "2026-09-20" },
  { patient: "Rani Patel", reason: "Delivery planning and high-risk monitoring", facility: "District Hospital", date: "2026-09-07", status: "Appointment Scheduled", followUp: "2026-09-17" },
  { patient: "Rose", reason: "Follow-up for blood pressure and anaemia review", facility: "PHC Bhojpur", date: "2026-09-14", status: "Follow-up Pending", followUp: "2026-09-23" },
];

const nearbyFacilities = [
  { name: "PHC Bhojpur", type: "Primary Health Centre", location: "Bhojpur village", distance: "1.2 km", contact: "+91 98765 43210", services: ["ANC", "Vaccination", "Emergency care"], emergency: true },
  { name: "CHC Rafiganj", type: "Community Health Centre", location: "Rafiganj block", distance: "7.8 km", contact: "+91 98765 43211", services: ["Lab", "Delivery", "Referral"], emergency: true },
  { name: "District Hospital", type: "Secondary care", location: "Gaya district", distance: "18.5 km", contact: "+91 98765 43212", services: ["Specialist consult", "Lab", "Emergency"], emergency: true },
];

const notifications = [
  { title: "ANC reminder", detail: "3 women need follow-up consultation within 48 hours.", patientId: "p-103" },
  { title: "Home visit reminder", detail: "2 visits are scheduled for today in Bhojpur.", patientId: "p-101" },
  { title: "High-risk follow-up", detail: "Laxmi Kumari needs a medical review check-in this week.", patientId: "p-105" },
  { title: "Referral follow-up", detail: "Awaiting feedback on Anita Verma’s referral status.", patientId: "p-101" },
  { title: "Rose follow-up", detail: "Rose needs a blood pressure and anaemia review scheduled today.", patientId: "p-106" },
];

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function openPhone(phone?: string) {
  if (!phone) {
    window.alert("Phone number not available");
    return;
  }
  window.location.href = `tel:${phone.replace(/\s+/g, "")}`;
}

function openDirections(location?: string, name?: string) {
  const query = encodeURIComponent(location ? `${name ?? "Facility"} ${location}` : (name ?? "health facility"));
  window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, "_blank", "noopener,noreferrer");
}

export function ASHAHighRiskPage() {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const items = useMemo(
    () => basePatients.filter((patient) => patient.riskStatus === "High Risk" && (!query || `${patient.name} ${patient.village}`.toLowerCase().includes(query.toLowerCase()))),
    [query]
  );

  return (
    <div className="space-y-6">
      <PageHeader title={t("asha.dashboard.highRiskPregnancies") || "High-Risk Pregnancies"} subtitle="Patients requiring closer monitoring and referral follow-up." />
      <div className="max-w-md">
        <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search patient or village" aria-label="Search patient or village" />
      </div>
      {items.length === 0 ? (
        <Card><EmptyState title="No high-risk patients" description="No matching patients found for the current search." /></Card>
      ) : (
        <div className="space-y-3">
          {items.map((patient) => (
            <div key={patient.id} className="rounded-2xl border border-red-100 bg-red-50/40 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{patient.name}</p>
                  <p className="text-xs text-gray-500">{patient.village} · {patient.pregnancyWeek} weeks</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-red-100 text-red-700 px-2 py-1 text-[10px] font-semibold">{patient.riskStatus}</span>
                  <Link to={`/asha/patients/${patient.id}`} className="text-sm font-medium text-primary-700">View Patient</Link>
                </div>
              </div>
              <div className="mt-3 grid gap-2 text-xs text-gray-600 sm:grid-cols-2">
                <span>Risk factor: {patient.riskFactor}</span>
                <span>Last ANC: {formatDate(patient.lastANC)}</span>
                <span>Next follow-up: {formatDate(patient.nextFollowUp)}</span>
                <span>Planned facility: {patient.plannedFacility}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ASHAHomeVisitsPage() {
  const { t } = useTranslation();
  const [groups, setGroups] = useState(homeVisitGroups);

  const markCompleted = (key: keyof typeof homeVisitGroups, patient: string) => {
    setGroups((current) => ({
      ...current,
      [key]: current[key].filter((visit) => visit.patient !== patient),
      completed: [
        ...current.completed,
        ...(current[key].filter((visit) => visit.patient === patient).map((visit) => ({ ...visit, time: "Completed" }))),
      ],
    }));
  };

  return (
    <div className="space-y-6">
      <PageHeader title={t("asha.dashboard.homeVisits") || "Home Visits"} subtitle="Track visits, reminders and follow-up completion." />
      <div className="grid gap-4 xl:grid-cols-2">
        {Object.entries(groups).map(([key, visits]) => (
          <Card key={key} title={key.charAt(0).toUpperCase() + key.slice(1)}>
            <div className="space-y-3">
              {visits.length === 0 ? (
                <p className="text-sm text-gray-500">No visits in this list.</p>
              ) : (
                visits.map((visit) => (
                  <div key={`${key}-${visit.patient}`} className="rounded-xl border border-rose-100 bg-white p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-gray-900">{visit.patient}</p>
                        <p className="text-xs text-gray-500">{visit.village} · {visit.time}</p>
                      </div>
                      <span className="rounded-full bg-primary-100 text-primary-700 px-2 py-1 text-[10px] font-semibold">{visit.week}w</span>
                    </div>
                    <p className="mt-2 text-xs text-gray-600">Purpose: {visit.purpose}</p>
                    <div className="mt-3 flex gap-2">
                      <Link to={`/asha/patients/${basePatients.find((p) => p.name === visit.patient)?.id ?? ""}`} className="inline-flex items-center gap-1 rounded-xl border border-rose-100 bg-white px-3 py-2 text-xs font-medium text-gray-700">View Patient</Link>
                      {key !== "completed" && (
                        <button type="button" onClick={() => markCompleted(key as keyof typeof homeVisitGroups, visit.patient)} className="rounded-xl bg-primary-600 px-3 py-2 text-xs font-medium text-white">Mark Visit Completed</button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function ASHAAppointmentsPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const patientRows = basePatients.filter((patient) => `${patient.name} ${patient.village}`.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <PageHeader title={t("nav.appointments") || "ANC & Appointments"} subtitle="Upcoming, overdue and completed ANC follow-ups." />
      <div className="max-w-md">
        <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search patient" aria-label="Search patient" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {ancSummary.map((item) => (
          <StatCard key={item.label} label={item.label} value={item.value} />
        ))}
      </div>
      <div className="space-y-3">
        {patientRows.map((patient) => (
          <div key={patient.id} className="rounded-2xl border border-rose-100 bg-white p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-gray-900">{patient.name}</p>
                <p className="text-xs text-gray-500">{patient.village} · {patient.pregnancyWeek} weeks</p>
              </div>
              <div className="flex gap-2">
                <Link to={`/asha/patients/${patient.id}`} className="rounded-xl border border-rose-100 px-3 py-2 text-xs font-medium text-gray-700">View Patient</Link>
                <button type="button" className="rounded-xl bg-primary-600 px-3 py-2 text-xs font-medium text-white" onClick={() => openPhone(patient.phone)}>Call Patient</button>
              </div>
            </div>
            <div className="mt-3 grid gap-2 text-xs text-gray-600 sm:grid-cols-3">
              <span>Last ANC: {formatDate(patient.lastANC)}</span>
              <span>Next ANC: {formatDate(patient.nextANC)}</span>
              <span>Follow-up: {formatDate(patient.nextFollowUp)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ASHADeliveryTrackerPage() {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <PageHeader title={t("asha.dashboard.expectedDeliveryTracker") || "Delivery Tracker"} subtitle="Expected deliveries within the next month." />
      <div className="grid gap-4 xl:grid-cols-3">
        {deliveryTracker.map((item) => (
          <Card key={item.patient} title={item.patient}>
            <div className="space-y-2 text-sm text-gray-600">
              <p>EDD: {formatDate(item.edd)}</p>
              <p>Week: {item.pregnancyWeek}</p>
              <p>Facility: {item.facility}</p>
              <p>Transport: {item.transportStatus}</p>
              <p>Preparedness: {item.birthPreparedness}</p>
              <div className="flex flex-wrap gap-2 pt-2">
                <Link to={`/asha/patients/${basePatients.find((p) => p.name === item.patient)?.id ?? ""}`} className="rounded-xl border border-rose-100 px-3 py-2 text-xs font-medium text-gray-700">View Patient</Link>
                <button type="button" onClick={() => openDirections(item.facility, item.facility)} className="rounded-xl border border-rose-100 px-3 py-2 text-xs font-medium text-gray-700">View Facility</button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function ASHABirthPreparednessPage() {
  const { t } = useTranslation();
  const [items, setItems] = useState([
    { label: "Delivery facility selected", patients: ["Anita Verma", "Meera Singh", "Rani Patel"] },
    { label: "Transport planned", patients: ["Rani Patel", "Laxmi Kumari"] },
    { label: "Emergency contact available", patients: ["Anita Verma", "Meera Singh", "Rani Patel", "Laxmi Kumari"] },
    { label: "Family informed", patients: ["Anita Verma", "Meera Singh"] },
    { label: "Documents prepared", patients: ["Rani Patel"] },
    { label: "Birth companion identified", patients: ["Rani Patel", "Meera Singh"] },
  ]);

  const togglePatient = (label: string, patient: string) => {
    setItems((current) => current.map((group) => group.label === label ? { ...group, patients: group.patients.includes(patient) ? group.patients.filter((entry) => entry !== patient) : [...group.patients, patient] } : group));
  };

  return (
    <div className="space-y-6">
      <PageHeader title={t("asha.dashboard.birthPreparedness") || "Birth Preparedness"} subtitle="Track readiness for delivery services and family planning." />
      <div className="space-y-4">
        {items.map((group) => (
          <Card key={group.label} title={group.label}>
            <div className="flex flex-wrap gap-2">
              {basePatients.map((patient) => (
                <button
                  key={`${group.label}-${patient.id}`}
                  type="button"
                  onClick={() => togglePatient(group.label, patient.name)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium ${group.patients.includes(patient.name) ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-rose-100 bg-white text-gray-600"}`}
                >
                  {patient.name}
                </button>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function ASHAReferralsPage() {
  const [state, setState] = useState(referralList);
  const followUp = (patient: string) => {
    setState((current) => current.map((referral) => referral.patient === patient ? { ...referral, status: "Follow-up Completed" } : referral));
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Referrals" subtitle="Track referrals and scheduled follow-up actions." />
      <div className="space-y-3">
        {state.map((referral) => (
          <div key={`${referral.patient}-${referral.date}`} className="rounded-2xl border border-rose-100 bg-white p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-gray-900">{referral.patient}</p>
                <p className="text-xs text-gray-500">{referral.facility}</p>
              </div>
              <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-700">{referral.status}</span>
            </div>
            <div className="mt-3 grid gap-2 text-xs text-gray-600 sm:grid-cols-2">
              <span>Reason: {referral.reason}</span>
              <span>Follow-up: {formatDate(referral.followUp)}</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link to={`/asha/patients/${basePatients.find((p) => p.name === referral.patient)?.id ?? ""}`} className="rounded-xl border border-rose-100 px-3 py-2 text-xs font-medium text-gray-700">View Patient</Link>
              <button type="button" onClick={() => followUp(referral.patient)} className="rounded-xl bg-primary-600 px-3 py-2 text-xs font-medium text-white">Record Follow-up</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ASHAFacilitiesPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Health Facilities" subtitle="Nearby facilities and referral points for field follow-up." />
      <div className="space-y-3">
        {nearbyFacilities.map((facility) => (
          <Card key={facility.name} title={facility.name}>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-center justify-between">
                <span>{facility.type}</span>
                <span className="rounded-full bg-primary-100 text-primary-700 px-2 py-1 text-[10px] font-semibold">{facility.distance}</span>
              </div>
              <p><MapPin className="mr-1 inline h-4 w-4" /> {facility.location}</p>
              <p><Phone className="mr-1 inline h-4 w-4" /> {facility.contact}</p>
              <div className="flex flex-wrap gap-2">
                {facility.services.map((service) => (
                  <span key={`${facility.name}-${service}`} className="rounded-full bg-rose-50 px-2 py-1 text-[10px] text-gray-700">{service}</span>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                <button type="button" onClick={() => openDirections(facility.location, facility.name)} className="rounded-xl bg-primary-600 px-3 py-2 text-xs font-medium text-white">Get Directions</button>
                <button type="button" onClick={() => window.location.href = `tel:${facility.contact.replace(/\s+/g, "")}`} className="rounded-xl border border-rose-100 px-3 py-2 text-xs font-medium text-gray-700">Call Facility</button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function ASHANotificationsPage() {
  const navigate = useNavigate();
  return (
    <div className="space-y-6">
      <PageHeader title="Notifications" subtitle="Service reminders and priority updates." />
      <div className="space-y-3">
        {notifications.map((item) => (
          <button
            key={item.title}
            type="button"
            onClick={() => navigate(`/asha/patients/${item.patientId}`)}
            className="flex w-full items-start gap-3 rounded-2xl border border-rose-100 bg-white p-4 text-left"
          >
            <Bell className="mt-0.5 h-4 w-4 text-primary-600" />
            <div>
              <p className="font-semibold text-gray-900">{item.title}</p>
              <p className="text-xs text-gray-600">{item.detail}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export function ASHAReportsPage() {
  const stats = [
    { label: "Total assigned pregnant women", value: 24 },
    { label: "High-risk pregnancies", value: 6 },
    { label: "ANC completed", value: 14 },
    { label: "ANC overdue", value: 2 },
    { label: "Home visits completed", value: 18 },
    { label: "Home visits pending", value: 5 },
    { label: "Referrals", value: 9 },
    { label: "Expected deliveries", value: 7 },
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
  const navigate = useNavigate();
  return (
    <div className="space-y-6">
      <PageHeader title="Alerts" subtitle="Priority follow-ups and outreach reminders." />
      <div className="space-y-3">
        {notifications.map((item) => (
          <button key={item.title} type="button" onClick={() => navigate(`/asha/patients/${item.patientId}`)} className="flex w-full items-start gap-3 rounded-2xl border border-rose-100 bg-white p-4 text-left">
            <AlertTriangle className="mt-0.5 h-4 w-4 text-red-600" />
            <div>
              <p className="font-semibold text-gray-900">{item.title}</p>
              <p className="text-xs text-gray-600">{item.detail}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export function ASHADashboardActionCards() {
  const { t } = useTranslation();
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-4">
      <Link to="/asha/patients"><StatCard icon={<Users className="w-5 h-5" />} label={t("asha.dashboard.totalAssignedPregnantWomen") || "Total Assigned Pregnant Women"} value={basePatients.length} color="green" hint={t("asha.dashboard.todayOverview") || "Assigned care"} /></Link>
      <Link to="/asha/high-risk"><StatCard icon={<ShieldAlert className="w-5 h-5" />} label={t("asha.dashboard.highRiskPregnancies") || "High-Risk Pregnancies"} value={basePatients.filter((p) => p.riskStatus === "High Risk").length} color="red" hint={t("asha.dashboard.urgentReview") || "Urgent review"} /></Link>
      <Link to="/asha/home-visits"><StatCard icon={<CalendarClock className="w-5 h-5" />} label={t("asha.dashboard.homeVisitsDueToday") || "Home Visits Due Today"} value={homeVisitGroups.today.length} color="amber" hint={t("asha.dashboard.assignedCare") || "Assigned care"} /></Link>
      <Link to="/asha/appointments"><StatCard icon={<Stethoscope className="w-5 h-5" />} label={t("asha.dashboard.ancAppointmentsDue") || "ANC Appointments Due"} value={ancSummary[1].value} color="blue" hint={t("asha.dashboard.nextCheckups") || "Next checkups"} /></Link>
      <Link to="/asha/patients"><StatCard icon={<Clock3 className="w-5 h-5" />} label={t("asha.dashboard.followUpsPending") || "Follow-ups Pending"} value={basePatients.filter((p) => p.currentStatus === "Follow-up Due").length} color="peach" hint={t("asha.dashboard.followupPriority") || "Priority follow-up"} /></Link>
      <Link to="/asha/referrals"><StatCard icon={<AlertTriangle className="w-5 h-5" />} label={t("asha.dashboard.referralsPending") || "Referrals Pending"} value={referralList.filter((r) => r.status !== "Completed").length} color="blush" hint={t("asha.dashboard.referralFlow") || "Referral flow"} /></Link>
    </div>
  );
}

export function ASHADashboardNeedsAttention() {
  const { t } = useTranslation();
  return (
    <Card title={t("asha.dashboard.needsAttention") || "Needs Attention"} tone="peach">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {notifications.map((alert) => {
          const patient = basePatients.find((item) => item.id === alert.patientId) ?? basePatients[0];
          return (
            <div key={`${alert.title}-${patient.id}`} className="rounded-2xl border border-rose-100 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-gray-900">{patient.name}</p>
                  <p className="text-xs text-gray-500">{patient.village} · {patient.pregnancyWeek} weeks</p>
                </div>
                <span className="inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold bg-amber-100 text-amber-700 border-amber-200">{alert.title}</span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-600">
                <div><span className="font-medium text-gray-500">Due:</span> {new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</div>
                <div><span className="font-medium text-gray-500">Action:</span> {alert.title}</div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link to={`/asha/patients/${patient.id}`} className="rounded-xl border border-rose-100 px-3 py-2 text-xs font-medium text-gray-700">View Patient</Link>
                <button type="button" onClick={() => openPhone(patient.phone)} className="rounded-xl bg-primary-600 px-3 py-2 text-xs font-medium text-white">Call Patient</button>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

export function ASHADashboardPatientTable() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  const patientRows = useMemo(() => basePatients.filter((patient) => {
    const matchesSearch = !search || `${patient.name} ${patient.village}`.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "All" || patient.riskStatus === filter || patient.currentStatus === filter;
    return matchesSearch && matchesFilter;
  }), [filter, search]);

  return (
    <Card title={t("asha.dashboard.myPatients") || "My Patients"}>
      <div className="mb-4 flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {(["All", "Normal Risk", "High Risk", "Follow-up Due", "Delivery Soon"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setFilter(option)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium border ${filter === option ? "bg-primary-100 border-primary-200 text-primary-700" : "bg-white border-rose-100 text-gray-600"}`}
            >
              {option}
            </button>
          ))}
        </div>
        <div className="w-full md:max-w-xs">
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t("asha.dashboard.searchPatient") || "Search patient"} aria-label={t("asha.dashboard.searchPatient") || "Search patient"} />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="text-gray-500 border-b border-rose-100">
              <th className="pb-3 pr-4">Patient</th>
              <th className="pb-3 pr-4">Village</th>
              <th className="pb-3 pr-4">Age</th>
              <th className="pb-3 pr-4">Week</th>
              <th className="pb-3 pr-4">EDD</th>
              <th className="pb-3 pr-4">Risk</th>
              <th className="pb-3 pr-4">Next ANC</th>
              <th className="pb-3 pr-4">Follow-up</th>
            </tr>
          </thead>
          <tbody>
            {patientRows.map((patient) => (
              <tr key={patient.id} className="border-b border-rose-50/60 align-top">
                <td className="py-3 pr-4">
                  <Link to={`/asha/patients/${patient.id}`} className="flex items-center gap-3 font-medium text-gray-900 hover:text-primary-700">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-50 text-primary-700 font-semibold">{patient.name.charAt(0)}</span>
                    <span>{patient.name}</span>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </Link>
                </td>
                <td className="py-3 pr-4">{patient.village}</td>
                <td className="py-3 pr-4">{patient.age}</td>
                <td className="py-3 pr-4">{patient.pregnancyWeek}w</td>
                <td className="py-3 pr-4">{formatDate(patient.edd)}</td>
                <td className="py-3 pr-4"><span className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-semibold ${patient.riskStatus === "High Risk" ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>{patient.riskStatus}</span></td>
                <td className="py-3 pr-4">{formatDate(patient.nextANC)}</td>
                <td className="py-3 pr-4">{formatDate(patient.nextFollowUp)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
