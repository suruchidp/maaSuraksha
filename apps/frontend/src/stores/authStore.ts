import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Language, UserRole } from "@maasuraksha/shared";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  language: Language;
  phone?: string;
  assignedASHA?: string;
  assignedDoctor?: string;
  isActive: boolean;
  createdAt?: string;
}

export const normalizeUserRole = (role?: string | null): UserRole => {
  const value = role?.toString().trim().toUpperCase().replace(/[-\s]+/g, "_");

  if (["ASHA", "ASHA_WORKER", "ASHAWORKER", "AWW", "ASHA_WORKER_ROLE"].includes(value ?? "")) {
    return UserRole.ASHA;
  }
  if (["DOCTOR", "DOCTOR_WORKER", "DOCTORWORKER", "PHYSICIAN", "MEDICAL_OFFICER"].includes(value ?? "")) {
    return UserRole.DOCTOR;
  }
  if (["ADMIN", "ADMINISTRATOR", "SYSTEM_ADMIN"].includes(value ?? "")) {
    return UserRole.ADMIN;
  }
  if (["PATIENT", "USER", "MOTHER", "BENEFICIARY"].includes(value ?? "")) {
    return UserRole.PATIENT;
  }

  return UserRole.PATIENT;
};

interface AuthState {
  user: SessionUser | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: SessionUser, token: string) => void;
  setUser: (user: SessionUser) => void;
  logout: () => void;
  updateLanguage: (language: Language) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setAuth: (user, token) => {
        const normalizedUser = { ...user, role: normalizeUserRole(user.role) };
        set({ user: normalizedUser, token, isAuthenticated: true });
      },
      setUser: (user) => set({ user: { ...user, role: normalizeUserRole(user.role) } }),
      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
      },
      updateLanguage: (language) =>
        set((state) => ({
          user: state.user ? { ...state.user, language } : null,
        })),
    }),
    {
      name: "maasuraksha-auth",
      version: 2,
      migrate: (persistedState: unknown) => {
        const state = persistedState as {
          user?: Partial<SessionUser> | null;
          token?: string | null;
          isAuthenticated?: boolean;
        };

        if (state?.user) {
          state.user.role = normalizeUserRole(state.user.role as string | undefined);
        }

        if (state?.token && state.user) {
          state.isAuthenticated = true;
        } else {
          state.isAuthenticated = false;
        }

        return state;
      },
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);