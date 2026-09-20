import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import DoctorDashboardPage from "./Dashboard";

const mockUsePatients = vi.fn();
const mockUseAppointments = vi.fn();
const mockUseLatestRiskByPatient = vi.fn();

vi.mock("@/hooks/queries", () => ({
  usePatients: (...args: unknown[]) => mockUsePatients(...args),
  useAppointments: (...args: unknown[]) => mockUseAppointments(...args),
  useLatestRiskByPatient: (...args: unknown[]) => mockUseLatestRiskByPatient(...args),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const labels: Record<string, string> = {
        "doctor.dashboard.title": "Doctor Dashboard",
        "doctor.dashboard.subtitle": "Monitor care",
        "doctor.dashboard.myPatients": "My Patients",
        "doctor.dashboard.upcomingAppointments": "Upcoming Appointments",
        "doctor.dashboard.highRiskReview": "High-Risk / Review Needed",
        "doctor.dashboard.recentPatients": "Recent Patients",
        "doctor.dashboard.reviewNeeded": "Review Needed",
        "doctor.dashboard.viewAll": "View all",
        "doctor.noPatients": "No patients assigned",
        "doctor.noPatientsDescription": "Patients will appear here once they are assigned to you.",
        "doctor.noReviewNeeded": "No patients need review",
        "doctor.noReviewNeededDescription": "Patients with a high or critical maternal risk assessment will appear here.",
        "doctor.noUpcomingAppointments": "No upcoming appointments",
        "doctor.noUpcomingAppointmentsDescription": "Appointments for your patients will appear here.",
      };
      return labels[key] ?? key;
    },
  }),
}));

const patients = [
  { id: "p1", name: "Ayesha Khan", email: "ayesha@example.com", phone: "+91 11111 11111", role: "PATIENT" },
  { id: "p2", name: "Divya Rao", email: "divya@example.com", phone: "+91 22222 22222", role: "PATIENT" },
  { id: "p3", name: "Kavya Nair", email: "kavya@example.com", phone: "+91 33333 33333", role: "PATIENT" },
];

const today = new Date().toISOString().slice(0, 10);

function defaultMocks() {
  mockUsePatients.mockReturnValue({ isLoading: false, isError: false, data: { items: patients } });
  mockUseAppointments.mockReturnValue({
    isLoading: false,
    isError: false,
    data: {
      items: [
        { id: "a1", patient: "p1", date: today, time: "09:30", type: "ANC", status: "scheduled" },
        { id: "a2", patient: "p2", date: today, time: "12:00", type: "High-risk review", status: "confirmed" },
        { id: "a3", patient: "p3", date: "2020-01-01", time: "10:00", type: "Follow-up", status: "completed" },
      ],
    },
  });
  mockUseLatestRiskByPatient.mockReturnValue([
    { data: { user: "p1", riskLevel: "high", riskScore: 0.9, riskFactors: ["Gestational hypertension"], recommendations: ["Weekly BP monitoring"], modelVersion: "rule-based", createdAt: "2026-09-18T00:00:00.000Z" } },
    { data: { user: "p2", riskLevel: "low", riskScore: 0.1, riskFactors: [], recommendations: [], modelVersion: "rule-based", createdAt: "2026-09-18T00:00:00.000Z" } },
    { data: undefined },
  ]);
}

describe("Doctor dashboard (real data)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    defaultMocks();
  });

  it("renders summary stats with real counts", () => {
    render(
      <MemoryRouter>
        <DoctorDashboardPage />
      </MemoryRouter>
    );

    expect(screen.getAllByText("My Patients").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("High-Risk / Review Needed").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("3").length).toBeGreaterThanOrEqual(1);
  });

  it("lists only real patients and never fabricated ones", () => {
    render(
      <MemoryRouter>
        <DoctorDashboardPage />
      </MemoryRouter>
    );

    expect(screen.getAllByText("Ayesha Khan").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Divya Rao").length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText("ANITA VERMA")).toBeNull();
    expect(screen.queryByText("Anita Verma")).toBeNull();
    expect(screen.queryByText("Rose")).toBeNull();
  });

  it("surfaces the high-risk patient in Review Needed", () => {
    render(
      <MemoryRouter>
        <DoctorDashboardPage />
      </MemoryRouter>
    );

    expect(screen.getAllByText("Review Needed").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("High Risk").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Gestational hypertension").length).toBeGreaterThanOrEqual(1);
  });

  it("shows real upcoming appointments", () => {
    render(
      <MemoryRouter>
        <DoctorDashboardPage />
      </MemoryRouter>
    );

    expect(screen.getAllByText("Upcoming Appointments").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("ANC").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("High-risk review").length).toBeGreaterThanOrEqual(1);
  });

  it("shows empty states when there is no data", () => {
    mockUsePatients.mockReturnValue({ isLoading: false, isError: false, data: { items: [] } });
    mockUseAppointments.mockReturnValue({ isLoading: false, isError: false, data: { items: [] } });
    mockUseLatestRiskByPatient.mockReturnValue([]);

    render(
      <MemoryRouter>
        <DoctorDashboardPage />
      </MemoryRouter>
    );

    expect(screen.getAllByText("No patients assigned").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("No patients need review").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("No upcoming appointments").length).toBeGreaterThanOrEqual(1);
  });
});