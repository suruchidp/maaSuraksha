import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import HomeVisitsPage from "./HomeVisits";

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  list: vi.fn(),
  request: { mutate: vi.fn() } as { mutate: (...args: unknown[]) => unknown; isError?: boolean; error?: Error },
  user: { id: "p1", role: "PATIENT" as const },
}));
vi.mock("@/hooks/queries", () => ({
  useHomeVisits: mocks.list,
  useRequestHomeVisit: () => mocks.request,
}));
vi.mock("@/stores/authStore", () => ({ useAuthStore: (select: Function) => select({ user: mocks.user }) }));
vi.mock("@/hooks/useAuth", () => ({ useCurrentLanguage: () => "en" }));
beforeEach(() => {
  vi.clearAllMocks();
  mocks.user.role = "PATIENT";
  mocks.request = { mutate: mocks.create };
  mocks.list.mockReturnValue({ data: { items: [], totalPages: 0 }, refetch: vi.fn() });
});
describe("Home Visits page", () => {
  it("submits a request for the signed-in patient only", async () => {
    mocks.create.mockImplementationOnce((_input, options) => options.onSuccess());
    render(<HomeVisitsPage />);
    await userEvent.type(screen.getByLabelText(/Reason for the visit/), "Feeling weak, need a check-up");
    await userEvent.click(screen.getByRole("button", { name: "Request home visit" }));
    await waitFor(() => expect(mocks.create).toHaveBeenCalled());
    expect(mocks.create.mock.calls[0][0]).toMatchObject({
      patient: "p1",
      reason: "Feeling weak, need a check-up",
      preferredTime: "10:00",
    });
    expect(mocks.create.mock.calls[0][0].preferredDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("requires a reason before submitting", async () => {
    render(<HomeVisitsPage />);
    await userEvent.click(screen.getByRole("button", { name: "Request home visit" }));
    expect(await screen.findByText("This field is required")).toBeInTheDocument();
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("lists existing requests with their status", () => {
    mocks.list.mockReturnValue({
      data: {
        items: [{ _id: "v1", patient: "p1", requestedBy: "p1", reason: "Post-delivery care", preferredDate: "2099-10-01", preferredTime: "11:00", status: "pending" }],
        totalPages: 1,
      },
    });
    render(<HomeVisitsPage />);
    expect(screen.getByText("Post-delivery care")).toBeInTheDocument();
    expect(screen.getByText("1 Oct 2099 · 11:00 · India time (IST)")).toBeInTheDocument();
    expect(screen.getByText("Pending")).toBeInTheDocument();
  });

  it("shows an empty state when there are no requests", () => {
    render(<HomeVisitsPage />);
    expect(screen.getByText("No home visit requests")).toBeInTheDocument();
  });

  it("surfaces API errors from the submit", async () => {
    mocks.request = { mutate: mocks.create, isError: true, error: new Error("Visit request failed") };
    render(<HomeVisitsPage />);
    await userEvent.type(screen.getByLabelText(/Reason for the visit/), "Follow-up needed");
    await userEvent.click(screen.getByRole("button", { name: "Request home visit" }));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Visit request failed"));
  });
});