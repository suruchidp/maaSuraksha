import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import React from "react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import DoctorDashboardPage from "@/pages/doctor/Dashboard";
import ASHADashboardPage from "@/pages/asha/Dashboard";
import { useAuthStore } from "@/stores/authStore";
import { UserRole, Language } from "@maasuraksha/shared";
import type { Paginated } from "@/lib/api";
import type { UserDTO } from "@/lib/types";

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
        "doctor.noPatientsDescription": "desc",
        "doctor.noReviewNeeded": "No patients need review",
        "doctor.noReviewNeededDescription": "desc",
        "doctor.noUpcomingAppointments": "No upcoming appointments",
        "doctor.noUpcomingAppointmentsDescription": "desc",
        "asha.dashboard.title": "ASHA Dashboard",
        "asha.dashboard.subtitle": "Care",
        "asha.dashboard.assignedWomen": "Assigned Women",
        "asha.dashboard.followUpsDue": "Follow-ups Due",
        "asha.dashboard.upcomingVisits": "Upcoming Visits",
        "asha.dashboard.pendingReferrals": "Pending Referrals",
        "asha.dashboard.needsFollowUp": "Needs Follow-up",
        "asha.dashboard.recentPatients": "Recent Patients",
        "asha.dashboard.upcomingPatientCare": "Upcoming Patient Care",
        "asha.dashboard.viewPatient": "View patient",
        "asha.dashboard.referralReason": "Reason",
        "asha.dashboard.referralFacility": "Facility",
        "asha.noAssignedWomen": "No women assigned",
        "asha.noAssignedWomenDescription": "desc",
        "asha.noFollowUpsDue": "No follow-ups due",
        "asha.noFollowUpsDueDescription": "desc",
        "asha.noUpcomingAppointments": "No upcoming appointments",
        "asha.noUpcomingAppointmentsDescription": "desc",
        "asha.noPendingReferrals": "No pending referrals",
        "asha.noPendingReferralsDescription": "desc",
      };
      return labels[key] ?? key;
    },
  }),
}));

vi.mock("@/services/patients", () => ({
  listAccessiblePatients: vi.fn(),
}));

vi.mock("@/services/appointments", () => ({
  listAppointments: vi.fn(async () => ({ items: [], page: 1, limit: 50, total: 0 })),
}));

vi.mock("@/services/assessments", () => ({
  latestMaternalRisk: vi.fn(async () => {
    throw { response: { status: 404 } };
  }),
}));

vi.mock("@/services/alerts", () => ({
  listAlerts: vi.fn(async () => ({ items: [], page: 1, limit: 50, total: 0 })),
}));

vi.mock("@/services/referrals", () => ({
  listReferrals: vi.fn(async () => ({ items: [], page: 1, limit: 50, total: 0 })),
}));

function makeClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, refetchOnWindowFocus: false },
    },
  });
}

describe("REAL hook-order repro", () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: { id: "doc1", name: "Dr X", email: "x@e.com", role: UserRole.DOCTOR, language: Language.EN, isActive: true },
      token: "tok",
      isAuthenticated: true,
    });
  });

  it("doctor dashboard handles dynamic useQueries count (0 -> N) with StrictMode", async () => {
    const { listAccessiblePatients } = await import("@/services/patients");
    let resolvePatients: (v: Paginated<UserDTO>) => void = () => {};
    vi.mocked(listAccessiblePatients).mockReturnValue(
      new Promise((resolve) => {
        resolvePatients = resolve;
      })
    );

    const client = makeClient();
    const errors: string[] = [];
    const originalError = console.error;
    console.error = (...args: unknown[]) => {
      const msg = String(args[0] ?? "");
      if (msg.includes("Rendered fewer hooks") || msg.includes("Rendered more hooks")) {
        errors.push(msg);
      }
      originalError(...args);
    };

    render(
      <React.StrictMode>
        <QueryClientProvider client={client}>
          <MemoryRouter>
            <DoctorDashboardPage />
          </MemoryRouter>
        </QueryClientProvider>
      </React.StrictMode>
    );

    await act(async () => {
      resolvePatients({
        items: [
          { id: "p1", name: "Ayesha", email: "a@e.com", phone: "1", role: UserRole.PATIENT, isActive: true, language: Language.EN, createdAt: "", updatedAt: "" },
          { id: "p2", name: "Divya", email: "d@e.com", phone: "2", role: UserRole.PATIENT, isActive: true, language: Language.EN, createdAt: "", updatedAt: "" },
          { id: "p3", name: "Kavya", email: "k@e.com", phone: "3", role: UserRole.PATIENT, isActive: true, language: Language.EN, createdAt: "", updatedAt: "" },
        ],
        page: 1,
        limit: 100,
        total: 3,
        totalPages: 1,
      });
    });

    await screen.findByText("Doctor Dashboard");
    console.error = originalError;
    expect(errors).toEqual([]);
  });

  it("ASHA dashboard renders with real hooks", async () => {
    const client = makeClient();
    let error: unknown = null;
    const originalError = console.error;
    console.error = (...args: unknown[]) => {
      if (typeof args[0] === "string" && args[0].includes("Rendered fewer hooks")) {
        error = args[0];
      }
      originalError(...args);
    };

    useAuthStore.setState({
      user: { id: "asha1", name: "ASHA", email: "a@e.com", role: UserRole.ASHA, language: Language.EN, isActive: true },
      token: "tok",
      isAuthenticated: true,
    });

    render(
      <React.StrictMode>
        <QueryClientProvider client={client}>
          <MemoryRouter>
            <ASHADashboardPage />
          </MemoryRouter>
        </QueryClientProvider>
      </React.StrictMode>
    );

    await screen.findByText("ASHA Dashboard");
    console.error = originalError;
    expect(error).toBeNull();
  });
});