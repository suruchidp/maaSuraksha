import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { ShapChart } from "@/components/ml/ShapChart";
import { GDM_IMPUTATION_DEFAULTS } from "@/lib/mlUtils";

vi.mock("recharts", () => ({
  ResponsiveContainer: () => null,
  BarChart: () => null,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  Cell: () => null,
}));

/** Grab the card (li) for a feature by its heading. */
function card(label: string, container: HTMLElement): HTMLElement {
  const heading = within(container).getByText(label);
  return heading.parentElement as HTMLElement;
}

describe("ShapChart - Maternal Risk explainability", () => {
  const shapValues = {
    age: 0.1234,
    systolic_bp: -0.05,
    diastolic_bp: 0.02,
    blood_sugar: -0.003,
    body_temp: 0,
    heart_rate: 0.0012,
  };
  const inputValues = {
    age: 28,
    systolicBP: 130,
    diastolicBP: 85,
    bloodSugar: 105,
    bodyTemp: 37.1,
    heartRate: 78,
  };

  it("displays exactly the six trained Maternal Risk model features with patient value and real SHAP", () => {
    const { container } = render(
      <ShapChart kind="maternalRisk" shapValues={shapValues} inputValues={inputValues} />
    );

    const cards = container.querySelectorAll<HTMLElement>("li");
    expect(cards.length).toBe(6);
    for (const label of [
      "Age",
      "Systolic BP",
      "Diastolic BP",
      "Blood Sugar",
      "Body Temperature",
      "Heart Rate",
    ]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }

    expect(screen.queryByText("BMI")).not.toBeInTheDocument();
    expect(screen.queryByText("Hemoglobin")).not.toBeInTheDocument();
    expect(screen.queryByText("Gest. Week")).not.toBeInTheDocument();

    expect(screen.getByText("28 years")).toBeInTheDocument();
    expect(screen.getByText("130 mmHg")).toBeInTheDocument();
    expect(screen.getByText("85 mmHg")).toBeInTheDocument();
    expect(screen.getByText("105 mg/dL")).toBeInTheDocument();
    expect(screen.getByText("37.1 °C")).toBeInTheDocument();
    expect(screen.getByText("78 bpm")).toBeInTheDocument();

    expect(screen.getByText("+0.1234")).toBeInTheDocument();
    expect(screen.getByText("-0.0500")).toBeInTheDocument();
    expect(screen.getByText("+0.0200")).toBeInTheDocument();
    expect(screen.getByText("-0.0030")).toBeInTheDocument();
    expect(screen.getByText("0.0000")).toBeInTheDocument();
    expect(screen.getByText("+0.0012")).toBeInTheDocument();

    const sbp = card("Systolic BP", container);
    expect(within(sbp).getByText("Patient value")).toBeInTheDocument();
    expect(within(sbp).getByText("130 mmHg")).toBeInTheDocument();
    expect(within(sbp).getByText("SHAP contribution")).toBeInTheDocument();
    expect(within(sbp).getByText("-0.0500")).toBeInTheDocument();
    expect(within(sbp).getByText("Direction")).toBeInTheDocument();
    expect(within(sbp).getByText("Pushed prediction toward lower-risk class")).toBeInTheDocument();
  });

  it("explains direction: positive toward higher-risk class, negative toward lower-risk class, zero as no effect", () => {
    render(
      <ShapChart kind="maternalRisk" shapValues={shapValues} inputValues={inputValues} />
    );

    expect(screen.getAllByText("Pushed prediction toward higher-risk class").length).toBe(3);
    expect(screen.getAllByText("Pushed prediction toward lower-risk class").length).toBe(2);
    expect(screen.getByText("No effect on the prediction")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Positive contributions pushed the prediction toward the higher-risk class; negative contributions pushed it toward the lower-risk class."
      )
    ).toBeInTheDocument();
  });
});

