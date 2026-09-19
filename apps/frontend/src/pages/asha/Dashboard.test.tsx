import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ASHADashboardPage from "./Dashboard";

const mockUsePatients = vi.fn();
vi.mock("@/hooks/queries", () => ({
  usePatients: (...args: unknown[]) => mockUsePatients(...args),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const labels: Record<string, string> = {
        "asha.dashboard.title": "ASHA Dashboard",
        "asha.dashboard.subtitle": "Manage care",
        "asha.dashboard.totalAssignedPregnantWomen": "Total Assigned Pregnant Women",
        "asha.dashboard.highRiskPregnancies": "High-Risk Pregnancies",
        "asha.dashboard.homeVisitsDueToday": "Home Visits Due Today",
        "asha.dashboard.ancAppointmentsDue": "ANC Appointments Due",
        "asha.dashboard.followUpsPending": "Follow-ups Pending",
        "asha.dashboard.referralsPending": "Referrals Pending",
        "asha.dashboard.needsAttention": "Needs Attention",
        "asha.dashboard.recentPatients": "Recent Patients",
      };
      return labels[key] ?? key;
    },
  }),
}));

describe("ASHA dashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePatients.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        items: [
          { id: "p1", name: "Asha Verma", email: "asha@example.com", role: "PATIENT" },
          { id: "p2", name: "Meera Singh", email: "meera@example.com", role: "PATIENT" },
          { id: "p3", name: "Rani Patel", email: "rani@example.com", role: "PATIENT" },
        ],
      },
    });
  });

  it("shows actionable summary cards and the attention section", () => {
    render(
      <MemoryRouter>
        <ASHADashboardPage />
      </MemoryRouter>
    );

    expect(screen.getByText("Total Assigned Pregnant Women")).toBeInTheDocument();
    expect(screen.getByText("High-Risk Pregnancies")).toBeInTheDocument();
    expect(screen.getByText("Home Visits Due Today")).toBeInTheDocument();
    expect(screen.getByText("ANC Appointments Due")).toBeInTheDocument();
    expect(screen.getByText("Follow-ups Pending")).toBeInTheDocument();
    expect(screen.getByText("Referrals Pending")).toBeInTheDocument();
    expect(screen.getByText("Needs Attention")).toBeInTheDocument();
    expect(screen.getByText("High-risk follow-up overdue")).toBeInTheDocument();
  });
});
