/**
 * Map snake_case ML feature names to display labels.
 * Used by SHAP chart and assessment result forms.
 */
const LABELS: Record<string, string> = {
  systolic_bp: "Systolic BP",
  diastolic_bp: "Diastolic BP",
  blood_sugar: "Blood Sugar",
  body_temp: "Body Temp",
  heart_rate: "Heart Rate",
  bmi: "BMI",
  gestational_week: "Gest. Week",
  age: "Age",
  hemoglobin: "Hemoglobin",
  hdl: "HDL",
  pregnancy_count: "Pregnancy #",
  previous_pregnancy_gestation: "Prev. Gestation",
  family_history: "Family Hx DM",
  unexplained_prenatal_loss: "Unexp. Prenatal Loss",
  large_child_or_birth_defect: "Large Child/Birth Defect",
  pcos: "PCOS",
  sedentary_lifestyle: "Sedentary",
  weight: "Weight",
};

export function formatFeatureLabel(key: string): string {
  if (LABELS[key]) return LABELS[key];
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function riskColor(level?: string): "green" | "amber" | "red" | "blue" | "gray" {
  switch (level?.toLowerCase()) {
    case "low":
      return "green";
    case "moderate":
    case "medium":
      return "amber";
    case "high":
      return "red";
    case "critical":
      return "red";
    default:
      return "gray";
  }
}

/* ---------------------------------------------------------------- *
 * Explainable AI: per-model feature metadata used to pair the real
 * SHAP contribution (snake_case key from the ML service) with the
 * patient's actual entered value (camelCase key in DTO.inputFeatures).
 * These lists mirror the trained models' feature sets exactly and must
 * not be used to invent SHAP values or diagnosis.
 * ---------------------------------------------------------------- */

export type MLFeatureKind = "number" | "boolean";

export interface ExplainFeature {
  /** Feature name as returned by the ML service in shapValues. */
  shapKey: string;
  /** Key in DTO.inputFeatures holding the patient's entered value. */
  inputKey: string;
  /** Human-readable label. */
  label: string;
  /** Display unit; undefined for raw counts and boolean features. */
  unit?: string;
  kind: MLFeatureKind;
}

export const MATERNAL_RISK_EXPLAIN_FEATURES: ExplainFeature[] = [
  { shapKey: "age", inputKey: "age", label: "Age", unit: "years", kind: "number" },
  { shapKey: "systolic_bp", inputKey: "systolicBP", label: "Systolic BP", unit: "mmHg", kind: "number" },
  { shapKey: "diastolic_bp", inputKey: "diastolicBP", label: "Diastolic BP", unit: "mmHg", kind: "number" },
  { shapKey: "blood_sugar", inputKey: "bloodSugar", label: "Blood Sugar", unit: "mg/dL", kind: "number" },
  { shapKey: "body_temp", inputKey: "bodyTemp", label: "Body Temperature", unit: "°C", kind: "number" },
  { shapKey: "heart_rate", inputKey: "heartRate", label: "Heart Rate", unit: "bpm", kind: "number" },
];

export const GDM_EXPLAIN_FEATURES: ExplainFeature[] = [
  { shapKey: "age", inputKey: "age", label: "Age", unit: "years", kind: "number" },
  { shapKey: "bmi", inputKey: "bmi", label: "BMI", unit: "kg/m²", kind: "number" },
  { shapKey: "hdl", inputKey: "hdl", label: "HDL Cholesterol", unit: "mg/dL", kind: "number" },
  { shapKey: "pregnancy_count", inputKey: "pregnancyCount", label: "Number of Pregnancies", kind: "number" },
  { shapKey: "previous_pregnancy_gestation", inputKey: "previousPregnancyGestation", label: "Gestation in Previous Pregnancy", unit: "weeks", kind: "number" },
  { shapKey: "family_history", inputKey: "familyHistory", label: "Family History of Diabetes", kind: "boolean" },
  { shapKey: "unexplained_prenatal_loss", inputKey: "unexplainedPrenatalLoss", label: "Unexplained Prenatal Loss", kind: "boolean" },
  { shapKey: "large_child_or_birth_defect", inputKey: "largeChildOrBirthDefect", label: "Previous Large Child or Birth Defect", kind: "boolean" },
  { shapKey: "pcos", inputKey: "pcos", label: "PCOS", kind: "boolean" },
  { shapKey: "systolic_bp", inputKey: "systolicBP", label: "Systolic BP", unit: "mmHg", kind: "number" },
  { shapKey: "diastolic_bp", inputKey: "diastolicBP", label: "Diastolic BP", unit: "mmHg", kind: "number" },
  { shapKey: "hemoglobin", inputKey: "hemoglobin", label: "Hemoglobin", unit: "g/dL", kind: "number" },
  { shapKey: "sedentary_lifestyle", inputKey: "sedentaryLifestyle", label: "Sedentary Lifestyle", kind: "boolean" },
];

export const EXPLAIN_FEATURES: Record<"maternalRisk" | "gdm", ExplainFeature[]> = {
  maternalRisk: MATERNAL_RISK_EXPLAIN_FEATURES,
  gdm: GDM_EXPLAIN_FEATURES,
};

/**
 * Format a raw patient value with its unit. Returns undefined when the value
 * is missing/not applicable so the caller can show "Not recorded".
 */
export function formatFeatureValue(
  raw: number | boolean | undefined | null,
  meta: ExplainFeature
): string | undefined {
  if (raw === undefined || raw === null) return undefined;
  if (typeof raw === "boolean") return undefined; // caller renders Yes/No
  const num = Number(raw);
  if (Number.isNaN(num)) return undefined;
  const formatted = Number.isInteger(num) ? String(num) : String(parseFloat(num.toFixed(2)));
  return meta.unit ? `${formatted} ${meta.unit}` : formatted;
}

/** Format a real SHAP contribution without altering its value. */
export function formatShapValue(value: number): string {
  if (value === 0) return "0.0000";
  return `${value > 0 ? "+" : ""}${value.toFixed(4)}`;
}

/* ---------------------------------------------------------------- *
 * Missing-value handling of the trained GDM model.
 *
 * When an OPTIONAL numeric GDM feature is missing, the serving layer fills it
 * with the median that was fitted on the model's training split and serialized
 * in apps/ml-service/artifacts/gdm/metadata.json -> `defaults`. These values
 * are the exact numbers the XGBoost model sees in its feature matrix, so the
 * SHAP contribution is computed against them. Booleans are not listed here:
 * the app always records Yes/No, so the model receives the real 0/1.
 *
 * The values are pinned to the model version they were read from. The UI must
 * only print them when the served modelVersion matches, otherwise it would
 * fabricate imputation for a different (e.g. retrained) model.
 * ---------------------------------------------------------------- */
export const GDM_IMPUTATION_DEFAULTS: Readonly<{
  modelVersion: string;
  values: Record<string, number>;
}> = {
  modelVersion: "20260916T065854Z",
  values: {
    bmi: 27.5,
    hdl: 49.0,
    systolic_bp: 132.0,
    hemoglobin: 14.0,
  },
};

/** Returns the configured imputation value for a missing optional numeric GDM feature, if any. */
export function getGDMImputationValue(shapKey: string): number | undefined {
  return GDM_IMPUTATION_DEFAULTS.values[shapKey];
}