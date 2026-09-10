import { config } from "../config";

/**
 * Best-effort HTTP client for the MaaSuraksha ML service.
 *
 * Every call is NON-BLOCKING for the API: any failure (service down,
 * timeout, 500, invalid payload) yields `{ available: false }`. Callers must
 * treat an unavailable result exactly like "no machine learning here": keep
 * the record pending and do NOT fabricate scores.
 */

const TIMEOUT_MS = Number(process.env.ML_TIMEOUT_MS || 1500);
const BASE_URL = (config.mlServiceUrl || "").replace(/\/+$/, "");

export interface MLUnavailable {
  available: false;
  reason: string;
}

export interface MLMaternalRiskResult {
  available: true;
  modelVersion?: string;
  prediction: string;
  probability: number;
  riskLevel: string;
  shapValues?: Record<string, number>;
}

export interface MLGDMResult {
  available: true;
  modelVersion?: string;
  prediction: string;
  probability: number;
  riskLevel: string;
  shapValues?: Record<string, number>;
}

export interface MLPPDResult {
  available: true;
  modelVersion?: string;
  prediction: string;
  probability: number;
  riskLevel: string;
}

export interface MLMoodResult {
  available: true;
  modelStatus: string;
  modelVersion?: string;
  sentiment?: string;
  sentimentScore?: number;
  safetyFlag: boolean;
  safetyMessage?: string;
}

async function post<T>(path: string, body: unknown): Promise<T | null> {
  if (!BASE_URL) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function unavailable(): MLUnavailable {
  return { available: false, reason: "ML service unavailable" };
}

export async function predictMaternalRisk(
  features: Record<string, unknown>
): Promise<MLMaternalRiskResult | MLUnavailable> {
  const body = await post<{
    model_status: string;
    prediction: string | null;
    probability: number | null;
    risk_level: string | null;
    shap_values: Record<string, number> | null;
    model_version: string | null;
  }>("/api/v1/maternal-risk/predict", features);
  if (!body || body.model_status !== "MODEL_AVAILABLE" || body.prediction === null) {
    return unavailable();
  }
  return {
    available: true,
    modelVersion: body.model_version ?? undefined,
    prediction: body.prediction,
    probability: body.probability ?? 0,
    riskLevel: body.risk_level ?? "low",
    shapValues: body.shap_values ?? undefined,
  };
}

export async function predictGDM(
  features: Record<string, unknown>
): Promise<MLGDMResult | MLUnavailable> {
  const body = await post<{
    model_status: string;
    prediction: string | null;
    probability: number | null;
    risk_level: string | null;
    shap_values: Record<string, number> | null;
    model_version: string | null;
  }>("/api/v1/gdm/predict", features);
  if (!body || body.model_status !== "MODEL_AVAILABLE" || body.prediction === null) {
    return unavailable();
  }
  return {
    available: true,
    modelVersion: body.model_version ?? undefined,
    prediction: body.prediction,
    probability: body.probability ?? 0,
    riskLevel: body.risk_level ?? "low",
    shapValues: body.shap_values ?? undefined,
  };
}

export async function predictPPD(
  text: string,
  language: string
): Promise<MLPPDResult | MLUnavailable> {
  const body = await post<{
    model_status: string;
    prediction: string | null;
    probability: number | null;
    model_version: string | null;
  }>("/api/v1/ppd/predict", { text, language });
  if (!body || body.model_status !== "MODEL_AVAILABLE" || body.prediction === null) {
    return unavailable();
  }
  return {
    available: true,
    modelVersion: body.model_version ?? undefined,
    prediction: body.prediction,
    probability: body.probability ?? 0,
    riskLevel: body.prediction,
  };
}

export async function analyzeMood(
  text: string,
  language: string
): Promise<MLMoodResult | MLUnavailable> {
  const body = await post<{
    model_status: string;
    sentiment: string | null;
    sentiment_score: number | null;
    safety_flag: boolean;
    safety_message: string | null;
    model_version: string | null;
  }>("/api/v1/mood/analyze", { text, language });
  if (!body) return unavailable();
  if (body.model_status === "MODEL_UNAVAILABLE") {
    return { available: false, reason: "ML mood model unavailable" };
  }
  return {
    available: true,
    modelStatus: body.model_status,
    modelVersion: body.model_version ?? undefined,
    sentiment: body.sentiment ?? undefined,
    sentimentScore: body.sentiment_score ?? undefined,
    safetyFlag: body.safety_flag,
    safetyMessage: body.safety_message ?? undefined,
  };
}