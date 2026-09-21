import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import RegisterPage from "./RegisterPage";
import { useAuthStore } from "@/stores/authStore";
import { useToastStore } from "@/stores/toastStore";
import { UserRole, Language } from "@maasuraksha/shared";

const mocks = vi.hoisted(() => ({ register: vi.fn() }));
vi.mock("@/services/auth", () => ({ register: mocks.register }));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const labels: Record<string, string> = {
        "app.name": "MaaSuraksha",
        "auth.registerTitle": "Create Account",
        "auth.name": "Full name",
        "auth.email": "Email",
        "auth.password": "Password",
        "auth.passwordHint": "8+ characters",
        "auth.phone": "Phone",
        "auth.role": "Role",
        "auth.language": "Language",
        "roles.PATIENT": "Patient",
        "roles.ASHA": "ASHA Worker",
        "roles.DOCTOR": "Doctor",
        "auth.registerButton": "Create Account",
        "auth.hasAccount": "Already have an account?",
        "auth.loginLink": "Sign in",
        "auth.registerSuccess": "Account created.",
      };
      return labels[key] ?? key;
    },
    i18n: {
      resolvedLanguage: "en",
      language: "en",
      changeLanguage: vi.fn(),
    },
  }),
}));

function makeClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, refetchOnWindowFocus: false },
      mutations: { retry: false },
    },
  });
}

function resetState() {
  useAuthStore.setState({
    user: null,
    token: null,
    isAuthenticated: false,
  });
  useToastStore.setState({ toasts: [] });
}

describe("RegisterPage hook order (StrictMode)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetState();
  });

  it("keeps a stable hook count when a session appears mid-render", () => {
    const errors: string[] = [];
    const originalError = console.error;
    console.error = (...args: unknown[]) => {
      const msg = String(args[0] ?? "");
      if (
        msg.includes("Rendered fewer hooks") ||
        msg.includes("Rendered more hooks")
      ) {
        errors.push(msg);
      }
      originalError(...args);
    };

    render(
      <React.StrictMode>
        <QueryClientProvider client={makeClient()}>
          <MemoryRouter initialEntries={["/register"]}>
            <RegisterPage />
          </MemoryRouter>
        </QueryClientProvider>
      </React.StrictMode>
    );

    expect(
      screen.getByRole("heading", { name: "Create Account" })
    ).toBeInTheDocument();

    act(() => {
      useAuthStore.setState({
        user: {
          id: "u1",
          name: "Aisha",
          email: "a@e.com",
          role: UserRole.PATIENT,
          language: Language.EN,
          isActive: true,
        },
        token: "tok",
        isAuthenticated: true,
      });
    });

    expect(
      screen.queryByRole("heading", { name: "Create Account" })
    ).not.toBeInTheDocument();

    console.error = originalError;
    expect(errors).toEqual([]);
  });

  it("surfaces a duplicate-email 409 to the user via toast", async () => {
    mocks.register.mockRejectedValueOnce({
      response: {
        status: 409,
        data: {
          error: { message: "An account with this email already exists" },
        },
      },
    });

    render(
      <React.StrictMode>
        <QueryClientProvider client={makeClient()}>
          <MemoryRouter initialEntries={["/register"]}>
            <RegisterPage />
          </MemoryRouter>
        </QueryClientProvider>
      </React.StrictMode>
    );

    await userEvent.type(screen.getByLabelText(/Full name/), "Aisha");
    await userEvent.type(screen.getByLabelText(/Email/), "a@e.com");
    await userEvent.type(screen.getByLabelText(/Password/), "SyntheticQA123!");
    await userEvent.click(screen.getByRole("button", { name: "Create Account" }));

    await waitFor(() => {
      expect(
        useToastStore.getState().toasts.some(
          (toast) =>
            toast.variant === "error" &&
            toast.message === "An account with this email already exists"
        )
      ).toBe(true);
    });

    expect(
      screen.getByRole("button", { name: "Create Account" })
    ).toBeEnabled();
  });
});