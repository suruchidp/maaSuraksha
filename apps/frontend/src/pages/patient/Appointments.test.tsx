import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AppointmentsPage from "./Appointments";
const mocks = vi.hoisted(() => ({ create: vi.fn(), update: vi.fn(), reset: vi.fn(), list: vi.fn() }));
vi.mock("@/hooks/queries", () => ({ useAppointments: mocks.list, useCreateAppointment: () => ({ mutate: mocks.create }), useUpdateAppointmentStatus: () => ({ mutate: mocks.update, reset: mocks.reset }) }));
vi.mock("@/stores/authStore", () => ({ useAuthStore: (select: Function) => select({ user: { id: "p1" } }) }));
vi.mock("@/hooks/useAuth", () => ({ useCurrentLanguage: () => "en" }));
beforeEach(() => {
 vi.clearAllMocks();
 mocks.list.mockReturnValue({ data: { items: [], totalPages: 0 }, refetch: vi.fn() });
});
describe("Appointments page", () => {
 it("submits booking without requiring hidden patient fields", async () => {
  render(<AppointmentsPage />);
  await userEvent.click(screen.getByRole("button", { name: "Book" }));
  await waitFor(() => expect(mocks.create).toHaveBeenCalled());
  expect(mocks.create.mock.calls[0][0]).toMatchObject({ patient: "p1", type: "antenatal", time: "10:00" });
 });
 it("allows cancellation of a scheduled appointment through confirmation", async () => {
  mocks.list.mockReturnValue({ data: { items: [{ id: "a1", date: "2099-10-01", time: "10:00", type: "antenatal", status: "scheduled" }], totalPages: 1 } });
  render(<AppointmentsPage />);
  await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
  await userEvent.click(within(screen.getByRole("dialog")).getAllByRole("button", { name: "Cancel" })[1]!);
  expect(mocks.update).toHaveBeenCalledWith({ id: "a1", status: "cancelled", reason: "cancelled_by_patient" }, expect.any(Object));
 });
});
