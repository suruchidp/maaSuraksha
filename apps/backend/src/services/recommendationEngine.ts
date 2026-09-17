import { MaternalRiskAssessment } from "../models/MaternalRiskAssessment";
import { GDMAssessment } from "../models/GDMAssessment";
import { PPDAssessment } from "../models/PPDAssessment";
import { PregnancyProfile } from "../models/PregnancyProfile";
import { HealthMetric } from "../models/HealthMetric";
import { Symptom } from "../models/Symptom";
import { Recommendation } from "../models/Recommendation";
import type { IRecommendationReference } from "../models/Recommendation";
import {
  ENGINE_SOURCE,
  RECOMMENDATION_TEMPLATES,
  RISK_LEVEL_LABELS,
  PPD_SEVERITY_LABELS,
  SYMPTOM_SEVERITY_LABELS,
  fillLocalized,
  localizedReason,
  type LocalizedText,
} from "./recommendationContent";

/**
 * MaaSuraksha recommendation engine v1.
 *
 * Deterministic, rule-based and fully testable: given a snapshot of REAL
 * persisted values (completed assessment results, stored readings), it emits
 * recommendation drafts from the hand-authored multilingual content store.
 *
 * Safety contract:
 * - Every {placeholder} is filled ONLY from stored values, never invented.
 * - pending / unavailable assessments are never used.
 * - Mood / journal data is never used (sensitive).
 * - High / critical signals are surfaced with prominent (warning / high) content.
 */

export interface EngineContext {
  user: string;
  trimester?: number;
  isHighRisk?: boolean;
  maternal?: {
    riskLevel?: string;
    modelVersion?: string;
    assessmentId: string;
  };
  gdm?: { riskLevel?: string; modelVersion?: string; assessmentId: string };
  ppd?: { severity?: string; modelVersion?: string; assessmentId: string };
  latestSymptom?: { severity?: string };
  latestMetrics?: {
    systolicBP?: number;
    diastolicBP?: number;
    glucose?: number;
    hemoglobin?: number;
  };
}

export interface RecommendationDraft {
  category: string;
  priority: string;
  title: string;
  titleLocalized: Record<string, string>;
  content: string;
  contentLocalized: Record<string, string>;
  reason?: string;
  reasonLocalized?: Record<string, string>;
  source: string;
  isPersonalized: boolean;
  sourceType: "SYSTEM";
  references?: IRecommendationReference[];
  templateKey: string;
}

function modelSuffix(modelVersion?: string): string {
  return modelVersion ? ` (model ${modelVersion})` : "";
}

function labelsFor(
  riskLevel: string | undefined,
  map: Record<string, LocalizedText>
): LocalizedText | undefined {
  return riskLevel ? map[riskLevel] : undefined;
}

/**
 * Pure rule evaluation. Never touches the database; ideal for unit tests.
 */
