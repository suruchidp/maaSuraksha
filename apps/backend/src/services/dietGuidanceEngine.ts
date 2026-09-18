import { pregnancyAge } from "@maasuraksha/shared";
import { MaternalRiskAssessment } from "../models/MaternalRiskAssessment";
import { GDMAssessment } from "../models/GDMAssessment";
import { PregnancyProfile } from "../models/PregnancyProfile";
import { HealthMetric } from "../models/HealthMetric";
import { Symptom } from "../models/Symptom";
import { DietGuidance } from "../models/DietGuidance";
import { DietGuidancePreferences } from "../models/DietGuidancePreferences";
import { RISK_LEVEL_LABELS, SYMPTOM_SEVERITY_LABELS } from "./recommendationContent";
import {
  DIET_CONTENT_VERSION,
  DIET_DISCLAIMER,
  DIET_FOOD_SAFETY,
  DIET_GDM,
  DIET_GUIDANCE_HEADINGS,
  DIET_HIGH_RISK,
  DIET_HYDRATION,
  DIET_MEAL_EXAMPLES,
  DIET_MEAL_TITLE,
  DIET_METRIC,
  DIET_SOURCES,
  DIET_STAGE,
  DIET_STAGE_MISSING,
  DIET_SUBSTITUTIONS,
  DIET_SYMPTOM,
  MEAL_SLOT_LABELS,
  fillLocalizedText,
  localizedDietReason,
  type LocalizedText,
} from "./dietContent";
import type { DietMealPreference, DietRegion, DietGuidanceIntent } from "@maasuraksha/shared";

/**
 * MaaSuraksha diet guidance engine v1.
 *
 * Deterministic, rule-based and fully testable: given a snapshot of REAL
 * persisted values (completed assessment results, stored readings, profile,
 * user-selected preferences), it emits diet guidance drafts from the
 * hand-authored multilingual knowledge base.
 *
 * Safety contract:
 * - Educational decision support only; never a prescription or a diagnosis.
 * - Every {placeholder} is filled ONLY from stored values, never invented.
 * - pending / unavailable assessments are never used.
 * - GDM guidance is produced ONLY from a COMPLETED GDM assessment with
 *   moderate or high risk; a glucose reading or symptom alone never triggers it.
 * - No calorie, macronutrient, supplement or medication advice is generated.
 * - Mood / journal data is never used.
 */

export interface DietGuidanceContext {
  user: string;
  trimester?: 1 | 2 | 3;
  isHighRisk?: boolean;
  maternal?: {
    riskLevel?: string;
    modelVersion?: string;
    assessmentId: string;
  };
  gdm?: { riskLevel?: string; modelVersion?: string; assessmentId: string };
  latestSymptom?: { severity?: string };
  latestMetrics?: {
    systolicBP?: number;
    diastolicBP?: number;
    glucose?: number;
    hemoglobin?: number;
  };
  preferences: {
    set: boolean;
    mealPreference: DietMealPreference;
    region?: DietRegion;
  };
}

export interface DietSectionInput {
  key: string;
  heading: LocalizedText;
  body?: LocalizedText;
  bullets?: LocalizedText[];
}

export interface DietGuidanceDraft {
  sourceType: "SYSTEM";
  templateKey: string;
  dedupeKey: string;
  intent: DietGuidanceIntent;
  contentVersion: string;
  priority: "low" | "medium" | "high";
  title: string;
  titleLocalized: LocalizedText;
  sections: DietSectionInput[];
  rationale: string;
  rationaleLocalized: LocalizedText;
  disclaimer: string;
  disclaimerLocalized: LocalizedText;
  attribution: { id: string; title: string; url: string }[];
  references?: {
    assessmentId: string;
    assessmentType: "maternal" | "gdm";
    modelVersion?: string;
  }[];
}

const DEFAULT_PREFERENCE: DietMealPreference = "vegetarian";
const DEFAULT_REGION: DietRegion = "other";

const mealSlots = ["breakfast", "lunch", "snacks", "dinner"] as const;

function defaultAttribution(addNhm = false): { id: string; title: string; url: string }[] {
  const ids = ["icmr", "fssai", "who"];
  if (addNhm) ids.push("nhm");
  return ids.map((id) => ({
    id: DIET_SOURCES[id].id,
    title: DIET_SOURCES[id].title,
    url: DIET_SOURCES[id].url,
  }));
}

function modelSuffix(modelVersion?: string): string {
  return modelVersion ? ` (model ${modelVersion})` : "";
}

