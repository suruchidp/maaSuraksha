import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  AlertTriangle,
  Bell,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  HeartPulse,
  Hospital,
  MapPin,
  ShieldAlert,
  Stethoscope,
  Users,
  Wifi,
  WifiOff,
} from "lucide-react";
import { usePatients } from "@/hooks/queries";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { Spinner } from "@/components/ui/Spinner";
import { StatCard } from "@/components/ui/StatCard";

type FilterValue = "All" | "Normal Risk" | "High Risk" | "ANC Due" | "Follow-up Due" | "Delivery Soon";
type Severity = "red" | "amber" | "yellow";

type DemoPatient = {
  id: string;
  name: string;
  village: string;
  age: number;
  pregnancyWeek: number;
  edd: string;
  riskStatus: "Normal Risk" | "High Risk";
  lastANC: string;
  nextANC: string;
  lastHomeVisit: string;
  nextFollowUp: string;
  currentStatus: "Stable" | "Monitoring" | "Follow-up Due" | "Referral Pending" | "Delivery Soon";
  riskFactor?: string;
  referralFacility?: string;
  referralStatus?: "Monitoring" | "Follow-up Due" | "Referral Pending" | "Referred" | "Follow-up Completed";
  followUpStatus?: "Monitoring" | "Follow-up Due" | "Referral Pending" | "Referred" | "Follow-up Completed";
  plannedFacility?: string;
  birthPreparedness?: { label: string; done: boolean }[];
};

const demoPatients: DemoPatient[] = [
  {
    id: "p-101",
    name: "Anita Verma",
    village: "Bhojpur",
    age: 26,
    pregnancyWeek: 28,
    edd: "2026-11-12",
    riskStatus: "High Risk",
    lastANC: "2026-09-04",
    nextANC: "2026-09-18",
    lastHomeVisit: "2026-09-05",
    nextFollowUp: "2026-09-20",
    currentStatus: "Monitoring",
    riskFactor: "Gestational hypertension",
    referralFacility: "Community Health Centre, Gaya",
    referralStatus: "Follow-up Due",
    followUpStatus: "Monitoring",
    plannedFacility: "PHC Bhojpur",
    birthPreparedness: [
      { label: "Delivery facility selected", done: true },
      { label: "Transport arranged", done: true },
      { label: "Emergency contact available", done: true },
      { label: "Family informed", done: true },
      { label: "Documents prepared", done: false },
      { label: "Birth companion identified", done: true },
      { label: "Referral facility known", done: false },
    ],
  },
  {
    id: "p-102",
    name: "Meera Singh",
    village: "Sarai",
    age: 24,
    pregnancyWeek: 20,
    edd: "2026-12-02",
    riskStatus: "Normal Risk",
    lastANC: "2026-08-28",
    nextANC: "2026-09-29",
    lastHomeVisit: "2026-09-08",
    nextFollowUp: "2026-09-21",
    currentStatus: "Stable",
    plannedFacility: "Sub-centre Sarai",
    birthPreparedness: [
      { label: "Delivery facility selected", done: true },
      { label: "Transport arranged", done: false },
      { label: "Emergency contact available", done: true },
      { label: "Family informed", done: true },
      { label: "Documents prepared", done: false },
      { label: "Birth companion identified", done: true },
      { label: "Referral facility known", done: true },
    ],
  },
  {
    id: "p-103",
    name: "Rani Patel",
    village: "Kushwaha",
    age: 29,
    pregnancyWeek: 35,
    edd: "2026-10-09",
    riskStatus: "High Risk",
    lastANC: "2026-09-11",
    nextANC: "2026-09-16",
    lastHomeVisit: "2026-09-09",
    nextFollowUp: "2026-09-17",
    currentStatus: "Delivery Soon",
    riskFactor: "Previous C-section",
    referralFacility: "District Hospital, Gaya",
    referralStatus: "Referred",
    followUpStatus: "Follow-up Completed",
    plannedFacility: "District Hospital",
    birthPreparedness: [
      { label: "Delivery facility selected", done: true },
      { label: "Transport arranged", done: true },
      { label: "Emergency contact available", done: true },
      { label: "Family informed", done: true },
      { label: "Documents prepared", done: true },
      { label: "Birth companion identified", done: true },
      { label: "Referral facility known", done: true },
    ],
  },
  {
    id: "p-104",
    name: "Sita Devi",
    village: "Panchayat",
    age: 22,
    pregnancyWeek: 12,
    edd: "2027-01-18",
    riskStatus: "Normal Risk",
    lastANC: "2026-08-20",
    nextANC: "2026-09-27",
    lastHomeVisit: "2026-09-12",
    nextFollowUp: "2026-09-30",
    currentStatus: "Follow-up Due",
    plannedFacility: "PHC Panchayat",
    birthPreparedness: [
      { label: "Delivery facility selected", done: true },
      { label: "Transport arranged", done: false },
      { label: "Emergency contact available", done: true },
      { label: "Family informed", done: false },
      { label: "Documents prepared", done: false },
      { label: "Birth companion identified", done: true },
      { label: "Referral facility known", done: true },
    ],
  },
  {
    id: "p-105",
    name: "Laxmi Kumari",
    village: "Bhojpur",
    age: 31,
    pregnancyWeek: 32,
    edd: "2026-10-31",
    riskStatus: "High Risk",
    lastANC: "2026-09-01",
    nextANC: "2026-09-19",
    lastHomeVisit: "2026-08-30",
    nextFollowUp: "2026-09-18",
    currentStatus: "Follow-up Due",
    riskFactor: "Anaemia and low BP",
    referralFacility: "CHC Rafiganj",
    referralStatus: "Referral Pending",
    followUpStatus: "Follow-up Due",
    plannedFacility: "CHC Rafiganj",
    birthPreparedness: [
      { label: "Delivery facility selected", done: true },
      { label: "Transport arranged", done: true },
      { label: "Emergency contact available", done: true },
      { label: "Family informed", done: true },
      { label: "Documents prepared", done: false },
      { label: "Birth companion identified", done: false },
      { label: "Referral facility known", done: true },
    ],
  },
  {
    id: "p-106",
    name: "Rose",
    village: "Bhojpur",
    age: 25,
    pregnancyWeek: 24,
    edd: "2026-11-27",
    riskStatus: "High Risk",
    lastANC: "2026-09-10",
    nextANC: "2026-09-22",
    lastHomeVisit: "2026-09-15",
    nextFollowUp: "2026-09-23",
    currentStatus: "Monitoring",
    riskFactor: "Anaemia and blood pressure monitoring",
    referralFacility: "PHC Bhojpur",
    referralStatus: "Follow-up Due",
    followUpStatus: "Monitoring",
    plannedFacility: "PHC Bhojpur",
    birthPreparedness: [
      { label: "Delivery facility selected", done: true },
      { label: "Transport arranged", done: true },
      { label: "Emergency contact available", done: true },
      { label: "Family informed", done: true },
      { label: "Documents prepared", done: false },
      { label: "Birth companion identified", done: true },
      { label: "Referral facility known", done: true },
    ],
  },
];