export function recommendationsForContext(
  ctx: EngineContext
): RecommendationDraft[] {
  const drafts: RecommendationDraft[] = [];

  const push = (
    templateKey: string,
    values: Record<string, string | LocalizedText>,
    references?: IRecommendationReference[]
  ) => {
    const tpl = RECOMMENDATION_TEMPLATES[templateKey];
    if (!tpl) return;
    const titleLocalized = fillLocalized(tpl.title, values);
    const contentLocalized = fillLocalized(tpl.content, values);
    drafts.push({
      category: tpl.category,
      priority: tpl.priority,
      title: titleLocalized.en,
      titleLocalized,
      content: contentLocalized.en,
      contentLocalized,
      reason: undefined,
      reasonLocalized: undefined,
      source: ENGINE_SOURCE,
      isPersonalized: true,
      sourceType: "SYSTEM",
      references,
      templateKey,
    });
  };

  const addReason = (draft: RecommendationDraft, framing: "risk" | "severity" | "data", sourceKey: string, values: Record<string, string | LocalizedText>) => {
    const reason = localizedReason(framing, sourceKey, values);
    draft.reason = reason.en;
    draft.reasonLocalized = reason;
  };

  // ---- Maternal risk (completed model result only) ----
  if (ctx.maternal?.riskLevel) {
    const level =
      labelsFor(ctx.maternal.riskLevel, RISK_LEVEL_LABELS) ??
      RISK_LEVEL_LABELS.low;
    const values = {
      level,
      model: modelSuffix(ctx.maternal.modelVersion),
    };
    const reference: IRecommendationReference = {
      assessmentId: ctx.maternal.assessmentId as never,
      assessmentType: "maternal",
      modelVersion: ctx.maternal.modelVersion,
    };
    let key: string | undefined;
    if (ctx.maternal.riskLevel === "high" || ctx.maternal.riskLevel === "critical") {
      key = "maternal-risk-high";
    } else if (ctx.maternal.riskLevel === "medium") {
      key = "maternal-risk-medium";
    } else if (ctx.maternal.riskLevel === "low") {
      key = "maternal-risk-low";
    }
    if (key) {
      const idx = drafts.length;
      push(key, values, [reference]);
      addReason(drafts[idx], "risk", "maternal", values);
    }
  }

  // ---- GDM screening (completed model result only) ----
  if (ctx.gdm?.riskLevel) {
    const level =
      labelsFor(ctx.gdm.riskLevel, RISK_LEVEL_LABELS) ?? RISK_LEVEL_LABELS.low;
    const values = {
      level,
      model: modelSuffix(ctx.gdm.modelVersion),
    };
    const reference: IRecommendationReference = {
      assessmentId: ctx.gdm.assessmentId as never,
      assessmentType: "gdm",
      modelVersion: ctx.gdm.modelVersion,
    };
    let key: string | undefined;
    if (ctx.gdm.riskLevel === "high") {
      key = "gdm-risk-high";
    } else if (ctx.gdm.riskLevel === "moderate") {
      key = "gdm-risk-moderate";
    } else if (ctx.gdm.riskLevel === "low") {
      key = "gdm-risk-low";
    }
    if (key) {
      const idx = drafts.length;
      push(key, values, [reference]);
      addReason(drafts[idx], "risk", "gdm", values);
    }
  }

  // ---- PPD screening (completed model result only; mood data is never used) ----
  if (ctx.ppd?.severity) {
    const level = labelsFor(ctx.ppd.severity, PPD_SEVERITY_LABELS);
    if (level) {
      const reference: IRecommendationReference = {
        assessmentId: ctx.ppd.assessmentId as never,
        assessmentType: "ppd",
        modelVersion: ctx.ppd.modelVersion,
      };
      if (ctx.ppd.severity === "severe") {
        const idx = drafts.length;
        push("ppd-risk-severe", { level, model: modelSuffix(ctx.ppd.modelVersion) }, [reference]);
        addReason(drafts[idx], "severity", "ppd", { level, model: modelSuffix(ctx.ppd.modelVersion) });
      } else if (ctx.ppd.severity === "moderate") {
        const idx = drafts.length;
        push("ppd-risk-moderate", { level, model: modelSuffix(ctx.ppd.modelVersion) }, [reference]);
        addReason(drafts[idx], "severity", "ppd", { level, model: modelSuffix(ctx.ppd.modelVersion) });
      }
    }
  }

  // ---- Pregnancy profile (stored clinical/lifestyle data) ----
  if (ctx.trimester === 1 || ctx.trimester === 2 || ctx.trimester === 3) {
    const idx = drafts.length;
    push(`pregnancy-trimester-${ctx.trimester}`, { trimester: String(ctx.trimester) });
    addReason(drafts[idx], "data", "trimester", { trimester: String(ctx.trimester) });
  }
  if (ctx.isHighRisk) {
    const idx = drafts.length;
    push("pregnancy-high-risk", {});
    addReason(drafts[idx], "data", "pregnancy-high-risk", {});
  }

  // ---- Health metrics (latest stored readings) ----
  const m = ctx.latestMetrics;
  if (m && typeof m.systolicBP === "number" && typeof m.diastolicBP === "number") {
    if (m.systolicBP >= 140 || m.diastolicBP >= 90) {
      const values = { sys: String(m.systolicBP), dia: String(m.diastolicBP) };
      const idx = drafts.length;
      push("metric-bp-high", values);
      addReason(drafts[idx], "data", "bp", values);
    }
  }
  if (m && typeof m.glucose === "number" && m.glucose >= 140) {
    const values = { glucose: String(m.glucose) };
    const idx = drafts.length;
    push("metric-glucose-high", values);
    addReason(drafts[idx], "data", "glucose", values);
  }
  if (m && typeof m.hemoglobin === "number" && m.hemoglobin < 11) {
    const values = { hemoglobin: String(m.hemoglobin) };
    const idx = drafts.length;
    push("metric-hemoglobin-low", values);
    addReason(drafts[idx], "data", "hemoglobin", values);
  }

  // ---- Symptoms (latest stored severity) ----
  if (ctx.latestSymptom?.severity) {
    const severityLabel = SYMPTOM_SEVERITY_LABELS[ctx.latestSymptom.severity];
    if (severityLabel) {
      const values = { severity: severityLabel };
      let key: string | undefined;
      if (ctx.latestSymptom.severity === "critical") key = "symptom-critical";
      else if (ctx.latestSymptom.severity === "severe") key = "symptom-severe";
      else if (ctx.latestSymptom.severity === "moderate") key = "symptom-moderate";
      if (key) {
        const idx = drafts.length;
        push(key, values);
        addReason(drafts[idx], "data", "symptom", values);
      }
    }
  }

  return drafts;
}

/**
 * Builds the engine context from persisted data. Only completed assessment
 * results are read; pending / unavailable assessments are ignored.
 */