function makeGuidanceSections(
  body: LocalizedText,
  bullets: LocalizedText[],
  values: Record<string, string | LocalizedText> = {}
): DietSectionInput[] {
  return [
    {
      key: "guidance",
      heading: DIET_GUIDANCE_HEADINGS.guidance,
      body: fillLocalizedText(body, values),
      bullets: bullets.map((b) => fillLocalizedText(b, values)),
    },
  ];
}

/** Pure rule evaluation. Never touches the database; ideal for unit tests. */
export function deriveDietGuidance(ctx: DietGuidanceContext): DietGuidanceDraft[] {
  const drafts: DietGuidanceDraft[] = [];

  const push = (
    draft: Omit<
      DietGuidanceDraft,
      "sourceType" | "contentVersion" | "disclaimer" | "disclaimerLocalized" | "title" | "rationale"
    >
  ): void => {
    drafts.push({
      ...draft,
      sourceType: "SYSTEM",
      contentVersion: DIET_CONTENT_VERSION,
      title: draft.titleLocalized.en,
      rationale: draft.rationaleLocalized.en,
      disclaimer: DIET_DISCLAIMER.en,
      disclaimerLocalized: DIET_DISCLAIMER,
    });
  };

  const refFrom = (
    id: string,
    type: "maternal" | "gdm",
    modelVersion?: string
  ): { assessmentId: string; assessmentType: "maternal" | "gdm"; modelVersion?: string }[] =>
    [{ assessmentId: id, assessmentType: type, modelVersion }];

  /* ---- Stage (from the pregnancy profile; honest fallback when absent) ---- */
  if (ctx.trimester === 1 || ctx.trimester === 2 || ctx.trimester === 3) {
    const tpl = DIET_STAGE[String(ctx.trimester) as "1" | "2" | "3"];
    const values = { trimester: String(ctx.trimester) };
    push({
      templateKey: `stage-trimester-${ctx.trimester}`,
      dedupeKey: `stage-trimester-${ctx.trimester}:base`,
      intent: "stage",
      priority: "low",
      titleLocalized: tpl.title,
      sections: makeGuidanceSections(tpl.body, tpl.bullets, values),
      rationaleLocalized: localizedDietReason("data", "stage", values),
      attribution: defaultAttribution(),
    });
  } else {
    const tpl = DIET_STAGE_MISSING;
    push({
      templateKey: "stage-missing",
      dedupeKey: "stage-missing:base",
      intent: "stage-missing",
      priority: "low",
      titleLocalized: tpl.title,
      sections: makeGuidanceSections(tpl.body, tpl.bullets),
      rationaleLocalized: localizedDietReason("data", "stage-missing", {}),
      attribution: defaultAttribution(),
    });
  }

  /* ---- High-risk review (profile flag OR completed maternal high/critical) ---- */
  const maternalHigh =
    ctx.maternal?.riskLevel === "high" || ctx.maternal?.riskLevel === "critical";
  if (ctx.isHighRisk || maternalHigh) {
    const tpl = DIET_HIGH_RISK;
    const values: Record<string, string | LocalizedText> = {};
    let reasonSourceKey: "highRiskProfile" | "highRiskMaternal" = "highRiskProfile";
    let references: { assessmentId: string; assessmentType: "maternal" | "gdm"; modelVersion?: string }[] | undefined;
    if (maternalHigh && ctx.maternal) {
      reasonSourceKey = "highRiskMaternal";
      values.model = modelSuffix(ctx.maternal.modelVersion);
      references = refFrom(ctx.maternal.assessmentId, "maternal", ctx.maternal.modelVersion);
    }
    push({
      templateKey: "high-risk-review",
      dedupeKey: references
        ? `high-risk-review:${references[0].assessmentId}`
        : "high-risk-review:base",
      intent: "high-risk",
      priority: "high",
      titleLocalized: tpl.title,
      sections: makeGuidanceSections(tpl.body, tpl.bullets, values),
      rationaleLocalized: localizedDietReason(
        "data",
        reasonSourceKey,
        values
      ),
      attribution: defaultAttribution(true),
      references,
    });
  }

  /* ---- GDM (completed moderate/high assessment ONLY; never from readings) ---- */
  if (ctx.gdm?.riskLevel === "moderate" || ctx.gdm?.riskLevel === "high") {
    const tpl = DIET_GDM;
    const level =
      RISK_LEVEL_LABELS[ctx.gdm.riskLevel] ?? RISK_LEVEL_LABELS.moderate;
    const values = {
      level,
      model: modelSuffix(ctx.gdm.modelVersion),
    };
    const references = ctx.gdm
      ? refFrom(ctx.gdm.assessmentId, "gdm", ctx.gdm.modelVersion)
      : undefined;
    push({
      templateKey: "gdm-guidance",
      dedupeKey: references
        ? `gdm-guidance:${references[0].assessmentId}`
        : "gdm-guidance:base",
      intent: "gdm",
      priority: "high",
      titleLocalized: tpl.title,
      sections: makeGuidanceSections(tpl.body, tpl.bullets, values),
      rationaleLocalized: localizedDietReason("risk", "gdm", values),
      attribution: defaultAttribution(true),
      references,
    });
  }

  /* ---- Metrics (latest stored readings; educational, non-diagnostic) ---- */
  const m = ctx.latestMetrics;
  if (m && typeof m.hemoglobin === "number" && m.hemoglobin < 11) {
    const tpl = DIET_METRIC.iron;
    const values = { hemoglobin: String(m.hemoglobin) };
    push({
      templateKey: "metric-iron",
      dedupeKey: "metric-iron:base",
      intent: "metrics",
      priority: "medium",
      titleLocalized: tpl.title,
      sections: makeGuidanceSections(tpl.body, tpl.bullets, values),
      rationaleLocalized: localizedDietReason("data", "hemoglobin", values),
      attribution: defaultAttribution(),
    });
  }
  if (
    m &&
    typeof m.systolicBP === "number" &&
    typeof m.diastolicBP === "number" &&
    (m.systolicBP >= 140 || m.diastolicBP >= 90)
  ) {
    const tpl = DIET_METRIC.bp;
    const values = { sys: String(m.systolicBP), dia: String(m.diastolicBP) };
    push({
      templateKey: "metric-bp",
      dedupeKey: "metric-bp:base",
      intent: "metrics",
      priority: "high",
      titleLocalized: tpl.title,
      sections: makeGuidanceSections(tpl.body, tpl.bullets, values),
      rationaleLocalized: localizedDietReason("data", "bp", values),
      attribution: defaultAttribution(),
    });
  }
  if (m && typeof m.glucose === "number" && m.glucose >= 140) {
    const tpl = DIET_METRIC.glucose;
    const values = { glucose: String(m.glucose) };
    push({
      templateKey: "metric-glucose",
      dedupeKey: "metric-glucose:base",
      intent: "metrics",
      priority: "medium",
      titleLocalized: tpl.title,
      sections: makeGuidanceSections(tpl.body, tpl.bullets, values),
      rationaleLocalized: localizedDietReason("data", "glucose", values),
      attribution: defaultAttribution(),
    });
  }

  /* ---- Symptoms (latest, severe/critical only; never names a condition) ---- */
  const severity = ctx.latestSymptom?.severity;
  if (severity === "severe" || severity === "critical") {
    const tpl = DIET_SYMPTOM;
    const level = SYMPTOM_SEVERITY_LABELS[severity] ?? SYMPTOM_SEVERITY_LABELS.moderate;
    const values = { severity: level, level };
    push({
      templateKey: "symptom-caution",
      dedupeKey: "symptom-caution:base",
      intent: "symptom",
      priority: "high",
      titleLocalized: tpl.title,
      sections: makeGuidanceSections(tpl.body, tpl.bullets, values),
      rationaleLocalized: localizedDietReason("severity", "symptom", values),
      attribution: defaultAttribution(),
    });
  }

  /* ---- Meal examples (always; preference/region personalization) ---- */
  const preference = ctx.preferences.mealPreference ?? DEFAULT_PREFERENCE;
  const region = ctx.preferences.region ?? DEFAULT_REGION;
  const set = ctx.preferences.set;
  const examples = DIET_MEAL_EXAMPLES[preference][region] ?? DIET_MEAL_EXAMPLES[preference]["other"];
  const sections: DietSectionInput[] = [
    { key: "meals.note", heading: DIET_GUIDANCE_HEADINGS.note, body: examples.note },
  ];
  for (const slot of mealSlots) {
    sections.push({
      key: `meals.${slot}`,
      heading: MEAL_SLOT_LABELS[slot],
      bullets: examples[slot],
    });
  }
  sections.push(
    {
      key: "substitutions",
      heading: DIET_GUIDANCE_HEADINGS.substitutions,
      bullets: DIET_SUBSTITUTIONS,
    },
    {
      key: "foodSafety",
      heading: DIET_GUIDANCE_HEADINGS.foodSafety,
      bullets: DIET_FOOD_SAFETY,
    },
    { key: "hydration", heading: DIET_GUIDANCE_HEADINGS.hydration, body: DIET_HYDRATION }
  );
  const templateKey = `meals-${preference}-${region}`;
  push({
    templateKey,
    dedupeKey: `${templateKey}:base`,
    intent: "meals",
    priority: "low",
    titleLocalized: DIET_MEAL_TITLE[preference],
    sections,
    rationaleLocalized: localizedDietReason(
      "data",
      set ? "meals" : "meals-default",
      {
        preference: (DIET_MEAL_TITLE[preference] as LocalizedText).en,
        region,
      }
    ),
    attribution: defaultAttribution(),
  });

  return drafts;
}

