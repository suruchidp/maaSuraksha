import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MaternalRiskPanel, GDMPanel, PPDPanel } from "@/components/assessments/AssessmentPanels";
import { buildSchemas } from "@/lib/schemas";

const mocks = vi.hoisted(() => ({
  useMaternalRiskHistory: vi.fn(),
  useCreateMaternalRisk: vi.fn(),
  useGDMHistory: vi.fn(),
  useCreateGDM: vi.fn(),
  usePPDHistory: vi.fn(),
  useCreatePPD: vi.fn(),
  useCurrentLanguage: vi.fn(),
  useAuthStore: vi.fn(),
  useToastStore: vi.fn(),
}));

vi.mock("@/hooks/queries", () => ({
  useMaternalRiskHistory: (...a: unknown[]) => mocks.useMaternalRiskHistory(...a),
  useCreateMaternalRisk: (...a: unknown[]) => mocks.useCreateMaternalRisk(...a),
  useGDMHistory: (...a: unknown[]) => mocks.useGDMHistory(...a),
  useCreateGDM: (...a: unknown[]) => mocks.useCreateGDM(...a),
  usePPDHistory: (...a: unknown[]) => mocks.usePPDHistory(...a),
  useCreatePPD: (...a: unknown[]) => mocks.useCreatePPD(...a),
}));

vi.mock("@/hooks/useAuth", () => ({
  useCurrentLanguage: (...a: unknown[]) => mocks.useCurrentLanguage(...a),
}));

vi.mock("@/stores/authStore", () => ({
  useAuthStore: (selector: unknown) => mocks.useAuthStore(selector),
}));

vi.mock("@/stores/toastStore", () => ({
  useToastStore: (selector: unknown) => mocks.useToastStore(selector),
}));

function mockDefaults() {
  const emptyHistory = {
    data: { items: [] },
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
  };
  mocks.useMaternalRiskHistory.mockReturnValue({ ...emptyHistory });
  mocks.useGDMHistory.mockReturnValue({ ...emptyHistory });
  mocks.usePPDHistory.mockReturnValue({ ...emptyHistory });
  mocks.useCurrentLanguage.mockReturnValue("en");
  mocks.useAuthStore.mockImplementation((selector: unknown) => {
    const state = { user: { id: "u1", name: "Anu", role: "PATIENT", language: "en" } };
    return typeof selector === "function" ? selector(state) : state;
  });
  mocks.useToastStore.mockImplementation((selector: unknown) => {
    const state = { push: vi.fn() };
    return typeof selector === "function" ? selector(state) : state;
  });
}

describe("AssessmentPanels submission", () => {
  beforeEach(() => {
    mockDefaults();
  });

  it("Maternal risk: a valid submission calls useCreateMaternalRisk().mutate", async () => {
    const user = userEvent.setup();
    const mutate = vi.fn();
    mocks.useCreateMaternalRisk.mockReturnValue({ mutate, isPending: false });
    const { container } = render(<MaternalRiskPanel userId="u1" />);

    const fields: Array<[RegExp, string]> = [
      [/Systolic BP/, "120"],
      [/Diastolic BP/, "80"],
      [/Blood Sugar/, "90"],
      [/Body Temperature/, "37"],
      [/Heart Rate/, "72"],
    ];
    for (const [label, value] of fields) {
      const input = within(container).queryAllByLabelText(label)[0] as HTMLInputElement;
      await user.clear(input);
      await user.type(input, value);
    }

    await user.click(screen.getByRole("button", { name: "Run assessment" }));

    expect(mutate).toHaveBeenCalledTimes(1);
    const payload = mutate.mock.calls[0][0];
    expect(payload).toMatchObject({
      user: "u1",
      age: 25,
      systolicBP: 120,
      diastolicBP: 80,
      bloodSugar: 90,
      bodyTemp: 37,
      heartRate: 72,
      bmi: 22,
      gestationalWeek: 12,
    });
    expect(payload.hemoglobin).toBeUndefined();
  });

  it("Maternal risk: a blank optional hemoglobin field does not block submission", async () => {
    const user = userEvent.setup();
    const mutate = vi.fn();
    mocks.useCreateMaternalRisk.mockReturnValue({ mutate, isPending: false });
    const { container } = render(<MaternalRiskPanel userId="u1" />);

    const fields: Array<[RegExp, string]> = [
      [/Systolic BP/, "120"],
      [/Diastolic BP/, "80"],
      [/Blood Sugar/, "90"],
      [/Body Temperature/, "37"],
      [/Heart Rate/, "72"],
    ];
    for (const [label, value] of fields) {
      const input = within(container).queryAllByLabelText(label)[0] as HTMLInputElement;
      await user.clear(input);
      await user.type(input, value);
    }

    const hemoglobin = within(container).queryAllByLabelText(/Hemoglobin/)[0] as HTMLInputElement;
    expect(hemoglobin.value).toBe("");

    await user.click(screen.getByRole("button", { name: "Run assessment" }));

    expect(mutate).toHaveBeenCalledTimes(1);
    expect(mutate.mock.calls[0][0].hemoglobin).toBeUndefined();
  });

  it("Maternal risk: missing a required numeric field shows an error and does not submit", async () => {
    const user = userEvent.setup();
    const mutate = vi.fn();
    mocks.useCreateMaternalRisk.mockReturnValue({ mutate, isPending: false });
    render(<MaternalRiskPanel userId="u1" />);

    await user.click(screen.getByRole("button", { name: "Run assessment" }));

    expect(mutate).not.toHaveBeenCalled();
    expect(screen.getAllByRole("alert").length).toBeGreaterThan(0);
  });

  it("GDM: run assessment with only the prefilled defaults calls useCreateGDM().mutate", async () => {
    const user = userEvent.setup();
    const mutate = vi.fn();
    mocks.useCreateGDM.mockReturnValue({ mutate, isPending: false });
    render(<GDMPanel userId="u1" />);

    await user.click(screen.getByRole("button", { name: "Run assessment" }));

    expect(mutate).toHaveBeenCalledTimes(1);
    const payload = mutate.mock.calls[0][0];
    expect(payload).toMatchObject({
      user: "u1",
      age: 25,
      pregnancyCount: 1,
      previousPregnancyGestation: 0,
      diastolicBP: 80,
      familyHistory: false,
      unexplainedPrenatalLoss: false,
      largeChildOrBirthDefect: false,
      pcos: false,
      sedentaryLifestyle: false,
    });
    expect(payload.bmi).toBeUndefined();
    expect(payload.hdl).toBeUndefined();
    expect(payload.systolicBP).toBeUndefined();
    expect(payload.hemoglobin).toBeUndefined();
  });

  it("PPD: run assessment with the prefilled EPDS answers calls useCreatePPD().mutate", async () => {
    const user = userEvent.setup();
    const mutate = vi.fn();
    mocks.useCreatePPD.mockReturnValue({ mutate, isPending: false });
    render(<PPDPanel userId="u1" />);

    await user.click(screen.getByRole("button", { name: "Run assessment" }));

    expect(mutate).toHaveBeenCalledTimes(1);
    const payload = mutate.mock.calls[0][0];
    expect(payload).toMatchObject({ user: "u1" });
    expect(payload.edinburghAnswers).toEqual(Array(10).fill(1));
  });
});

