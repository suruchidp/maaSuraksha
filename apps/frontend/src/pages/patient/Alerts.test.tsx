import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AlertsPage from "./Alerts";

const mocks = vi.hoisted(() => ({ query: vi.fn(), mutation: vi.fn(), mutate: vi.fn(), reset: vi.fn(), read: vi.fn() }));
vi.mock("@/hooks/queries", () => ({ useReadAlert: () => ({ mutate: mocks.read }), useAlerts: mocks.query, useUpdateAlertStatus: mocks.mutation }));
vi.mock("@/hooks/useAuth", () => ({ useCurrentLanguage: () => "en" }));
const alert = { type: "follow_up", id: "a1", title: "Care team reminder", message: "Review your care plan.", status: "pending", severity: "info", createdAt: "2026-09-17T08:00:00Z" };
let query: Record<string, unknown>;
let mutation: Record<string, unknown>;
beforeEach(() => {
  vi.clearAllMocks();
  query = { data: { items: [alert], total: 21, totalPages: 2 }, refetch: vi.fn() };
  mutation = { mutate: mocks.mutate, reset: mocks.reset };
  mocks.query.mockImplementation(() => query);
  mocks.mutation.mockImplementation(() => mutation);
});
describe("Alerts", () => {
  it("marks an alert as read independently of acknowledgment", async () => {
    render(<AlertsPage />);
    await userEvent.click(screen.getByRole("button", { name: "Mark as read" }));
    expect(mocks.read).toHaveBeenCalledWith("a1", expect.any(Object));
    expect(mocks.mutate).not.toHaveBeenCalled();
  });
  it("shows a retry action when alert loading fails", async () => {
    query.isError = true;
    query.error = new Error("Connection unavailable");
    render(<AlertsPage />);
    expect(screen.getByText("Connection unavailable")).toBeInTheDocument();
    expect(screen.queryByText("No alerts")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(query.refetch).toHaveBeenCalled();
  });
  it("shows the page heading and sends acknowledgment for the selected alert", async () => {
    render(<AlertsPage />);
    expect(screen.getByRole("heading", { name: "Alerts & Reminders" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Acknowledge" }));
    expect(mocks.mutate).toHaveBeenCalledWith({ id: "a1", status: "acknowledged" }, expect.any(Object));
  });
  it("requests the next page and resets pagination when filtering", async () => {
    render(<AlertsPage />);
    await userEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(mocks.query).toHaveBeenLastCalledWith(undefined, 20, 2, undefined);
    await userEvent.click(screen.getByRole("button", { name: "Pending" }));
    expect(mocks.query).toHaveBeenLastCalledWith(undefined, 20, 1, "pending");
  });
  it("shows an empty state and no acknowledgment action when no records exist", () => {
    query.data = { items: [], total: 0, totalPages: 0 };
    render(<AlertsPage />);
    expect(screen.getByText("No alerts")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Acknowledge" })).not.toBeInTheDocument();
  });
  it("reports mutation failure and keeps the action available for retry", () => {
    mutation.isError = true;
    render(<AlertsPage />);
    expect(screen.getByRole("alert")).toHaveTextContent("Could not acknowledge");
    expect(screen.getByRole("button", { name: "Acknowledge" })).toBeEnabled();
  });
  it("disables acknowledgment while saving", () => {
    mutation.isPending = true;
    mutation.variables = { id: "a1" };
    render(<AlertsPage />);
    expect(screen.getByRole("button", { name: "Acknowledging…" })).toBeDisabled();
  });
});