/**
 * Builds the engine context from persisted data. Only completed assessment
 * results are read; pending / unavailable assessments are ignored.
 */
export async function buildDietContext(userId: string): Promise<DietGuidanceContext> {
  const [profile, maternal, gdm, latestSymptom, sysBP, diaBP, glucose, hemoglobin, prefs] =
    await Promise.all([
      PregnancyProfile.findOne({ user: userId }).lean(),
      MaternalRiskAssessment.findOne({ user: userId, status: "completed" })
        .sort({ createdAt: -1 })
        .lean(),
      GDMAssessment.findOne({ user: userId, status: "completed" })
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
      DietGuidancePreferences.findOne({ user: userId }).lean(),
    ]);

  const ctx: DietGuidanceContext = {
    user: userId,
    preferences: {
      set: Boolean(prefs?.mealPreference),
      mealPreference: (prefs?.mealPreference as DietMealPreference | undefined) ?? DEFAULT_PREFERENCE,
      region: (prefs?.region as DietRegion | undefined) ?? DEFAULT_REGION,
    },
  };

  if (profile && profile.status !== "completed" && !pregnancyAge(profile.lmp).datingNeedsReview) {
    ctx.trimester = pregnancyAge(profile.lmp).trimester;
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

  if (latestSymptom?.severity) {
    ctx.latestSymptom = { severity: latestSymptom.severity };
  }

  if (sysBP || diaBP || glucose || hemoglobin) {
    ctx.latestMetrics = {
      systolicBP:
        (sysBP?.systolicBP as number | undefined) ?? (diaBP?.systolicBP as number | undefined),
      diastolicBP:
        (diaBP?.diastolicBP as number | undefined) ?? (sysBP?.diastolicBP as number | undefined),
      glucose: glucose?.glucose as number | undefined,
      hemoglobin: hemoglobin?.hemoglobin as number | undefined,
    };
  }

  return ctx;
}

function toPersist(
  userId: string,
  draft: DietGuidanceDraft
): Record<string, unknown> {
  return {
    user: userId,
    sourceType: draft.sourceType,
    templateKey: draft.templateKey,
    dedupeKey: draft.dedupeKey,
    intent: draft.intent,
    contentVersion: draft.contentVersion,
    priority: draft.priority,
    title: draft.title,
    titleLocalized: draft.titleLocalized,
    sections: draft.sections,
    rationale: draft.rationale,
    rationaleLocalized: draft.rationaleLocalized,
    disclaimer: draft.disclaimer,
    disclaimerLocalized: draft.disclaimerLocalized,
    attribution: draft.attribution,
    references: draft.references?.map((r) => ({
      assessmentId: r.assessmentId as never,
      assessmentType: r.assessmentType,
      modelVersion: r.modelVersion,
    })),
  };
}

/**
 * Idempotent: derives the current diet guidance for a user and upserts each
 * record keyed by (user, dedupeKey), then removes any persisted records that
 * are no longer part of the current derivation (e.g. an outdated stage or a
 * changed meal preference). Returns the number of derived records.
 */
export async function regenerateDietGuidance(userId: string): Promise<number> {
  const ctx = await buildDietContext(userId);
  const drafts = deriveDietGuidance(ctx);
  const keys: string[] = [];
  for (const draft of drafts) {
    keys.push(draft.dedupeKey);
    await DietGuidance.findOneAndUpdate(
      { user: userId, dedupeKey: draft.dedupeKey },
      { $set: toPersist(userId, draft) },
      { upsert: true }
    );
  }
  await DietGuidance.deleteMany({
    user: userId,
    sourceType: "SYSTEM",
    dedupeKey: { $nin: keys },
  });
  return drafts.length;
}