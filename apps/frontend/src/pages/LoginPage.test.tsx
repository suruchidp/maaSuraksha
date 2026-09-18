import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import LoginPage from "./LoginPage";
const mocks = vi.hoisted(() => ({ login: vi.fn(), setAuth: vi.fn() }));
vi.mock("@/services/auth", () => ({ login: mocks.login }));
vi.mock("@/stores/authStore", () => ({ useAuthStore: (select: (s: unknown) => unknown) => select({ isAuthenticated: true, user: { id: 'stale', role: 'PATIENT' }, setAuth: mocks.setAuth }) }));
function showLogin() { render(<QueryClientProvider client={new QueryClient({ defaultOptions: { mutations: { retry: false } } })}><MemoryRouter initialEntries={['/login']}><LoginPage /></MemoryRouter></QueryClientProvider>); }
beforeEach(() => vi.clearAllMocks());
describe('Login recovery', () => {
 it('opens the sign-in form even when a previous session is saved', () => {
  showLogin();
  expect(screen.getByRole('heading', { name: 'Sign In' })).toBeInTheDocument();
  expect(screen.getByLabelText('Email')).toBeInTheDocument();
 });
 it('shows sign-in failures and leaves the form available for retry', async () => {
  mocks.login.mockRejectedValueOnce(new Error('Sign-in service is unavailable'));
  showLogin();
  await userEvent.type(screen.getByLabelText('Email'), 'synthetic@example.com');
  await userEvent.type(screen.getByLabelText('Password'), 'SyntheticQA123!');
  await userEvent.click(screen.getByRole('button', { name: 'Sign In' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Sign-in service is unavailable');
  expect(screen.getByRole('button', { name: 'Sign In' })).toBeEnabled();
 });
});
