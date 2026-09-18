import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import PregnancyTracking from "./PregnancyTracking";
const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  update: vi.fn(),
  user: { id: "p1", role: "PATIENT" },
  chart: vi.fn(),
}));
vi.mock("@/services/pregnancy", () => ({
  getPregnancyTracking: mocks.get,
  updatePregnancyMilestone: mocks.update,
}));
vi.mock("@/stores/authStore", () => ({
  useAuthStore: (s: Function) => s({ user: mocks.user }),
}));
vi.mock("@/components/charts/MetricTrendChart", () => ({
  MetricTrendChart: (props: unknown) => {
    mocks.chart(props);
    return <div>Trend chart</div>;
  },
}));
const data = {
  profile: {
    gestationalWeek: 24,
    gestationalDays: 3,
    status: "active",
    updatedAt: "2026-01-01T00:00:00Z",
  },
  milestones: [
    {
      key: "gdm_screening",
      fromWeek: 24,
      toWeek: 28,
      date: "2026-01-01",
      source: "https://www.cdc.gov/diabetes/about/gestational-diabetes.html",
      state: "current",
    },
  ],
  metrics: {
    items: [{ id: "m1", date: "2026-01-01", weight: 65 }],
    total: 1,
    included: 1,
    truncated: false,
  },
  context: {
    maternal: { status: "unavailable", createdAt: "2026-01-01" },
    gdm: null,
    latestSymptom: null,
    nextAppointments: [
      {
        date: "2026-10-01",
        time: "10:30",
        type: "antenatal",
        status: "scheduled",
      },
    ],
    pendingAlerts: 2,
  },
};
function setup(id?: string) {
  return render(
    <QueryClientProvider
      client={
        new QueryClient({
          defaultOptions: { queries: { retry: false, retryDelay: 0 } },
        })
      }
    >
      <PregnancyTracking patientId={id} />
    </QueryClientProvider>,
  );
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.user.role = "PATIENT";
  mocks.get.mockResolvedValue(structuredClone(data));
  mocks.update.mockResolvedValue({});
});
describe("Pregnancy tracking workspace", () => {
  it("shows actual milestone windows and unavailable assessments without low-risk claims", async () => {
    setup();
    await screen.findByText("Gestational diabetes screening");
    expect(screen.getByText("Current window")).toBeInTheDocument();
    expect(screen.getByText("Unavailable")).toBeInTheDocument();
    expect(screen.queryByText("Low")).not.toBeInTheDocument();
    expect(screen.getByText(/10:30/)).toHaveTextContent("India time");
    expect(screen.getByRole("link", { name: "Diet guidance" })).toHaveAttribute(
      "href",
      "/patient/diet",
    );
  });
  it("records explicit completion for the selected patient with a conflict guard", async () => {
    setup("patient2");
    await userEvent.click(
      await screen.findByRole("button", { name: "Mark complete" }),
    );
    await waitFor(() =>
      expect(mocks.update).toHaveBeenCalledWith(
        "gdm_screening",
        true,
        "2026-01-01T00:00:00Z",
        "patient2",
      ),
    );
  });
  it("supports undo and exposes edit conflicts", async () => {
    mocks.get.mockResolvedValue({
      ...data,
      milestones: [
        {
          ...data.milestones[0],
          state: "recorded",
          completion: { completedAt: "2026-01-01", completedBy: "p1" },
        },
      ],
    });
    mocks.update.mockRejectedValue(
      new Error("Profile changed; refresh and try again"),
    );
    setup();
    await userEvent.click(
      await screen.findByRole("button", { name: "Undo completion" }),
    );
    await screen.findByRole("alert");
    expect(screen.getByRole("alert")).toHaveTextContent("Profile changed");
    expect(mocks.update).toHaveBeenCalledWith(
      "gdm_screening",
      false,
      "2026-01-01T00:00:00Z",
      undefined,
    );
  });
  it("keeps milestone status explicit and disables completion after pregnancy ends", async () => {
    mocks.get.mockResolvedValue({
      ...data,
      profile: { ...data.profile, status: "completed" },
      milestones: [{ ...data.milestones[0], state: "closed" }],
    });
    setup();
    await screen.findByText("Pregnancy completed");
    expect(
      screen.queryByRole("button", { name: "Mark complete" }),
    ).not.toBeInTheDocument();
  });
  it("uses only saved trends, switches units, and exposes truncation", async () => {
    mocks.get.mockResolvedValue({
      ...data,
      metrics: { ...data.metrics, total: 101, included: 100, truncated: true },
    });
    setup();
    await screen.findByText("Trend chart");
    expect(mocks.chart).toHaveBeenLastCalledWith(
      expect.objectContaining({
        metricKey: "weight",
        unit: " kg",
        metrics: data.metrics.items,
      }),
    );
    await userEvent.selectOptions(
      screen.getByRole("combobox", { name: "Health metric" }),
      "systolicBP",
    );
    expect(mocks.chart).toHaveBeenLastCalledWith(
      expect.objectContaining({ metricKey: "systolicBP", unit: " mmHg" }),
    );
    expect(screen.getByText(/Newest 100/)).toBeInTheDocument();
  });
  it("scopes assigned-care-team data and avoids patient-only navigation for staff", async () => {
    mocks.user.role = "DOCTOR";
    setup("patient2");
    await screen.findByText("Trend chart");
    expect(mocks.get).toHaveBeenCalledWith("patient2");
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  });
  it("shows errors and allows a retry rather than inventing empty data", async () => {
    mocks.get.mockRejectedValue(new Error("Tracking unavailable"));
    setup();
    await screen.findByRole("button", { name: "Try again" });
    expect(screen.getByText("Tracking unavailable")).toBeInTheDocument();
  });
});