const alertItems = [
  {
    patient: "Anita Verma",
    village: "Bhojpur",
    pregnancyWeek: 28,
    reason: "High-risk follow-up overdue",
    dueDate: "2026-09-12",
    action: "Schedule follow-up",
    severity: "red" as Severity,
  },
  {
    patient: "Rani Patel",
    village: "Kushwaha",
    pregnancyWeek: 35,
    reason: "ANC appointment missed",
    dueDate: "2026-09-16",
    action: "Call patient",
    severity: "amber" as Severity,
  },
  {
    patient: "Sita Devi",
    village: "Panchayat",
    pregnancyWeek: 12,
    reason: "Referral pending",
    dueDate: "2026-09-20",
    action: "View referral",
    severity: "yellow" as Severity,
  },
  {
    patient: "Laxmi Kumari",
    village: "Bhojpur",
    pregnancyWeek: 32,
    reason: "Expected delivery approaching",
    dueDate: "2026-10-31",
    action: "Review birth preparedness",
    severity: "amber" as Severity,
  },
  {
    patient: "Meera Singh",
    village: "Sarai",
    pregnancyWeek: 20,
    reason: "Follow-up required after doctor consultation",
    dueDate: "2026-09-21",
    action: "View patient",
    severity: "yellow" as Severity,
  },
  {
    patient: "Rose",
    village: "Bhojpur",
    pregnancyWeek: 24,
    reason: "Blood pressure and anaemia review due",
    dueDate: "2026-09-23",
    action: "Schedule review",
    severity: "amber" as Severity,
  },
];

