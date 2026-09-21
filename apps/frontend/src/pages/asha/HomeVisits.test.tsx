import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { ASHAHomeVisitsPage } from "./Sections";

const mocks = vi.hoisted(() => ({
  list: vi.fn(),
  schedule: { mutate: vi.fn(), isPending: false },
  complete: { mutate: vi.fn(), isPending: false },
  cancel: { mutate: vi.fn(), isPending: false },
  escalate: { mutate: vi.fn(), isPending: false },
}));

vi.mock("@/hooks/queries", () => ({
  useHomeVisits: mocks.list,
  useScheduleHomeVisit: () => mocks.schedule,
  useCompleteHomeVisit: () => mocks.complete,
  useCancelHomeVisit: () => mocks.cancel,
  useEscalateHomeVisit: () => mocks.escalate,
}));

vi.mock("@/hooks/useAuth", () => ({ useCurrentLanguage: () => "en" }));

function visit(overrides: Record<string, unknown> = {}) {
  return {
    _id: "v1",
    patient: "p1",
    patientName: "Navya Kulkarni",
    requestedBy: "p1",
    reason: "Post-delivery care",
    preferredDate: "2099-10-01",
    preferredTime: "11:00",
    status: "pending",
    ...overrides,
  };
}

function renderPage() {
  return render(
    <MemoryRouter>
      <ASHAHomeVisitsPage />
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.schedule = { mutate: vi.fn(), isPending: false };
  mocks.complete = { mutate: vi.fn(), isPending: false };
  mocks.cancel = { mutate: vi.fn(), isPending: false };
  mocks.escalate = { mutate: vi.fn(), isPending: false };
  mocks.list.mockReturnValue({ data: { items: [], totalPages: 0 }, refetch: vi.fn() });
});

describe("ASHA Home Visits page", () => {
  it("lists home visit requests from the assigned women with the required details", () => {
    mocks.list.mockReturnValue({
      data: { items: [visit()], totalPages: 1 },
      refetch: vi.fn(),
    });
    renderPage();
    expect(screen.getByText("Navya Kulkarni")).toBeInTheDocument();
    expect(screen.getByText("Post-delivery care")).toBeInTheDocument();
    expect(screen.getByText(/1 Oct 2099/)).toBeInTheDocument();
    expect(screen.getByText(/11:00/)).toBeInTheDocument();
    expect(screen.getByText("Pending")).toBeInTheDocument();
  });

  it("does not offer a 'request home visit' form to the ASHA", () => {
    renderPage();
    expect(screen.queryByRole("button", { name: "Request home visit" })).toBeNull();
    expect(screen.queryByLabelText(/Reason for the visit/)).toBeNull();
  });

  it("shows an empty state when no requests exist", () => {
    renderPage();
    expect(screen.getByText("No home visit requests")).toBeInTheDocument();
  });

  it("schedules a pending visit with the chosen date and time", async () => {
    mocks.list.mockReturnValue({
      data: { items: [visit()], totalPages: 1 },
      refetch: vi.fn(),
    });
    renderPage();
    await userEvent.click(screen.getByRole("button", { name: "Schedule" }));
    await userEvent.click(screen.getByRole("button", { name: "Confirm schedule" }));
    expect(mocks.schedule.mutate).toHaveBeenCalledTimes(1);
    const payload = mocks.schedule.mutate.mock.calls[0][0] as Record<string, string>;
    expect(payload.visitId).toBe("v1");
    expect(payload.scheduledTime).toBe("10:00");
    expect(payload.scheduledDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("cancels a visit with a required reason", async () => {
    mocks.list.mockReturnValue({
      data: { items: [visit()], totalPages: 1 },
      refetch: vi.fn(),
    });
    renderPage();
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    await userEvent.type(screen.getByLabelText(/Cancellation reason/), "Unavailable");
    await userEvent.click(screen.getByRole("button", { name: "Confirm cancellation" }));
    expect(mocks.cancel.mutate).toHaveBeenCalledTimes(1);
    expect(mocks.cancel.mutate.mock.calls[0][0]).toEqual({
      visitId: "v1",
      cancelledReason: "Unavailable",
    });
  });

  it("completes a scheduled visit with optional notes", async () => {
    mocks.list.mockReturnValue({
      data: { items: [visit({ status: "scheduled" })], totalPages: 1 },
      refetch: vi.fn(),
    });
    renderPage();
    await userEvent.click(screen.getByRole("button", { name: "Complete" }));
    await userEvent.type(screen.getByLabelText(/Visit notes/), "Nebulisation provided");
    await userEvent.click(screen.getByRole("button", { name: "Confirm completion" }));
    expect(mocks.complete.mutate).toHaveBeenCalledTimes(1);
    expect(mocks.complete.mutate.mock.calls[0][0]).toEqual({
      visitId: "v1",
      visitNotes: "Nebulisation provided",
      followUpNeeded: false,
    });
  });

  it("escalates a visit to a referral with a required reason", async () => {
    mocks.list.mockReturnValue({
      data: { items: [visit()], totalPages: 1 },
      refetch: vi.fn(),
    });
    renderPage();
    await userEvent.click(screen.getByRole("button", { name: "Escalate" }));
    await userEvent.type(screen.getByLabelText(/Escalation reason/), "Needs specialist assessment");
    await userEvent.click(screen.getByRole("button", { name: "Confirm escalation" }));
    expect(mocks.escalate.mutate).toHaveBeenCalledTimes(1);
    expect(mocks.escalate.mutate.mock.calls[0][0]).toEqual({
      visitId: "v1",
      reason: "Needs specialist assessment",
    });
  });
});