const stubT = ((key: string, params?: Record<string, unknown>) =>
  params ? `${key}::${JSON.stringify(params)}` : key) as unknown as Parameters<
  typeof buildSchemas
>[0];

describe("AssessmentPanels required markers match zod validation", () => {
  beforeEach(() => {
    mockDefaults();
  });

  const schemas = buildSchemas(stubT);
  const shapeOf = (form: "maternalRisk" | "gdm" | "ppd") =>
    schemas[form].shape as unknown as Record<string, { isOptional(): boolean }>;

  /* A rendered field whose zod schema rejects undefined is required and must
     show a red *; optional fields must not. IsOptional() is itself defined as
     safeParse(undefined).success, so it is always in sync with validation. */
  function expectLabel(label: string, fieldShape: { isOptional(): boolean }) {
    const labelEl = screen.getByText(label).closest("label");
    expect(labelEl, `label for "${label}"`).toBeTruthy();
    const star = labelEl?.querySelector("span.text-red-500");
    expect(Boolean(star), `required marker for "${label}"`).toBe(!fieldShape.isOptional());
  }

  it("Maternal risk: visible * matches the zod schema for every input", () => {
    render(<MaternalRiskPanel userId="u1" />);
    const shape = shapeOf("maternalRisk");
    const cases: Array<[string, string]> = [
      ["Age", "age"],
      ["Systolic BP", "systolicBP"],
      ["Diastolic BP", "diastolicBP"],
      ["Blood Sugar (mg/dL)", "bloodSugar"],
      ["Body Temperature (°C)", "bodyTemp"],
      ["Heart Rate (bpm)", "heartRate"],
      ["BMI", "bmi"],
      ["Gestational Week", "gestationalWeek"],
      ["Hemoglobin (g/dL)", "hemoglobin"],
    ];
    for (const [label, field] of cases) {
      expectLabel(label, shape[field]);
    }
  });

  it("GDM: visible * matches the zod schema for every input", () => {
    render(<GDMPanel userId="u1" />);
    const shape = shapeOf("gdm");
    const cases: Array<[string, string]> = [
      ["Age", "age"],
      ["BMI", "bmi"],
      ["HDL Cholesterol", "hdl"],
      ["Number of Pregnancies", "pregnancyCount"],
      ["Gestation in Previous Pregnancy (weeks)", "previousPregnancyGestation"],
      ["Systolic BP", "systolicBP"],
      ["Diastolic BP", "diastolicBP"],
      ["Hemoglobin", "hemoglobin"],
    ];
    for (const [label, field] of cases) {
      expectLabel(label, shape[field]);
    }
  });

  it("GDM: optional boolean checkboxes never show a required marker", () => {
    render(<GDMPanel userId="u1" />);
    const shape = shapeOf("gdm");
    const checkboxCases: Array<[string, string]> = [
      ["Family history of diabetes", "familyHistory"],
      ["Unexplained prenatal loss", "unexplainedPrenatalLoss"],
      ["Previous large child or birth defect", "largeChildOrBirthDefect"],
      ["PCOS", "pcos"],
      ["Sedentary lifestyle", "sedentaryLifestyle"],
    ];
    for (const [label, field] of checkboxCases) {
      expect(shape[field].isOptional(), `schema optionality of "${field}"`).toBe(true);
      const labelEl = screen.getByText(label).closest("label");
      expect(labelEl, `label for "${label}"`).toBeTruthy();
      expect(labelEl?.querySelector("span.text-red-500"), `no marker on "${label}"`).toBeNull();
    }
  });

  it("PPD: all 10 EPDS questions show *, the optional note field does not", () => {
    render(<PPDPanel userId="u1" />);
    expect(shapeOf("ppd").edinburghAnswers.isOptional()).toBe(false);

    for (let i = 0; i < 10; i++) {
      const question = screen.getByText((content: string, el?: Element | null) => {
        const p = el && el.closest("p");
        return Boolean(p && content.trimStart().startsWith(`${i + 1}. `));
      });
      expect(question.querySelector("span.text-red-500")).not.toBeNull();
    }

    const noteLabel = screen.getByText("How have you been feeling? (optional)").closest("label");
    expect(noteLabel).toBeTruthy();
    expect(noteLabel?.querySelector("span.text-red-500")).toBeNull();
  });
});

