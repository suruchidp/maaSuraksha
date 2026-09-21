import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AdminUsersPage from "./Users";

const mocks = vi.hoisted(() => ({ users: vi.fn(), create: vi.fn(), update: vi.fn() }));
vi.mock("@/hooks/queries", () => ({
  useAdminUsers: (params?: Record<string, unknown>) => mocks.users(params),
  useCreateAdminUser: () => ({ mutate: mocks.create, isPending: false }),
  useUpdateAdminUser: () => ({ mutate: mocks.update }),
}));

const base = {
  phone: "+91 90000 00000",
  language: "EN",
  updatedAt: "2026-09-01T00:00:00.000Z",
};
const asha = { ...base, id: "a1", name: "Asha Rai", email: "asha@example.com", role: "ASHA", isActive: true, createdAt: "2026-09-01T00:00:00.000Z" };
const doctor = { ...base, id: "d1", name: "Dr Mehta", email: "dr@example.com", role: "DOCTOR", isActive: true, createdAt: "2026-09-02T00:00:00.000Z" };
const patient = { ...base, id: "p1", name: "Sita Devi", email: "sita@example.com", role: "PATIENT", isActive: false, assignedASHA: "a1", assignedDoctor: "d1", createdAt: "2026-09-03T00:00:00.000Z" };

const page = (items: unknown[]) => ({ data: { items, total: items.length, totalPages: 1, page: 1, limit: 100 }, isLoading: false, isError: false });

function defaultMocks() {
  mocks.users.mockImplementation((params?: Record<string, unknown>) => {
    if (params?.role === "ASHA") return page([asha]);
    if (params?.role === "DOCTOR") return page([doctor]);
    return page([asha, doctor, patient]);
  });
}

describe("Admin user management", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    defaultMocks();
  });

  it("lists users with role and status badges", () => {
    render(<AdminUsersPage />);
    expect(screen.getByRole("heading", { name: "User Management" })).toBeInTheDocument();
    expect(screen.getByText("Asha Rai")).toBeInTheDocument();
    expect(screen.getByText("Dr Mehta")).toBeInTheDocument();
    expect(screen.getByText("Sita Devi")).toBeInTheDocument();
    expect(screen.getAllByText("Active").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("Inactive")).toBeInTheDocument();
  });

  it("shows proper native language labels in the create form", () => {
    render(<AdminUsersPage />);
    expect(screen.getByRole("option", { name: "English" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "हिन्दी" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "ಕನ್ನಡ" })).toBeInTheDocument();
    expect(screen.queryByText("à¤¹à¤¿à¤¨à¥  à¤¦à¥€")).not.toBeInTheDocument();
  });

  it("filters the table by role", async () => {
    render(<AdminUsersPage />);
    await userEvent.click(screen.getByRole("button", { name: "ASHA Worker" }));
    expect(screen.getByText("Asha Rai")).toBeInTheDocument();
    expect(screen.queryByText("Dr Mehta")).not.toBeInTheDocument();
  });

  it("creates a user through the validated form", async () => {
    render(<AdminUsersPage />);
    await userEvent.type(screen.getByLabelText(/Full Name/), "New User");
    await userEvent.type(screen.getByLabelText(/Email/), "new@example.com");
    await userEvent.type(screen.getByLabelText(/Password/), "Passw0rd1");
    await userEvent.click(screen.getByRole("button", { name: "Create user" }));
    expect(mocks.create).toHaveBeenCalledWith(
      expect.objectContaining({ name: "New User", email: "new@example.com", role: "PATIENT", language: "en" }),
      expect.any(Object)
    );
  });

  it("updates status and assignments from the edit modal", async () => {
    render(<AdminUsersPage />);
    await userEvent.click(screen.getAllByRole("button", { name: "Edit" })[2]);
    expect(screen.getByText("Edit: Sita Devi")).toBeInTheDocument();
    await userEvent.selectOptions(screen.getByLabelText("Status"), "1");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(mocks.update).toHaveBeenCalledWith(
      { id: "p1", patch: expect.objectContaining({ role: "PATIENT", isActive: true, assignedASHA: "a1", assignedDoctor: "d1" }) },
      expect.any(Object)
    );
  });
});