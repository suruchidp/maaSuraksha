import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AdminAuditLogsPage from "./AuditLogs";

const mocks = vi.hoisted(() => ({ logs: vi.fn(), refetch: vi.fn() }));
vi.mock("@/hooks/queries", () => ({ useAuditLogs: mocks.logs }));

const items = [
  {
    id: "l1",
    actor: { id: "u1", name: "Dr Mehta", email: "dr@example.com", role: "DOCTOR" },
    action: "UPDATE_USER_STATUS",
    resource: "user",
    resourceId: "u9",
    createdAt: "2026-09-01T00:00:00.000Z",
    updatedAt: "2026-09-01T00:00:00.000Z",
  },
  {
    id: "l2",
    actor: null,
    action: "CREATE_EDUCATIONAL_CONTENT",
    resource: "education",
    createdAt: "2026-09-02T00:00:00.000Z",
    updatedAt: "2026-09-02T00:00:00.000Z",
  },
  {
    id: "l3",
    actor: { id: "u2", name: "Sita Devi", email: "sita@example.com", role: "PATIENT" },
    action: "LOGIN",
    resource: "auth",
    createdAt: "2026-09-03T00:00:00.000Z",
    updatedAt: "2026-09-03T00:00:00.000Z",
  },
];

describe("Admin audit logs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.logs.mockReturnValue({ isLoading: false, isError: false, data: { items } });
  });

  it("shows the loading state while awaiting the trail", () => {
    mocks.logs.mockReturnValue({ isLoading: true });
    render(<AdminAuditLogsPage />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("renders the audit trail with actor names and fallback for system actors", () => {
    render(<AdminAuditLogsPage />);
    expect(screen.getByRole("heading", { name: "Audit Logs" })).toBeInTheDocument();
    expect(screen.getByText("Dr Mehta (Doctor)")).toBeInTheDocument();
    expect(screen.getByText("Sita Devi (Patient)")).toBeInTheDocument();
    expect(screen.getByText("System")).toBeInTheDocument();
    expect(screen.getByText("UPDATE_USER_STATUS")).toBeInTheDocument();
    expect(screen.getByText("CREATE_EDUCATIONAL_CONTENT")).toBeInTheDocument();
    expect(screen.getByText("u9")).toBeInTheDocument();
  });

  it("renders an em-dash placeholder when a resource id is absent", () => {
    render(<AdminAuditLogsPage />);
    const dashes = screen.getAllByText("—");
    expect(dashes.length).toBeGreaterThanOrEqual(1);
  });

  it("shows the empty state when there is no activity", () => {
    mocks.logs.mockReturnValue({ isLoading: false, isError: false, data: { items: [] } });
    render(<AdminAuditLogsPage />);
    expect(screen.getByText("No audit logs yet")).toBeInTheDocument();
  });

  it("offers retry when the trail cannot be loaded", async () => {
    mocks.logs.mockReturnValue({ isLoading: false, isError: true, error: new Error("Trail unavailable"), refetch: mocks.refetch });
    render(<AdminAuditLogsPage />);
    expect(screen.getByText("Trail unavailable")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(mocks.refetch).toHaveBeenCalled();
  });
});