export async function buildContext(userId: string): Promise<EngineContext> {
  const [profile, maternal, gdm, ppd, latestSymptom, sysBP, diaBP, glucose, hemoglobin] =
    await Promise.all([
      PregnancyProfile.findOne({ user: userId }).lean(),
      MaternalRiskAssessment.findOne({ user: userId, status: "completed" })
        .sort({ createdAt: -1 })
        .lean(),
      GDMAssessment.findOne({ user: userId, status: "completed" })
        .sort({ createdAt: -1 })
        .lean(),
      PPDAssessment.findOne({ user: userId, status: "completed" })
        .sort({ createdAt: -1 })
        .lean(),
      Symptom.findOne({ user: userId }).sort({ date: -1 }).lean(),
      HealthMetric.findOne({ user: userId, systolicBP: { $exists: true } })
        .sort({ date: -1 })
        .lean(),
      HealthMetric.findOne({ user: userId, diastolicBP: { $exists: true } })
        .sort({ date: -1 })
        .lean(),
      HealthMetric.findOne({ user: userId, glucose: { $exists: true } })
        .sort({ date: -1 })
        .lean(),
      HealthMetric.findOne({ user: userId, hemoglobin: { $exists: true } })
        .sort({ date: -1 })
        .lean(),
    ]);

  const ctx: EngineContext = { user: userId };

  if (profile) {
    ctx.trimester = profile.trimester;
    ctx.isHighRisk = profile.isHighRisk ?? false;
  }

  if (maternal && maternal.riskLevel) {
    ctx.maternal = {
      riskLevel: maternal.riskLevel,
      modelVersion: maternal.modelVersion,
      assessmentId: String(maternal._id),
    };
  }
  if (gdm && gdm.riskLevel) {
    ctx.gdm = {
      riskLevel: gdm.riskLevel,
      modelVersion: gdm.modelVersion,
      assessmentId: String(gdm._id),
    };
  }
  if (ppd && ppd.severity) {
    ctx.ppd = {
      severity: ppd.severity,
      modelVersion: ppd.modelVersion,
      assessmentId: String(ppd._id),
    };
  }

  if (latestSymptom?.severity) {
    ctx.latestSymptom = { severity: latestSymptom.severity };
  }

  if (sysBP || diaBP || glucose || hemoglobin) {
    ctx.latestMetrics = {
      systolicBP: (sysBP?.systolicBP as number | undefined) ?? (diaBP?.systolicBP as number | undefined),
      diastolicBP:
        (diaBP?.diastolicBP as number | undefined) ?? (sysBP?.diastolicBP as number | undefined),
      glucose: glucose?.glucose as number | undefined,
      hemoglobin: hemoglobin?.hemoglobin as number | undefined,
    };
  }

  return ctx;
}

async function draftAlreadyExists(
  userId: string,
  draft: RecommendationDraft
): Promise<boolean> {
  if (draft.references && draft.references.length > 0) {
    const assessmentId = draft.references[0].assessmentId;
    const found = await Recommendation.exists({
      user: userId,
      sourceType: "SYSTEM",
      templateKey: draft.templateKey,
      "references.assessmentId": assessmentId as never,
    });
    return Boolean(found);
  }
  const found = await Recommendation.exists({
    user: userId,
    sourceType: "SYSTEM",
    templateKey: draft.templateKey,
    references: { $size: 0 },
  });
  return Boolean(found);
}

/**
 * Idempotent: evaluates the recommendations for a user and persists any drafts
 * that are not already present (deduped by assessment reference where it
 * exists, otherwise by template key). Returns the number of new records.
 */
export async function generateAndPersistForUser(userId: string): Promise<number> {
  const ctx = await buildContext(userId);
  const drafts = recommendationsForContext(ctx);
  let created = 0;
  for (const draft of drafts) {
    if (await draftAlreadyExists(userId, draft)) continue;
    await Recommendation.create({
      user: userId,
      category: draft.category,
      title: draft.title,
      content: draft.content,
      priority: draft.priority,
      isPersonalized: draft.isPersonalized,
      source: draft.source,
      sourceType: draft.sourceType,
      titleLocalized: draft.titleLocalized,
      contentLocalized: draft.contentLocalized,
      reason: draft.reason,
      reasonLocalized: draft.reasonLocalized,
      references: draft.references,
      templateKey: draft.templateKey,
    });
    created += 1;
  }
  return created;
}

/**
 * Generation trigger used by the assessment flow: persists new drafts for the
 * user and returns the current titles of SYSTEM recommendations that reference
 * the given assessment (for storing on the assessment document). Errors are
 * swallowed so content generation never breaks the assessment response.
 */
export async function refreshRecommendationsForAssessment(
  userId: string,
  assessmentId: string
): Promise<string[]> {
  try {
    await generateAndPersistForUser(userId);
    const recs = await Recommendation.find({
      user: userId,
      sourceType: "SYSTEM",
      "references.assessmentId": assessmentId as never,
    })
      .sort({ priority: 1, createdAt: 1 })
      .lean();
    return recs.map((r) => r.title);
  } catch {
    return [];
  }
}