import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import userEvent from "@testing-library/user-event";
import Dashboard from "./Dashboard";
const mocks = vi.hoisted(() => ({ appointments: vi.fn(), retry: vi.fn() }));
vi.mock("@/hooks/queries", () => ({ usePregnancy: () => ({}), useHealthMetrics: () => ({ data: { items: [] } }), useAlerts: () => ({ data: { items: [] } }), useRecommendations: () => ({ data: { items: [] } }), useAppointments: mocks.appointments }));
vi.mock("@/hooks/useAuth", () => ({ useCurrentLanguage: () => 'en' }));
vi.mock("@/stores/authStore", () => ({ useAuthStore: (select: (s: unknown) => unknown) => select({ user: { id: 'p1', name: 'Synthetic Patient' } }) }));
vi.mock("@/components/patient/RecentAssessments", () => ({ RecentAssessments: () => null }));
beforeEach(() => { vi.clearAllMocks(); mocks.appointments.mockReturnValue({ data: { items: [{ id: 'a1', date: '2026-09-18', time: '17:46', type: 'antenatal', status: 'scheduled' }] } }); });
describe('Dashboard appointment integration', () => {
 it('requests active upcoming appointments and displays the calendar date with India time', () => {
  render(<MemoryRouter><Dashboard /></MemoryRouter>);
  expect(mocks.appointments).toHaveBeenCalledWith(undefined, 5, 1, 'upcoming');
  expect(screen.getByText('Antenatal checkup')).toBeInTheDocument();
  expect(screen.getByText(/17:46/)).toHaveTextContent('India time (IST)');
 });
 it('shows a retry action instead of an empty appointment list on failure', async () => {
  mocks.appointments.mockReturnValue({ isError: true, error: new Error('Appointments unavailable'), refetch: mocks.retry });
  render(<MemoryRouter><Dashboard /></MemoryRouter>);
  await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
  expect(mocks.retry).toHaveBeenCalled();
 });
});