describe("ShapChart - GDM explainability", () => {
  const shapValues = {
    age: 0.01,
    bmi: 0.3,
    hdl: -0.1,
    pregnancy_count: 0.05,
    previous_pregnancy_gestation: -0.2,
    family_history: 0.086,
    unexplained_prenatal_loss: -0.02,
    large_child_or_birth_defect: 0,
    pcos: 0.005,
    systolic_bp: -0.04,
    diastolic_bp: 0.03,
    hemoglobin: -0.35,
    sedentary_lifestyle: 0.002,
  };
  const inputValues = {
    age: 32,
    bmi: 24.5,
    hdl: 45,
    pregnancyCount: 2,
    previousPregnancyGestation: 40,
    familyHistory: false,
    unexplainedPrenatalLoss: true,
    largeChildOrBirthDefect: false,
    pcos: false,
    systolicBP: 118,
    diastolicBP: 76,
    sedentaryLifestyle: true,
  };

  it("shows every returned GDM feature with its real patient value and real SHAP contribution", () => {
    const { container } = render(
      <ShapChart kind="gdm" shapValues={shapValues} inputValues={inputValues} />
    );

    const cards = container.querySelectorAll<HTMLElement>("li");
    expect(cards.length).toBe(13);

    for (const label of [
      "Age",
      "BMI",
      "HDL Cholesterol",
      "Number of Pregnancies",
      "Gestation in Previous Pregnancy",
      "Family History of Diabetes",
      "Unexplained Prenatal Loss",
      "Previous Large Child or Birth Defect",
      "PCOS",
      "Systolic BP",
      "Diastolic BP",
      "Hemoglobin",
      "Sedentary Lifestyle",
    ]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }

    expect(screen.getByText("24.5 kg/m²")).toBeInTheDocument();
    expect(screen.getByText("45 mg/dL")).toBeInTheDocument();
    expect(screen.getByText("40 weeks")).toBeInTheDocument();
    expect(screen.getByText("118 mmHg")).toBeInTheDocument();
    expect(screen.getByText("76 mmHg")).toBeInTheDocument();

    expect(screen.getByText("+0.3000")).toBeInTheDocument();
    expect(screen.getByText("-0.1000")).toBeInTheDocument();
    expect(screen.getByText("+0.0860")).toBeInTheDocument();
    expect(screen.getByText("-0.3500")).toBeInTheDocument();
  });

  it("renders checkbox features as explicit Yes/No and never hides a 0/No feature", () => {
    const { container } = render(
      <ShapChart kind="gdm" shapValues={shapValues} inputValues={inputValues} />
    );

    const familyHistory = card("Family History of Diabetes", container);
    expect(within(familyHistory).getByText("No")).toBeInTheDocument();
    expect(within(familyHistory).getByText("+0.0860")).toBeInTheDocument();

    const unexplainedLoss = card("Unexplained Prenatal Loss", container);
    expect(within(unexplainedLoss).getByText("Yes")).toBeInTheDocument();

    const birthDefect = card("Previous Large Child or Birth Defect", container);
    expect(within(birthDefect).getByText("No")).toBeInTheDocument();
    expect(within(birthDefect).getByText("0.0000")).toBeInTheDocument();
    expect(within(birthDefect).getByText("No effect on the prediction")).toBeInTheDocument();

    const sedentary = card("Sedentary Lifestyle", container);
    expect(within(sedentary).getByText("Yes")).toBeInTheDocument();
  });

  it("does not imply a checkbox feature with patient value No is present", () => {
    const { container } = render(
      <ShapChart kind="gdm" shapValues={shapValues} inputValues={inputValues} />
    );

    const familyHistory = card("Family History of Diabetes", container);
    expect(within(familyHistory).getByText("No")).toBeInTheDocument();
    expect(within(familyHistory).queryByText("Yes")).not.toBeInTheDocument();

    expect(
      screen.getByText(
        "SHAP values are the model's real per-feature contributions for the value entered. They are not a diagnosis, and a listed feature does not confirm that a condition or history is present."
      )
    ).toBeInTheDocument();
  });

  it("reports missing numeric GDM values honestly: patient value Not recorded, model uses its imputed median", () => {
    const withMissing: Partial<typeof inputValues> = {
      age: inputValues.age,
      hdl: inputValues.hdl,
      pregnancyCount: inputValues.pregnancyCount,
      previousPregnancyGestation: inputValues.previousPregnancyGestation,
      familyHistory: inputValues.familyHistory,
      unexplainedPrenatalLoss: inputValues.unexplainedPrenatalLoss,
      largeChildOrBirthDefect: inputValues.largeChildOrBirthDefect,
      pcos: inputValues.pcos,
      systolicBP: inputValues.systolicBP,
      diastolicBP: inputValues.diastolicBP,
      sedentaryLifestyle: inputValues.sedentaryLifestyle,
    };

    const { container } = render(
      <ShapChart
        kind="gdm"
        shapValues={shapValues}
        inputValues={withMissing}
        modelVersion={GDM_IMPUTATION_DEFAULTS.modelVersion}
      />
    );

    const hemoglobin = card("Hemoglobin", container);
    expect(within(hemoglobin).getByText("Not recorded")).toBeInTheDocument();
    expect(within(hemoglobin).getByText("Model used")).toBeInTheDocument();
    expect(
      within(hemoglobin).getByText("14 g/dL · imputed from training data")
    ).toBeInTheDocument();

    const bmi = card("BMI", container);
    expect(within(bmi).getByText("Not recorded")).toBeInTheDocument();
    expect(within(bmi).getByText("Model used")).toBeInTheDocument();
    expect(
      within(bmi).getByText("27.5 kg/m² · imputed from training data")
    ).toBeInTheDocument();
  });

  it("refuses to print pinned imputation numbers when the served model version differs", () => {
    const { container } = render(
      <ShapChart
        kind="gdm"
        shapValues={{ hemoglobin: -0.35 }}
        inputValues={{}}
        modelVersion="a-different-model-version"
      />
    );

    const hemoglobin = card("Hemoglobin", container);
    expect(within(hemoglobin).getByText("Not recorded")).toBeInTheDocument();
    expect(
      within(hemoglobin).getByText("Imputed by the model from training data (median)")
    ).toBeInTheDocument();
    expect(within(hemoglobin).queryByText("14 g/dL")).not.toBeInTheDocument();
  });

  it("shows direction wording for every GDM row", () => {
    render(<ShapChart kind="gdm" shapValues={shapValues} inputValues={inputValues} />);

    expect(screen.getAllByText("Pushed prediction toward higher-risk class").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Pushed prediction toward lower-risk class").length).toBeGreaterThan(0);
    expect(screen.getByText("No effect on the prediction")).toBeInTheDocument();
  });
});

describe("ShapChart - honesty", () => {
  it("renders nothing when no SHAP values were returned", () => {
    const { container } = render(<ShapChart kind="maternalRisk" />);
    expect(container).toBeEmptyDOMElement();
  });
});