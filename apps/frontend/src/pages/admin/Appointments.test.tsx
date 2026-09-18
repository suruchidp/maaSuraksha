import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AdminAppointmentsPage from "./Appointments";
const mocks = vi.hoisted(() => ({ patients: vi.fn(), retry: vi.fn() }));
vi.mock("@/hooks/queries", () => ({ usePatients: mocks.patients }));
vi.mock("@/pages/patient/Appointments", () => ({ default: ({ patientId }: { patientId: string }) => <p>Appointments for {patientId}</p> }));
beforeEach(() => { vi.clearAllMocks(); mocks.patients.mockReturnValue({ data: { items: [{ id: 'p1', name: 'Synthetic Patient' }] } }); });
describe('Admin appointments', () => {
 it('selects a patient before presenting the booking and status controls', async () => {
  render(<AdminAppointmentsPage />);
  expect(screen.queryByText('Appointments for p1')).not.toBeInTheDocument();
  await userEvent.selectOptions(screen.getByLabelText('Choose patient'), 'p1');
  expect(screen.getByText('Appointments for p1')).toBeInTheDocument();
  await userEvent.type(screen.getByLabelText('Search patients'), 'Synthetic');
  expect(mocks.patients).toHaveBeenLastCalledWith('Synthetic', 100);
 });
 it('offers retry when patient lookup fails', async () => {
  mocks.patients.mockReturnValue({ isError: true, error: new Error('Lookup unavailable'), refetch: mocks.retry });
  render(<AdminAppointmentsPage />);
  expect(screen.getByText('Lookup unavailable')).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
  expect(mocks.retry).toHaveBeenCalled();
 });
});