/* Locks the exact required/optional indicator matrix reported from the live
   browser, independent of schema introspection, so any drift in the schema or
   the panel is caught explicitly. */
describe("AssessmentPanels required indicator matrix (live finding)", () => {
  beforeEach(() => {
    mockDefaults();
  });

  function showsStar(label: string): boolean {
    const labelEl = screen.getByText(label).closest("label");
    expect(labelEl, `label for "${label}"`).toBeTruthy();
    return Boolean(labelEl?.querySelector("span.text-red-500"));
  }

  it("Maternal: Age through Gestational Week are required (*), Hemoglobin is optional (no *)", () => {
    render(<MaternalRiskPanel userId="u1" />);
    for (const label of [
      "Age",
      "Systolic BP",
      "Diastolic BP",
      "Blood Sugar (mg/dL)",
      "Body Temperature (°C)",
      "Heart Rate (bpm)",
      "BMI",
      "Gestational Week",
    ]) {
      expect(showsStar(label), `"${label}" should be required`).toBe(true);
    }
    expect(showsStar("Hemoglobin (g/dL)"), "Hemoglobin should be optional").toBe(false);
  });

  it("GDM: Age, Pregnancy Count, Previous Gestation, Diastolic BP are required; the rest are optional", () => {
    render(<GDMPanel userId="u1" />);
    for (const label of [
      "Age",
      "Number of Pregnancies",
      "Gestation in Previous Pregnancy (weeks)",
      "Diastolic BP",
    ]) {
      expect(showsStar(label), `"${label}" should be required`).toBe(true);
    }
    for (const label of ["BMI", "HDL Cholesterol", "Systolic BP", "Hemoglobin"]) {
      expect(showsStar(label), `"${label}" should be optional`).toBe(false);
    }
    for (const label of [
      "Family history of diabetes",
      "Unexplained prenatal loss",
      "Previous large child or birth defect",
      "PCOS",
      "Sedentary lifestyle",
    ]) {
      expect(showsStar(label), `"${label}" should be optional`).toBe(false);
    }
  });

  it("GDM: leaving a required field blank blocks submission with an error, matching the *", async () => {
    const user = userEvent.setup();
    const mutate = vi.fn();
    mocks.useCreateGDM.mockReturnValue({ mutate, isPending: false });
    render(<GDMPanel userId="u1" />);

    const age = (await screen.findByLabelText(/Age/)) as HTMLInputElement;
    await user.clear(age);
    await user.click(screen.getByRole("button", { name: "Run assessment" }));

    expect(mutate).not.toHaveBeenCalled();
    expect(screen.getAllByRole("alert").length).toBeGreaterThan(0);
  });

  it("GDM: the UI explains on the Systolic BP field why it is optional while Diastolic BP stays required", () => {
    render(<GDMPanel userId="u1" />);

    const systolicLabel = screen.getByText("Systolic BP").closest("label");
    expect(systolicLabel).toBeTruthy();
    expect(systolicLabel!.querySelector("span.text-red-500")).toBeNull();

    const diastolicLabel = screen.getByText("Diastolic BP").closest("label");
    expect(diastolicLabel).toBeTruthy();
    expect(diastolicLabel!.querySelector("span.text-red-500")).toBeTruthy();

    expect(screen.getByText(/Optional\. The early-risk model was trained on data/)).toBeInTheDocument();
    expect(screen.getByText(/training median \(132 mmHg\)/)).toBeInTheDocument();
  });
});