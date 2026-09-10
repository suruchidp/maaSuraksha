import { create } from "zustand";

export type ToastVariant = "success" | "error" | "info" | "warning";

export interface ToastMessage {
  id: string;
  variant: ToastVariant;
  message: string;
}

interface ToastState {
  toasts: ToastMessage[];
  push: (message: string, variant?: ToastVariant) => void;
  dismiss: (id: string) => void;
}

let counter = 0;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (message, variant = "info") => {
    const id = `toast-${++counter}-${Date.now()}`;
    set((state) => ({ toasts: [...state.toasts, { id, message, variant }] }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 5000);
  },
  dismiss: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));