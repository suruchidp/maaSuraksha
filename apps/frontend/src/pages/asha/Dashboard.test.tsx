import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ASHADashboardPage from "./Dashboard";

const mockUsePatients = vi.fn();
const mockUseAppointments = vi.fn();
const mockUseAlerts = vi.fn();
const mockUseReferrals = vi.fn();

vi.mock("@/hooks/queries", () => ({
  usePatients: (...args: unknown[]) => mockUsePatients(...args),
  useAppointments: (...args: unknown[]) => mockUseAppointments(...args),
  useAlerts: (...args: unknown[]) => mockUseAlerts(...args),
  useReferrals: (...args: unknown[]) => mockUseReferrals(...args),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const labels: Record<string, string> = {
        "asha.dashboard.title": "ASHA Dashboard",
        "asha.dashboard.subtitle": "Track care",
        "asha.dashboard.assignedWomen": "Assigned Women",
        "asha.dashboard.followUpsDue": "Follow-ups Due",
        "asha.dashboard.upcomingVisits": "Upcoming Visits",
        "asha.dashboard.pendingReferrals": "Pending Referrals",
        "asha.dashboard.needsFollowUp": "Needs Follow-up",
        "asha.dashboard.recentPatients": "Recent Patients",
        "asha.dashboard.upcomingPatientCare": "Upcoming Patient Care",
        "asha.dashboard.viewPatient": "View Patient",
        "asha.dashboard.viewAll": "View all",
        "asha.dashboard.referralReason": "Reason",
        "asha.dashboard.referralFacility": "Facility",
        "asha.noAssignedWomen": "No assigned women yet",
        "asha.noAssignedWomenDescription": "Women assigned to your care will appear here.",
        "asha.noFollowUpsDue": "No follow-ups due",
        "asha.noFollowUpsDueDescription": "Follow-ups for your assigned women will appear here.",
        "asha.noUpcomingAppointments": "No upcoming appointments",
        "asha.noUpcomingAppointmentsDescription": "Upcoming doctor or facility visits for your assigned women will appear here.",
        "asha.noPendingReferrals": "No referrals pending",
        "asha.noPendingReferralsDescription": "Referrals made for your assigned patients will appear here.",
      };
      return labels[key] ?? key;
    },
  }),
}));

const patients = [
  { id: "p1", name: "Asha Verma", email: "asha@example.com", phone: "+91 11111 11111", role: "PATIENT" },
  { id: "p2", name: "Meera Singh", email: "meera@example.com", phone: "+91 22222 22222", role: "PATIENT" },
  { id: "p3", name: "Rani Patel", email: "rani@example.com", phone: "+91 33333 33333", role: "PATIENT" },
];

const today = new Date().toISOString().slice(0, 10);

function defaultMocks() {
  mockUsePatients.mockReturnValue({ isLoading: false, isError: false, data: { items: patients } });
  mockUseAppointments.mockReturnValue({
    isLoading: false,
    isError: false,
    data: {
      items: [
        { id: "a1", patient: "p1", date: today, time: "10:30", type: "ANC", status: "scheduled" },
        { id: "a2", patient: "p2", date: today, time: "11:00", type: "Follow-up", status: "confirmed" },
      ],
    },
  });
  mockUseAlerts.mockReturnValue({
    isLoading: false,
    isError: false,
    data: {
      items: [
        { id: "al1", user: "p1", title: "High-risk follow-up overdue", message: "Review urgently", severity: "critical", status: "pending", type: "high_risk", createdAt: "2026-09-01T00:00:00.000Z" },
      ],
    },
  });
  mockUseReferrals.mockReturnValue({
    isLoading: false,
    isError: false,
    data: {
      items: [
        { id: "r1", patient: "p2", reason: "Specialist review", facility: "CHC", status: "pending", createdAt: "2026-09-02T00:00:00.000Z" },
      ],
    },
  });
}

describe("ASHA dashboard (real data)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    defaultMocks();
  });

  it("renders summary stats and real patient counts", () => {
    render(
      <MemoryRouter>
        <ASHADashboardPage />
      </MemoryRouter>
    );

    expect(screen.getAllByText("Assigned Women").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Follow-ups Due").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Pending Referrals").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("3").length).toBeGreaterThanOrEqual(1);
  });

  it("lists only real assigned patients and never fabricated ones", () => {
    render(
      <MemoryRouter>
        <ASHADashboardPage />
      </MemoryRouter>
    );

    expect(screen.getAllByText("Asha Verma").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Meera Singh").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Rani Patel").length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText("ANITA VERMA")).toBeNull();
    expect(screen.queryByText("Anita Verma")).toBeNull();
    expect(screen.queryByText("Rose")).toBeNull();
  });

  it("shows real patient follow-ups with reason in Needs Follow-up", () => {
    render(
      <MemoryRouter>
        <ASHADashboardPage />
      </MemoryRouter>
    );

    expect(screen.getAllByText("Needs Follow-up").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("High-risk follow-up overdue").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Review urgently").length).toBeGreaterThanOrEqual(1);
  });

  it("shows upcoming patient care as information only without booking actions", () => {
    render(
      <MemoryRouter>
        <ASHADashboardPage />
      </MemoryRouter>
    );

    expect(screen.getAllByText("Upcoming Patient Care").length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText("Book Appointment")).toBeNull();
    expect(screen.queryByText("Book appointment")).toBeNull();
    expect(screen.queryByText("Schedule Visit")).toBeNull();
  });

  it("shows real pending referrals with reason and facility", () => {
    render(
      <MemoryRouter>
        <ASHADashboardPage />
      </MemoryRouter>
    );

    expect(screen.getAllByText(/Specialist review/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/CHC/).length).toBeGreaterThanOrEqual(1);
  });

  it("shows empty states when there are no assigned women, follow-ups, care or referrals", () => {
    mockUsePatients.mockReturnValue({ isLoading: false, isError: false, data: { items: [] } });
    mockUseAppointments.mockReturnValue({ isLoading: false, isError: false, data: { items: [] } });
    mockUseAlerts.mockReturnValue({ isLoading: false, isError: false, data: { items: [] } });
    mockUseReferrals.mockReturnValue({ isLoading: false, isError: false, data: { items: [] } });

    render(
      <MemoryRouter>
        <ASHADashboardPage />
      </MemoryRouter>
    );

    expect(screen.getAllByText("No assigned women yet").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("No follow-ups due").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("No upcoming appointments").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("No referrals pending").length).toBeGreaterThanOrEqual(1);
  });
});