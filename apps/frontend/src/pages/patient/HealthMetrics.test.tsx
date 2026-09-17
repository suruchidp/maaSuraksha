import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import HealthMetricsPage from "./HealthMetrics";
import { toLocalInputDate } from "@/lib/date";

const mocks = vi.hoisted(() => ({
  useHealthMetrics: vi.fn(),
  useCreateHealthMetric: vi.fn(),
  useCurrentLanguage: vi.fn(),
  useAuthStore: vi.fn(),
  useToastStore: vi.fn(),
}));

vi.mock("@/hooks/queries", () => ({
  useHealthMetrics: (...args: unknown[]) => mocks.useHealthMetrics(...args),
  useCreateHealthMetric: (...args: unknown[]) => mocks.useCreateHealthMetric(...args),
}));

vi.mock("@/hooks/useAuth", () => ({
  useCurrentLanguage: (...args: unknown[]) => mocks.useCurrentLanguage(...args),
}));

vi.mock("@/stores/authStore", () => ({
  useAuthStore: (selector: unknown) => mocks.useAuthStore(selector),
}));

vi.mock("@/stores/toastStore", () => ({
  useToastStore: (selector: unknown) => mocks.useToastStore(selector),
}));

const emptyMetricsState = {
  data: { items: [] },
  isLoading: false,
  isError: false,
  error: null,
  refetch: vi.fn(),
};

/* The form registers numeric fields with `valueAsNumber`, so an empty input
   becomes NaN. zod's `.optional()` only accepts undefined, so NaN fails the
   `.min()` bound and the form never reaches onSubmit. Valid-date tests must
   therefore fill every numeric field with an in-range value. */
const numericFields: Array<[RegExp, string]> = [
  [/Systolic BP/, "118"],
  [/Diastolic BP/, "76"],
  [/Weight/, "58"],
  [/Glucose/, "96"],
  [/Heart Rate/, "72"],
  [/Temperature/, "36.6"],
  [/Hemoglobin/, "12.5"],
];

function fillNumericFields() {
  for (const [label, value] of numericFields) {
    const input = screen.queryAllByLabelText(label)[0] as HTMLInputElement | undefined;
    if (input) fireEvent.input(input, { target: { value } });
  }
}

describe("HealthMetricsPage", () => {
  let createMetric: ReturnType<typeof vi.fn>;
  const user = { id: "u1", name: "Anu", role: "PATIENT", language: "en" as "en" };

  beforeEach(() => {
    createMetric = vi.fn();
    mocks.useHealthMetrics.mockReset();
    mocks.useCreateHealthMetric.mockReset();
    mocks.useCurrentLanguage.mockReset();
    mocks.useAuthStore.mockReset();
    mocks.useToastStore.mockReset();

    mocks.useHealthMetrics.mockImplementation(() => ({ ...emptyMetricsState }));
    mocks.useCreateHealthMetric.mockImplementation(() => ({
      mutate: createMetric,
      isPending: false,
    }));
    mocks.useCurrentLanguage.mockReturnValue("en");
    mocks.useAuthStore.mockImplementation((selector: unknown) => {
      const state = { user };
      return typeof selector === "function" ? selector(state) : state;
    });
    mocks.useToastStore.mockImplementation((selector: unknown) => {
      const state = { push: vi.fn() };
      return typeof selector === "function" ? selector(state) : state;
    });
  });

  it("shows a visible validation message and does not submit when the date is in the future", async () => {
    const user = userEvent.setup();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    render(<HealthMetricsPage />);

    fireEvent.change(screen.getByLabelText(/Date/), {
      target: { value: toLocalInputDate(tomorrow) },
    });

    await user.click(screen.getByRole("button", { name: "Save metric" }));

    expect(screen.getByText("Date cannot be in the future")).toBeInTheDocument();
    expect(createMetric).not.toHaveBeenCalled();
  });

  it("submits a health metric dated today", async () => {
    const user = userEvent.setup();
    render(<HealthMetricsPage />);
    fillNumericFields();

    await user.click(screen.getByRole("button", { name: "Save metric" }));

    expect(createMetric).toHaveBeenCalledTimes(1);
    const arg = createMetric.mock.calls[0][0];
    expect(arg.input.date).toBe(toLocalInputDate(new Date()));
  });

  it("submits a health metric dated in the past", async () => {
    const user = userEvent.setup();
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    render(<HealthMetricsPage />);

    fireEvent.change(screen.getByLabelText(/Date/), {
      target: { value: toLocalInputDate(threeDaysAgo) },
    });
    fillNumericFields();

    await user.click(screen.getByRole("button", { name: "Save metric" }));

    expect(createMetric).toHaveBeenCalledTimes(1);
    const arg = createMetric.mock.calls[0][0];
    expect(arg.input.date).toBe(toLocalInputDate(threeDaysAgo));
  });
});
