import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PregnancyPage from "./Pregnancy";
import type { PregnancyProfileDTO } from "@/lib/types";

const mocks = vi.hoisted(() => ({
  usePregnancy: vi.fn(),
  useUpsertPregnancy: vi.fn(),
}));

vi.mock("@/hooks/queries", () => ({
  usePregnancy: (...args: unknown[]) => mocks.usePregnancy(...args),
  useUpsertPregnancy: (...args: unknown[]) => mocks.useUpsertPregnancy(...args),
}));

const notFoundError = {
  isAxiosError: true,
  message: "Request failed with status code 404",
  response: {
    status: 404,
    data: {
      success: false,
      error: { code: "NOT_FOUND", message: "Pregnancy profile not found" },
    },
  },
};

const serverError = {
  isAxiosError: true,
  message: "Internal server error",
  response: {
    status: 500,
    data: {
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Internal server error" },
    },
  },
};

const noProfileState = {
  data: undefined,
  isLoading: false,
  isError: true,
  error: notFoundError,
  refetch: vi.fn(),
};

const profile: PregnancyProfileDTO = {
  id: "p1",
  user: "u1",
  lmp: "2026-01-15T00:00:00.000Z",
  expectedDueDate: "2026-10-22T00:00:00.000Z",
  gestationalWeek: 12,
  trimester: 1,
  gravida: 1,
  para: 0,
  isHighRisk: false,
  riskFactors: [],
  medicalHistory: [],
  createdAt: "2026-01-15T00:00:00.000Z",
  updatedAt: "2026-01-15T00:00:00.000Z",
};

describe("PregnancyPage", () => {
  beforeEach(() => {
    mocks.usePregnancy.mockReset();
    mocks.useUpsertPregnancy.mockReset();
    mocks.useUpsertPregnancy.mockReturnValue({ mutate: vi.fn(), isPending: false });
  });

  it("shows a setup empty state instead of a generic error when no profile exists (404)", () => {
    mocks.usePregnancy.mockReturnValue(noProfileState);
    render(<PregnancyPage />);

    expect(screen.getByText("No pregnancy profile yet")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Set up pregnancy profile" })
    ).toBeInTheDocument();
    expect(screen.queryByText("Something went wrong")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Try again" })
    ).not.toBeInTheDocument();
  });

  it("reveals the pregnancy form when the setup action is clicked", async () => {
    const user = userEvent.setup();
    mocks.usePregnancy.mockReturnValue(noProfileState);
    render(<PregnancyPage />);

    expect(
      screen.queryByLabelText(/Last Menstrual Period/)
    ).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Set up pregnancy profile" })
    );

    expect(screen.getByLabelText(/Last Menstrual Period/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
    expect(screen.queryByText("No pregnancy profile yet")).not.toBeInTheDocument();
  });

  it("shows the existing profile and update form for a patient with a saved profile", () => {
    mocks.usePregnancy.mockReturnValue({
      data: profile,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });
    render(<PregnancyPage />);

    expect(screen.getByText("12 weeks")).toBeInTheDocument();
    expect(screen.getByText("Trimester 1")).toBeInTheDocument();
    expect(screen.getByText("Low risk")).toBeInTheDocument();
    expect(screen.getByLabelText(/Last Menstrual Period/)).toBeInTheDocument();
    expect(screen.queryByText("No pregnancy profile yet")).not.toBeInTheDocument();
    expect(screen.queryByText("Something went wrong")).not.toBeInTheDocument();
  });

  it("keeps showing a generic error with retry for real failures", () => {
    mocks.usePregnancy.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: serverError,
      refetch: vi.fn(),
    });
    render(<PregnancyPage />);

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.getByText("Internal server error")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
    expect(screen.queryByText("No pregnancy profile yet")).not.toBeInTheDocument();
  });
});