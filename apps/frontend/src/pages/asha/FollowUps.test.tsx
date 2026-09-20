import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ASHAFollowUpsPage } from "./Sections";

const mockUsePatients = vi.fn();
const mockUseAppointments = vi.fn();
const mockUseAlerts = vi.fn();

vi.mock("@/hooks/queries", () => ({
  usePatients: (...args: unknown[]) => mockUsePatients(...args),
  useAppointments: (...args: unknown[]) => mockUseAppointments(...args),
  useAlerts: (...args: unknown[]) => mockUseAlerts(...args),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const labels: Record<string, string> = {
        "nav.followUps": "Follow-ups",
        "asha.dashboard.followUpsDue": "Follow-ups Due",
        "asha.dashboard.needsFollowUp": "Needs Follow-up",
        "asha.noFollowUpsDue": "No follow-ups due",
        "asha.noFollowUpsDueDescription": "Follow-ups for your assigned women will appear here.",
      };
      return labels[key] ?? key;
    },
  }),
}));

const patients = [
  { id: "p1", name: "Asha Verma", email: "asha@example.com", phone: "+91 11111 11111", role: "PATIENT" },
  { id: "p2", name: "Meera Singh", email: "meera@example.com", phone: "+91 22222 22222", role: "PATIENT" },
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
        { id: "a3", patient: "p1", date: "2020-01-01", time: "09:00", type: "ANC", status: "completed" },
      ],
    },
  });
  mockUseAlerts.mockReturnValue({
    isLoading: false,
    isError: false,
    data: {
      items: [
        { id: "al1", user: "p2", title: "High-risk follow-up overdue", message: "Review urgently", severity: "critical", status: "pending", type: "high_risk", createdAt: "2026-09-01T00:00:00.000Z" },
        { id: "al2", user: "p1", title: "Resolved alert", message: "old", severity: "info", status: "resolved", type: "general", createdAt: "2026-09-01T00:00:00.000Z" },
      ],
    },
  });
}

describe("ASHA follow-ups page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    defaultMocks();
  });

  it("lists real scheduled follow-up visits only (no completed/past ones)", () => {
    render(
      <MemoryRouter>
        <ASHAFollowUpsPage />
      </MemoryRouter>
    );

    expect(screen.getAllByText(/Follow-ups Due/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Asha Verma").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Meera Singh").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/ANC/).length).toBeGreaterThanOrEqual(1);
  });

  it("shows pending alerts that need follow-up with links to the patient record", () => {
    render(
      <MemoryRouter>
        <ASHAFollowUpsPage />
      </MemoryRouter>
    );

    expect(screen.getAllByText(/Needs Follow-up/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("High-risk follow-up overdue").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Review urgently").length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText("Resolved alert")).toBeNull();
  });

  it("shows empty states when there are no pending follow-ups or alerts", () => {
    mockUseAppointments.mockReturnValue({ isLoading: false, isError: false, data: { items: [] } });
    mockUseAlerts.mockReturnValue({ isLoading: false, isError: false, data: { items: [] } });

    render(
      <MemoryRouter>
        <ASHAFollowUpsPage />
      </MemoryRouter>
    );

    expect(screen.getAllByText("No follow-ups due").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("No pending alerts.").length).toBeGreaterThanOrEqual(1);
  });
});