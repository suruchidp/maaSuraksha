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
  fasting_glucose: "Fasting Glucose",
  postprandial_glucose: "Post. Glucose",
  hba1c: "HbA1c",
  family_history_diabetes: "Family Hx DM",
  previous_gdm: "Prev. GDM",
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