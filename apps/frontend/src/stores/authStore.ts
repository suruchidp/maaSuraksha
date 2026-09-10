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
        set({ user, token, isAuthenticated: true });
      },
      setUser: (user) => set({ user }),
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
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);