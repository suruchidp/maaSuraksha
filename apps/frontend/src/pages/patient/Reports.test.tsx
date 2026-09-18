import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  render,
  screen,
  waitFor,
  fireEvent,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ReportsPage, { ReportContent } from "./Reports";
const mocks = vi.hoisted(() => ({
  generate: vi.fn(),
  list: vi.fn(),
  save: vi.fn(),
  update: vi.fn(),
  detail: vi.fn(),
  user: { id: "p1" },
}));
vi.mock("@/hooks/queries", () => ({
  useReports: () => ({
    data: {
      items: [
        {
          id: "r1",
          title: "Saved report",
          type: "comprehensive",
          createdAt: "2025-01-02",
        },
      ],
      totalPages: 1,
    },
  }),
  useCreateReport: () => ({ mutate: mocks.generate }),
}));
vi.mock("@/stores/authStore", () => ({
  useAuthStore: (s: Function) => s({ user: mocks.user }),
}));
vi.mock("@/services/healthRecords", () => ({
  listHealthRecords: mocks.list,
  createHealthRecord: mocks.save,
  updateHealthRecord: mocks.update,
}));
vi.mock("@/services/reports", () => ({ getReport: mocks.detail }));
function setup(patientId?: string) {
  return render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <ReportsPage patientId={patientId} />
    </QueryClientProvider>,
  );
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.list.mockResolvedValue({ items: [], totalPages: 1 });
  mocks.save.mockResolvedValue({ id: "h1" });
  mocks.detail.mockResolvedValue({
    id: "r1",
    title: "Saved report",
    createdAt: "2025-01-02",
    data: {
      schemaVersion: 1,
      sections: {
        healthRecords: {
          items: [{ title: "Blood count", details: "Persisted record" }],
          total: 1,
          included: 1,
        },
      },
    },
  });
});
describe("Reports and records UI", () => {
  it("generates a supported server snapshot without caller data", async () => {
    setup("patient2");
    await userEvent.click(
      screen.getByRole("button", { name: "Generate report" }),
    );
    expect(mocks.generate).toHaveBeenCalledWith(
      { input: { type: "comprehensive" }, userId: "patient2" },
      expect.any(Object),
    );
  });
  it("validates reversed date ranges before generation", async () => {
    setup();
    fireEvent.change(screen.getByLabelText("From date"), {
      target: { value: "2025-02-02" },
    });
    fireEvent.change(screen.getByLabelText("To date"), {
      target: { value: "2025-01-01" },
    });
    await userEvent.click(
      screen.getByRole("button", { name: "Generate report" }),
    );
    expect(mocks.generate).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("Start date");
  });
  it("saves record form values and closes after success", async () => {
    setup("patient2");
    await userEvent.click(screen.getByRole("button", { name: "Add record" }));
    const d = within(screen.getByRole("dialog"));
    await userEvent.type(d.getByLabelText("Title"), "Blood count");
    fireEvent.change(d.getByLabelText("Record date"), {
      target: { value: "2025-01-02" },
    });
    await userEvent.type(d.getByLabelText("Details"), "Lab result");
    await userEvent.click(d.getByRole("button", { name: "Save record" }));
    await waitFor(() =>
      expect(mocks.save).toHaveBeenCalledWith(
        {
          category: "lab_result",
          title: "Blood count",
          date: "2025-01-02",
          details: "Lab result",
          provider: "",
        },
        "patient2",
      ),
    );
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });
  it("opens persisted details and downloads the authenticated report", async () => {
    const url = vi.fn(() => "blob:test");
    const revoke = vi.fn();
    vi.stubGlobal(
      "URL",
      class {
        static createObjectURL = url;
        static revokeObjectURL = revoke;
      },
    );
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {});
    setup();
    await userEvent.click(screen.getByRole("button", { name: "View" }));
    await screen.findByText("Persisted record");
    await userEvent.click(
      screen.getByRole("button", { name: "Download JSON" }),
    );
    expect(mocks.detail).toHaveBeenCalledWith("r1");
    expect(url).toHaveBeenCalled();
    expect(click).toHaveBeenCalled();
    await waitFor(() => expect(revoke).toHaveBeenCalledWith("blob:test"), {
      timeout: 2000,
    });
    click.mockRestore();
    vi.unstubAllGlobals();
  });
  it("shows author attribution and hides editing for other authors", async () => {
    mocks.list.mockResolvedValue({
      items: [
        {
          id: "h1",
          title: "Doctor note",
          category: "visit",
          date: "2025-01-02",
          details: "Visit details",
          recordedBy: "doctor1",
          authorRole: "DOCTOR",
        },
      ],
      totalPages: 1,
    });
    setup();
    await screen.findByText("Doctor note");
    expect(screen.getByText(/Recorded by/)).toHaveTextContent("DOCTOR");
    expect(
      screen.queryByRole("button", { name: "Edit" }),
    ).not.toBeInTheDocument();
  });
  it("surfaces save failures without discarding entered details", async () => {
    mocks.save.mockRejectedValue(new Error("Database unavailable"));
    setup();
    await userEvent.click(screen.getByRole("button", { name: "Add record" }));
    const d = within(screen.getByRole("dialog"));
    await userEvent.type(d.getByLabelText("Title"), "Result");
    fireEvent.change(d.getByLabelText("Record date"), {
      target: { value: "2025-01-02" },
    });
    await userEvent.type(d.getByLabelText("Details"), "Keep this note");
    await userEvent.click(d.getByRole("button", { name: "Save record" }));
    await waitFor(() =>
      expect(d.getByRole("alert")).toHaveTextContent("Database unavailable"),
    );
    expect(d.getByLabelText("Details")).toHaveValue("Keep this note");
  });
  it("renders empty and truncated report sections transparently", () => {
    render(
      <ReportContent
        label={(k) => k}
        data={{
          sections: {
            healthRecords: {
              items: [],
              total: 101,
              included: 100,
              truncated: true,
            },
            pregnancy: null,
          },
        }}
      />,
    );
    expect(screen.getByText(/truncated/)).toBeInTheDocument();
    expect(screen.getAllByText("no_data")).toHaveLength(2);
  });
});