const homeVisitGroups = {
  today: [
    { patient: "Rani Patel", village: "Kushwaha", time: "09:30 AM", week: 35, risk: "High Risk", purpose: "ANC reminder and birth preparedness" },
    { patient: "Anita Verma", village: "Bhojpur", time: "11:00 AM", week: 28, risk: "High Risk", purpose: "Blood pressure review and counselling" },
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
];

const referralList = [
  { patient: "Laxmi Kumari", reason: "Anaemia and blood pressure review", facility: "CHC Rafiganj", date: "2026-09-10", status: "Follow-up Pending", followUp: "2026-09-18" },
  { patient: "Anita Verma", reason: "Hypertension review", facility: "Community Health Centre, Gaya", date: "2026-09-08", status: "Referred", followUp: "2026-09-20" },
  { patient: "Rani Patel", reason: "Delivery planning and high-risk monitoring", facility: "District Hospital", date: "2026-09-07", status: "Appointment Scheduled", followUp: "2026-09-17" },
];

const nearbyFacilities = [
  { name: "PHC Bhojpur", type: "Primary Health Centre", location: "Bhojpur village", distance: "1.2 km", contact: "+91 98765 43210", services: ["ANC", "Vaccination", "Emergency care"], emergency: true },
  { name: "CHC Rafiganj", type: "Community Health Centre", location: "Rafiganj block", distance: "7.8 km", contact: "+91 98765 43211", services: ["Lab", "Delivery", "Referral"], emergency: true },
  { name: "District Hospital", type: "Secondary care", location: "Gaya district", distance: "18.5 km", contact: "+91 98765 43212", services: ["Specialist consult", "Lab", "Emergency"], emergency: true },
];

const reportSummary = [
  { label: "Total assigned pregnant women", value: 24 },
  { label: "ANC completed", value: 14 },
  { label: "ANC overdue", value: 2 },
  { label: "High-risk pregnancies", value: 6 },
  { label: "Home visits completed", value: 18 },
  { label: "Home visits pending", value: 5 },
  { label: "Referrals made", value: 9 },
  { label: "Referrals completed", value: 4 },
  { label: "Expected deliveries", value: 7 },
];

const communityOverview = [
  { label: "Pregnant women under care", value: 24 },
  { label: "High-risk cases", value: 6 },
  { label: "ANC due", value: 5 },
  { label: "Home visits due", value: 7 },
  { label: "Expected deliveries", value: 7 },
  { label: "Health camps/activities", value: 2 },
];

const notifications = [
  { title: "ANC reminder", detail: "3 women need follow-up consultation within 48 hours." },
  { title: "Home visit reminder", detail: "2 visits are scheduled for today in Bhojpur." },
  { title: "High-risk follow-up", detail: "Laxmi Kumari needs a medical review check-in this week." },
  { title: "Referral follow-up", detail: "Awaiting feedback on Anita Verma’s referral status." },
];

function getSeverityClasses(severity: Severity) {
  if (severity === "red") return "bg-red-100 text-red-700 border-red-200";
  if (severity === "amber") return "bg-amber-100 text-amber-700 border-amber-200";
  return "bg-yellow-100 text-yellow-700 border-yellow-200";
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function ASHADashboardPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterValue>("All");
  const patients = usePatients("", 100);

  const patientRows = useMemo(() => {
    const items = (patients.data?.items ?? demoPatients) as DemoPatient[];
    const query = search.trim().toLowerCase();
    return items.filter((patient) => {
      const matchesSearch = !query || [patient.name, patient.village, patient.currentStatus].some((value) => value.toLowerCase().includes(query));
      const matchesFilter = filter === "All" || patient.riskStatus === filter || patient.currentStatus === filter || (filter === "ANC Due" && patient.nextANC < new Date().toISOString().slice(0, 10)) || (filter === "Follow-up Due" && patient.currentStatus === "Follow-up Due");
      return matchesSearch && matchesFilter;
    });
  }, [filter, patients.data?.items, search]);

  if (patients.isLoading) return <Spinner />;

  return (
    <div className="space-y-6">
      <PageHeader title={t("asha.dashboard.title")} subtitle={t("asha.dashboard.subtitle")} />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-4">
        <StatCard icon={<Users className="w-5 h-5" />} label={t("asha.dashboard.totalAssignedPregnantWomen")} value={patientRows.length} color="green" hint={t("asha.dashboard.todayOverview")} />
        <StatCard icon={<HeartPulse className="w-5 h-5" />} label={t("asha.dashboard.highRiskPregnancies")} value={patientRows.filter((p) => p.riskStatus === "High Risk").length} color="red" hint={t("asha.dashboard.urgentReview")} />
        <StatCard icon={<CalendarClock className="w-5 h-5" />} label={t("asha.dashboard.homeVisitsDueToday")} value={homeVisitGroups.today.length} color="amber" hint={t("asha.dashboard.assignedCare")} />
        <StatCard icon={<Stethoscope className="w-5 h-5" />} label={t("asha.dashboard.ancAppointmentsDue")} value={ancSummary[1].value} color="blue" hint={t("asha.dashboard.nextCheckups")} />
        <StatCard icon={<ClipboardList className="w-5 h-5" />} label={t("asha.dashboard.followUpsPending")} value={patientRows.filter((p) => p.currentStatus === "Follow-up Due").length} color="peach" hint={t("asha.dashboard.followupPriority")} />
        <StatCard icon={<Hospital className="w-5 h-5" />} label={t("asha.dashboard.referralsPending")} value={referralList.filter((r) => r.status !== "Completed").length} color="blush" hint={t("asha.dashboard.referralFlow")} />
      </div>

      {patients.isError ? (
        <ErrorState message={patients.error?.message} onRetry={() => patients.refetch()} />
      ) : null}

      <Card title={t("asha.dashboard.needsAttention")} tone="peach">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {alertItems.map((alert) => (
            <div key={`${alert.patient}-${alert.reason}`} className="rounded-2xl border border-rose-100 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-gray-900">{alert.patient}</p>
                  <p className="text-xs text-gray-500">{alert.village} · {alert.pregnancyWeek} weeks</p>
                </div>
                <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold ${getSeverityClasses(alert.severity)}`}>
                  {alert.reason}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-600">
                <div><span className="font-medium text-gray-500">Due:</span> {formatDate(alert.dueDate)}</div>
                <div><span className="font-medium text-gray-500">Action:</span> {alert.action}</div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button variant="outline" size="sm">{t("asha.dashboard.viewPatient")}</Button>
                <Button variant="ghost" size="sm">{t("asha.dashboard.callPatient")}</Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card title={t("asha.dashboard.myPatients")}> 
        <div className="mb-4 flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {(["All", "Normal Risk", "High Risk", "ANC Due", "Follow-up Due", "Delivery Soon"] as FilterValue[]).map((option) => (
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
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t("asha.dashboard.searchPatient")} aria-label={t("asha.dashboard.searchPatient")} />
          </div>
        </div>

        {patientRows.length === 0 ? (
          <EmptyState title={t("asha.noPatients")} description={t("asha.noPatientsDescription")} />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="text-gray-500 border-b border-rose-100">
                  <th className="pb-3 pr-4">{t("asha.dashboard.patient")}</th>
                  <th className="pb-3 pr-4">{t("asha.dashboard.village")}</th>
                  <th className="pb-3 pr-4">{t("asha.dashboard.age")}</th>
                  <th className="pb-3 pr-4">{t("asha.dashboard.pregnancyWeek")}</th>
                  <th className="pb-3 pr-4">{t("asha.dashboard.edd")}</th>
                  <th className="pb-3 pr-4">{t("asha.dashboard.riskStatus")}</th>
                  <th className="pb-3 pr-4">{t("asha.dashboard.nextANC")}</th>
                  <th className="pb-3 pr-4">{t("asha.dashboard.nextFollowUp")}</th>
                  <th className="pb-3 pr-4">{t("asha.dashboard.currentStatus")}</th>
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
                    <td className="py-3 pr-4">
                      <span className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-semibold ${patient.riskStatus === "High Risk" ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
                        {patient.riskStatus}
                      </span>
                    </td>
                    <td className="py-3 pr-4">{formatDate(patient.nextANC)}</td>
                    <td className="py-3 pr-4">{formatDate(patient.nextFollowUp)}</td>
                    <td className="py-3 pr-4">
                      <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-700">{patient.currentStatus}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card title={t("asha.dashboard.highRiskPregnancies")}>
          <div className="space-y-3">
            {demoPatients.filter((patient) => patient.riskStatus === "High Risk").map((patient) => (
              <div key={patient.id} className="rounded-2xl border border-red-100 bg-red-50/40 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900">{patient.name}</p>
                    <p className="text-xs text-gray-500">{patient.riskFactor}</p>
                  </div>
                  <span className="rounded-full bg-red-100 text-red-700 px-2 py-1 text-[10px] font-semibold">{patient.riskStatus}</span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-600">
                  <div><span className="font-medium">Week:</span> {patient.pregnancyWeek}</div>
                  <div><span className="font-medium">Last review:</span> {formatDate(patient.lastANC)}</div>
                  <div><span className="font-medium">Next follow-up:</span> {formatDate(patient.nextFollowUp)}</div>
                  <div><span className="font-medium">Referral facility:</span> {patient.referralFacility}</div>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-gray-600">
                  <span>{patient.referralStatus}</span>
                  <span>{patient.followUpStatus}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title={t("asha.dashboard.homeVisits")}> 
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Object.entries(homeVisitGroups).map(([group, visits]) => (
              <div key={group} className="rounded-2xl border border-rose-100 bg-white p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-gray-500">{group}</p>
                <div className="space-y-2">
                  {visits.map((visit) => (
                    <div key={`${group}-${visit.patient}`} className="rounded-xl border border-rose-100 bg-rose-50/40 p-3">
                      <p className="font-medium text-gray-900">{visit.patient}</p>
                      <p className="text-xs text-gray-500">{visit.village} · {visit.time}</p>
                      <div className="mt-2 flex items-center justify-between text-[10px] text-gray-600">
                        <span>{visit.week} weeks</span>
                        <span>{visit.risk}</span>
                      </div>
                      <p className="mt-2 text-xs text-gray-600">{visit.purpose}</p>
                      <Button variant="outline" size="sm" className="mt-2 w-full">{t("asha.dashboard.markVisitCompleted")}</Button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card title={t("asha.dashboard.ancAndAppointments")}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {ancSummary.map((item) => (
              <div key={item.label} className="rounded-xl border border-rose-100 bg-rose-50/50 p-4">
                <p className="text-xs text-gray-500">{item.label}</p>
                <p className="mt-2 text-2xl font-bold text-gray-900">{item.value}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 space-y-3">
            {demoPatients.slice(0, 3).map((patient) => (
              <div key={patient.id} className="rounded-xl border border-gray-200 bg-white p-3">
                <div className="flex justify-between gap-3">
                  <p className="font-medium text-gray-900">{patient.name}</p>
                  <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${patient.riskStatus === "High Risk" ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}>{patient.riskStatus}</span>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-gray-600">
                  <div>Last ANC: {formatDate(patient.lastANC)}</div>
                  <div>Next ANC: {formatDate(patient.nextANC)}</div>
                  <div>Facility: {patient.plannedFacility}</div>
                  <div>Provider: Dr. Singh</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title={t("asha.dashboard.expectedDeliveryTracker")}>
          <div className="space-y-3">
            {deliveryTracker.map((item) => (
              <div key={item.patient} className="rounded-2xl border border-rose-100 bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-gray-900">{item.patient}</p>
                  <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${item.risk === "High Risk" ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}>{item.risk}</span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-600">
                  <div>Week: {item.pregnancyWeek}</div>
                  <div>EDD: {formatDate(item.edd)}</div>
                  <div>Facility: {item.facility}</div>
                  <div>Transport: {item.transportStatus}</div>
                  <div className="col-span-2">Birth preparedness: {item.birthPreparedness}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card title={t("asha.dashboard.birthPreparedness")}>
          <div className="space-y-4">
            {demoPatients.map((patient) => (
              <div key={patient.id} className="rounded-2xl border border-rose-100 bg-white p-4">
                <p className="font-semibold text-gray-900">{patient.name}</p>
                <div className="mt-3 grid grid-cols-1 gap-2 text-xs text-gray-600">
                  {patient.birthPreparedness?.map((item) => (
                    <div key={`${patient.id}-${item.label}`} className="flex items-center justify-between rounded-lg bg-rose-50/40 px-2 py-1.5">
                      <span>{item.label}</span>
                      <span className={item.done ? "text-emerald-700" : "text-amber-700"}>{item.done ? "Complete" : "Pending"}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title={t("asha.dashboard.referrals")}>
          <div className="space-y-3">
            {referralList.map((referral) => (
              <div key={`${referral.patient}-${referral.date}`} className="rounded-2xl border border-rose-100 bg-white p-4">
                <div className="flex justify-between gap-3">
                  <p className="font-semibold text-gray-900">{referral.patient}</p>
                  <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-700">{referral.status}</span>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-gray-600">
                  <div>Reason: {referral.reason}</div>
                  <div>Facility: {referral.facility}</div>
                  <div>Referral date: {formatDate(referral.date)}</div>
                  <div>Follow-up date: {formatDate(referral.followUp)}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card title={t("asha.dashboard.healthFacilities")}>
          <div className="space-y-3">
            {nearbyFacilities.map((facility) => (
              <div key={facility.name} className="rounded-2xl border border-rose-100 bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900">{facility.name}</p>
                    <p className="text-xs text-gray-500">{facility.type}</p>
                  </div>
                  <span className="rounded-full bg-primary-100 text-primary-700 px-2 py-1 text-[10px] font-semibold">{facility.distance}</span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-600">
                  <div><MapPin className="mr-1 inline h-3.5 w-3.5" />{facility.location}</div>
                  <div>{facility.contact}</div>
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-gray-600">
                  {facility.services.map((service) => (
                    <span key={`${facility.name}-${service}`} className="rounded-full bg-rose-50 px-2 py-1">{service}</span>
                  ))}
                </div>
                <div className="mt-3 flex justify-between">
                  <span className="text-xs text-emerald-700">{facility.emergency ? "Emergency available" : "Limited emergency access"}</span>
                  <Button variant="outline" size="sm">{t("asha.dashboard.getDirections")}</Button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title={t("asha.dashboard.emergencySupport")} tone="peach">
          <div className="rounded-2xl border border-red-200 bg-red-50/60 p-4">
            <div className="flex items-center gap-3">
              <ShieldAlert className="h-5 w-5 text-red-600" />
              <p className="font-semibold text-red-700">{t("asha.dashboard.urgentMedicalAttention")}</p>
            </div>
            <p className="mt-3 text-sm text-gray-700">Documented concern: heavy bleeding, severe headache or fainting should be reviewed by a healthcare provider immediately. This system does not diagnose; it redirects to safe next steps.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="outline" size="sm">{t("asha.dashboard.contactPatient")}</Button>
              <Button variant="outline" size="sm">{t("asha.dashboard.contactHealthcareFacility")}</Button>
              <Button variant="ghost" size="sm">{t("asha.dashboard.viewReferral")}</Button>
            </div>
            <div className="mt-4 rounded-xl bg-white/80 p-3 text-xs text-gray-600">
              <p className="font-semibold text-gray-800">Danger sign checklist</p>
              <ul className="mt-2 list-disc space-y-1 pl-4">
                <li>Severe abdominal pain</li>
                <li>Heavy bleeding or leaking fluid</li>
                <li>Shortness of breath</li>
                <li>Fainting or severe dizziness</li>
                <li>Reduced fetal movement</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card title={t("asha.dashboard.reports")}>
          <div className="grid grid-cols-2 gap-3">
            {reportSummary.map((item) => (
              <div key={item.label} className="rounded-xl border border-rose-100 bg-rose-50/40 p-3">
                <p className="text-[11px] text-gray-500">{item.label}</p>
                <p className="mt-2 text-xl font-bold text-gray-900">{item.value}</p>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <Button variant="primary" size="md">{t("asha.dashboard.generateReport")}</Button>
          </div>
        </Card>

        <Card title={t("asha.dashboard.communityOverview")}>
          <div className="grid grid-cols-2 gap-3">
            {communityOverview.map((item) => (
              <div key={item.label} className="rounded-xl border border-rose-100 bg-white p-3">
                <p className="text-[11px] text-gray-500">{item.label}</p>
                <p className="mt-2 text-xl font-bold text-gray-900">{item.value}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card title={t("asha.dashboard.notifications")}>
          <div className="space-y-3">
            {notifications.map((item) => (
              <div key={item.title} className="flex gap-3 rounded-xl border border-rose-100 bg-rose-50/30 p-3">
                <Bell className="mt-0.5 h-4 w-4 text-primary-600" />
                <div>
                  <p className="font-medium text-gray-900">{item.title}</p>
                  <p className="text-xs text-gray-600">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title={t("asha.dashboard.syncStatus")}>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-emerald-700">
                <Wifi className="h-4 w-4" />
                <span className="font-semibold">{t("asha.dashboard.onlineSynced")}</span>
              </div>
              <span className="text-xs text-emerald-700">{t("asha.dashboard.lastSynced", { time: "09:36 AM" })}</span>
            </div>
            <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
              <WifiOff className="h-4 w-4 text-gray-400" />
              <span>{t("asha.dashboard.offlineFallback")}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}