import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AppointmentsPage from "./Appointments";
const mocks = vi.hoisted(() => ({ create: vi.fn(), update: vi.fn(), reset: vi.fn(), list: vi.fn(), schedule: vi.fn(), user: { id: "p1", role: "PATIENT" } }));
vi.mock("@/hooks/queries", () => ({ useAppointments: mocks.list, useRescheduleAppointment: () => ({ mutate: mocks.schedule, reset: mocks.reset }), useCreateAppointment: () => ({ mutate: mocks.create }), useUpdateAppointmentStatus: () => ({ mutate: mocks.update, reset: mocks.reset }) }));
vi.mock("@/stores/authStore", () => ({ useAuthStore: (select: Function) => select({ user: mocks.user }) }));
vi.mock("@/hooks/useAuth", () => ({ useCurrentLanguage: () => "en" }));
beforeEach(() => {
 vi.clearAllMocks();
 mocks.user.role = "PATIENT";
 mocks.list.mockReturnValue({ data: { items: [], totalPages: 0 }, refetch: vi.fn() });
});
describe("Appointments page", () => {
 it("submits booking without requiring hidden patient fields", async () => {
  render(<AppointmentsPage />);
  await userEvent.click(screen.getByRole("button", { name: "Book" }));
  await waitFor(() => expect(mocks.create).toHaveBeenCalled());
  expect(mocks.create.mock.calls[0][0]).toMatchObject({ patient: "p1", type: "antenatal", time: "10:00" });
 });
 it("clears booking notes after a successful save", async () => {
  mocks.create.mockImplementationOnce((_input, options) => options.onSuccess());
  render(<AppointmentsPage />);
  await userEvent.type(screen.getByLabelText('Notes'), 'Synthetic booking note');
  await userEvent.click(screen.getByRole('button', { name: 'Book' }));
  await waitFor(() => expect(screen.getByLabelText('Notes')).toHaveValue(''));
 });
 it("allows cancellation of a scheduled appointment through confirmation", async () => {
  mocks.list.mockReturnValue({ data: { items: [{ id: "a1", date: "2099-10-01", time: "10:00", type: "antenatal", status: "scheduled" }], totalPages: 1 } });
  render(<AppointmentsPage />);
  await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
  await userEvent.click(within(screen.getByRole("dialog")).getAllByRole("button", { name: "Cancel" })[1]!);
  expect(mocks.update).toHaveBeenCalledWith({ id: "a1", status: "cancelled", reason: "cancelled_by_patient" }, expect.any(Object));
 });
 it("filters upcoming/history and resets pagination when changing status", async () => {
  mocks.list.mockReturnValue({ data: { items: [], totalPages: 2 } });
  render(<AppointmentsPage />);
  await userEvent.click(screen.getByRole('button', { name: 'Next' }));
  expect(mocks.list).toHaveBeenLastCalledWith('p1', 20, 2, 'upcoming', undefined);
  await userEvent.click(screen.getByRole('button', { name: 'Past & history' }));
  expect(mocks.list).toHaveBeenLastCalledWith('p1', 20, 1, 'past', undefined);
  await userEvent.selectOptions(screen.getByLabelText('Filter by appointment status'), 'cancelled');
  expect(mocks.list).toHaveBeenLastCalledWith('p1', 20, 1, 'past', 'cancelled');
 });
 it("shows assignment names and reschedules with a reconfirmation explanation", async () => {
  mocks.list.mockReturnValue({ data: { items: [{ id: 'a1', date: '2099-10-01', time: '10:00', type: 'antenatal', status: 'confirmed', doctorName: 'Doctor Test', ashaName: 'ASHA Test' }], totalPages: 1 } });
  render(<AppointmentsPage />);
  expect(screen.getByText(/Doctor Test/)).toHaveTextContent('ASHA Test');
  await userEvent.click(screen.getByRole('button', { name: 'Reschedule' }));
  const dialog = within(screen.getByRole('dialog'));
  expect(dialog.getByText(/requires care-team confirmation/)).toBeInTheDocument();
  fireEvent.change(dialog.getByLabelText('Date'), { target: { value: '2099-10-02' } });
  fireEvent.change(dialog.getByLabelText('Time'), { target: { value: '11:30' } });
  await userEvent.click(dialog.getByRole('button', { name: 'Save new time' }));
  expect(mocks.schedule).toHaveBeenCalledWith({ id: 'a1', date: '2099-10-02', time: '11:30' }, expect.any(Object));
 });
 it("offers care-team confirmation and books for the selected patient", async () => {
  mocks.user.role = 'DOCTOR';
  mocks.list.mockReturnValue({ data: { items: [{ id: 'a1', date: '2099-10-01', time: '10:00', type: 'antenatal', status: 'scheduled' }], totalPages: 1 } });
  render(<AppointmentsPage patientId="patient2" />);
  await userEvent.click(screen.getByRole('button', { name: 'Confirm' }));
  expect(mocks.update).toHaveBeenCalledWith({ id: 'a1', status: 'confirmed' }, expect.any(Object));
  await userEvent.click(screen.getByRole('button', { name: 'Book' }));
  await waitFor(() => expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({ patient: 'patient2' }), expect.any(Object)));
  expect(screen.queryByRole('button', { name: 'Complete' })).not.toBeInTheDocument();
 });
 it("hides patient modification actions for past appointments", () => {
  mocks.list.mockReturnValue({ data: { items: [{ id: 'a1', date: '2000-01-01', time: '10:00', type: 'antenatal', status: 'confirmed' }], totalPages: 1 } });
  render(<AppointmentsPage />);
  expect(screen.queryByRole('button', { name: 'Reschedule' })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Confirm' })).not.toBeInTheDocument();
 });
});
