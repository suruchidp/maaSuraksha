import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useCreateHealthMetric } from "@/hooks/queries";
import { UserRole, Language } from "@maasuraksha/shared";

const { createHealthMetric } = vi.hoisted(() => ({
  createHealthMetric: vi.fn(),
}));

vi.mock("@/services/healthMetrics", () => ({
  createHealthMetric,
}));

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

const patient = {
  id: "user-1",
  name: "Anu",
  email: "anu@test.com",
  role: UserRole.PATIENT,
  language: Language.EN,
  isActive: true,
};

describe("useCreateHealthMetric", () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: patient,
      token: "token",
      isAuthenticated: true,
    });
    createHealthMetric.mockReset();
  });

  it("invalidates the patient's real health-metrics query key after a successful save", async () => {
    createHealthMetric.mockResolvedValue({
      id: "metric-1",
      user: "user-1",
      date: "2026-09-16T00:00:00.000Z",
      weight: 60,
      recordedBy: "user-1",
      createdAt: "2026-09-16T00:00:00.000Z",
      updatedAt: "2026-09-16T00:00:00.000Z",
    });

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    // Simulate the stale cache entry the Dashboard's useHealthMetrics(undefined, 5)
    // keeps for the signed-in patient.
    queryClient.setQueryData(["metrics", "user-1"], {
      items: [],
      total: 0,
      totalPages: 0,
      page: 1,
      limit: 5,
    });

    const { result } = renderHook(() => useCreateHealthMetric(), {
      wrapper: createWrapper(queryClient),
    });

    act(() => {
      result.current.mutate({ input: { weight: 60 }, userId: "user-1" });
    });

    await waitFor(() => {
      expect(queryClient.getQueryState(["metrics", "user-1"])?.isInvalidated).toBe(true);
    });
  });

  it("falls back to the signed-in patient id when no explicit userId is passed", async () => {
    createHealthMetric.mockResolvedValue({
      id: "metric-2",
      user: "user-1",
      date: "2026-09-16T00:00:00.000Z",
      weight: 61,
      recordedBy: "user-1",
      createdAt: "2026-09-16T00:00:00.000Z",
      updatedAt: "2026-09-16T00:00:00.000Z",
    });

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    queryClient.setQueryData(["metrics", "user-1"], {
      items: [],
      total: 0,
      totalPages: 0,
      page: 1,
      limit: 5,
    });

    const { result } = renderHook(() => useCreateHealthMetric(), {
      wrapper: createWrapper(queryClient),
    });

    act(() => {
      result.current.mutate({ input: { weight: 61 } });
    });

    await waitFor(() => {
      expect(queryClient.getQueryState(["metrics", "user-1"])?.isInvalidated).toBe(true);
    });
  });
});