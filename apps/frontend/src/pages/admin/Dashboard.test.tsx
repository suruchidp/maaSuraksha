import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AdminDashboardPage from "./Dashboard";

const mocks = vi.hoisted(() => ({ overview: vi.fn(), refetch: vi.fn() }));
vi.mock("@/hooks/queries", () => ({ useAdminOverview: mocks.overview }));

const overview = {
  users: 12,
  activeUsers: 10,
  patients: 8,
  ashas: 2,
  doctors: 2,
  pregnancyProfiles: 5,
  healthMetrics: 40,
  symptoms: 12,
  assessments: 9,
  moodEntries: 3,
  pendingAlerts: 2,
  pendingReferrals: 1,
  appointments: 6,
};

describe("Admin dashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.overview.mockReturnValue({ isLoading: false, isError: false, data: overview });
  });

  it("shows the loading state while awaiting the overview", () => {
    mocks.overview.mockReturnValue({ isLoading: true });
    render(<AdminDashboardPage />);
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "System Overview" })).not.toBeInTheDocument();
  });

  it("renders platform statistics from the real overview payload", () => {
    render(<AdminDashboardPage />);
    expect(screen.getByRole("heading", { name: "System Overview" })).toBeInTheDocument();
    expect(screen.getAllByText("Total Users").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("12").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Pending Alerts").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Pending Referrals").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("1").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Mood Entries").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("3").length).toBeGreaterThanOrEqual(1);
  });

  it("offers retry when the overview cannot be loaded", async () => {
    mocks.overview.mockReturnValue({ isLoading: false, isError: true, error: new Error("Overview unavailable"), refetch: mocks.refetch });
    render(<AdminDashboardPage />);
    expect(screen.getByText("Overview unavailable")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(mocks.refetch).toHaveBeenCalled();
  });
});