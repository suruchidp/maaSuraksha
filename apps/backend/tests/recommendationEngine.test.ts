import { describe, it, expect, beforeAll, afterEach } from "vitest";
import mongoose from "mongoose";
import { connectTestDb, cleanDb } from "./helpers";
import {
  recommendationsForContext,
  generateAndPersistForUser,
  refreshRecommendationsForAssessment,
  type EngineContext,
} from "../src/services/recommendationEngine";
import { RECOMMENDATION_TEMPLATES } from "../src/services/recommendationContent";
import { Recommendation } from "../src/models/Recommendation";
import { MaternalRiskAssessment } from "../src/models/MaternalRiskAssessment";
import { PPDAssessment } from "../src/models/PPDAssessment";
import { PregnancyProfile } from "../src/models/PregnancyProfile";
import { HealthMetric } from "../src/models/HealthMetric";
import { Symptom } from "../src/models/Symptom";

const LANGS = ["en", "hi", "kn"] as const;

function values(rec: EngineDraftLike, key: "titleLocalized" | "contentLocalized" | "reasonLocalized") {
  return rec[key] as Record<string, string> | undefined;
}

interface EngineDraftLike {
  titleLocalized?: Record<string, string>;
  contentLocalized?: Record<string, string>;
  reasonLocalized?: Record<string, string>;
}

function expectNoUnresolvedPlaceholders(rec: EngineDraftLike) {
  for (const part of ["titleLocalized", "contentLocalized", "reasonLocalized"] as const) {
    const loc = values(rec, part);
    if (!loc) continue;
    for (const lang of LANGS) {
      expect(loc[lang], `${part}.${lang}`).toBeTruthy();
      expect(loc[lang], `${part}.${lang}`).not.toMatch(/\{[a-z]+\}/i);
    }
  }
}

function baseCtx(overrides: Partial<EngineContext> = {}): EngineContext {
  return { user: "u1", ...overrides };
}

describe("recommendation engine — pure rules", () => {
  it("emits maternal-risk-high (warning/high) for high and critical results, referencing the assessment", () => {
    for (const level of ["high", "critical"]) {
      const drafts = recommendationsForContext(
        baseCtx({
          maternal: { riskLevel: level, modelVersion: "v2", assessmentId: "a1" },
        })
      );
      expect(drafts).toHaveLength(1);
      const d = drafts[0];
      expect(d.templateKey).toBe("maternal-risk-high");
      expect(d.category).toBe("warning");
      expect(d.priority).toBe("high");
      expect(d.sourceType).toBe("SYSTEM");
      expect(d.references).toHaveLength(1);
      expect(d.references![0].assessmentType).toBe("maternal");
      expect(d.references![0].assessmentId).toBe("a1");
      expect(d.references![0].modelVersion).toBe("v2");
      expect(d.title).toContain("High maternal risk");
      expectNoUnresolvedPlaceholders(d);
    }
  });

  it("maps medium and low maternal results to medical/medium and general/low", () => {
    const medium = recommendationsForContext(
      baseCtx({ maternal: { riskLevel: "medium", assessmentId: "a1" } })
    )[0];
    expect(medium.templateKey).toBe("maternal-risk-medium");
    expect(medium.category).toBe("medical");
    expect(medium.priority).toBe("medium");

    const low = recommendationsForContext(
      baseCtx({ maternal: { riskLevel: "low", assessmentId: "a1" } })
    )[0];
    expect(low.templateKey).toBe("maternal-risk-low");
    expect(low.category).toBe("general");
    expect(low.priority).toBe("low");
  });

  it("maps GDM results to high / moderate / low templates", () => {
    const high = recommendationsForContext(
      baseCtx({ gdm: { riskLevel: "high", assessmentId: "g1" } })
    )[0];
    expect(high.templateKey).toBe("gdm-risk-high");
    expect(high.category).toBe("warning");
    expect(high.priority).toBe("high");

    const moderate = recommendationsForContext(
      baseCtx({ gdm: { riskLevel: "moderate", assessmentId: "g1" } })
    )[0];
    expect(moderate.templateKey).toBe("gdm-risk-moderate");

    const low = recommendationsForContext(
      baseCtx({ gdm: { riskLevel: "low", assessmentId: "g1" } })
    )[0];
    expect(low.templateKey).toBe("gdm-risk-low");
  });

  it("emits PPD guidance only for moderate / severe results, never for none / mild", () => {
    const moderate = recommendationsForContext(
      baseCtx({ ppd: { severity: "moderate", assessmentId: "p1" } })
    )[0];
    expect(moderate.templateKey).toBe("ppd-risk-moderate");
    expect(moderate.category).toBe("mental_health");
    expect(moderate.priority).toBe("medium");

    const severe = recommendationsForContext(
      baseCtx({ ppd: { severity: "severe", assessmentId: "p1" } })
    )[0];
    expect(severe.templateKey).toBe("ppd-risk-severe");
    expect(severe.priority).toBe("high");

    expect(
      recommendationsForContext(baseCtx({ ppd: { severity: "none", assessmentId: "p1" } }))
    ).toHaveLength(0);
    expect(
      recommendationsForContext(baseCtx({ ppd: { severity: "mild", assessmentId: "p1" } }))
    ).toHaveLength(0);
  });

  it("never emits assessment-based guidance without a real completed result", () => {
    expect(recommendationsForContext(baseCtx())).toHaveLength(0);
    expect(
      recommendationsForContext(baseCtx({ maternal: { assessmentId: "a1" } })).filter(
        (d) => d.references && d.references.length > 0
      )
    ).toHaveLength(0);
    expect(
      recommendationsForContext(baseCtx({ ppd: { assessmentId: "p1" } }))
    ).toHaveLength(0);
  });

  it("emits trimester guidance and high-risk pregnancy guidance from the profile", () => {
    const drafts = recommendationsForContext(
      baseCtx({ trimester: 2, isHighRisk: true })
    );
    const keys = drafts.map((d) => d.templateKey).sort();
    expect(keys).toEqual(["pregnancy-high-risk", "pregnancy-trimester-2"]);
    const highRisk = drafts.find((d) => d.templateKey === "pregnancy-high-risk")!;
    expect(highRisk.category).toBe("medical");
    expect(highRisk.priority).toBe("high");
    expectNoUnresolvedPlaceholders(highRisk);
  });

  it("emits metric guidance only from real elevated readings", () => {
    const drafts = recommendationsForContext(
      baseCtx({
        latestMetrics: { systolicBP: 150, diastolicBP: 95, glucose: 155, hemoglobin: 9.4 },
      })
    );
    const keys = drafts.map((d) => d.templateKey).sort();
    expect(keys).toEqual([
      "metric-bp-high",
      "metric-glucose-high",
      "metric-hemoglobin-low",
    ]);
    const bp = drafts.find((d) => d.templateKey === "metric-bp-high")!;
    expect(bp.category).toBe("warning");
    expect(bp.priority).toBe("high");
    expect(bp.content).toContain("150/95");
    expectNoUnresolvedPlaceholders(bp);

    expect(
      recommendationsForContext(
        baseCtx({ latestMetrics: { systolicBP: 120, diastolicBP: 75, glucose: 110, hemoglobin: 12 } })
      )
    ).toHaveLength(0);

    expect(
      recommendationsForContext(
        baseCtx({ latestMetrics: { systolicBP: 150 } })
      )
    ).toHaveLength(0);
  });

  it("emits symptom guidance only at moderate severity or above", () => {
    const critical = recommendationsForContext(
      baseCtx({ latestSymptom: { severity: "critical" } })
    )[0];
    expect(critical.templateKey).toBe("symptom-critical");
    expect(critical.category).toBe("warning");
    expect(critical.priority).toBe("high");

    const severe = recommendationsForContext(
      baseCtx({ latestSymptom: { severity: "severe" } })
    )[0];
    expect(severe.templateKey).toBe("symptom-severe");
    expect(severe.priority).toBe("high");

    const moderate = recommendationsForContext(
      baseCtx({ latestSymptom: { severity: "moderate" } })
    )[0];
    expect(moderate.templateKey).toBe("symptom-moderate");

    expect(
      recommendationsForContext(baseCtx({ latestSymptom: { severity: "mild" } }))
    ).toHaveLength(0);
  });

  it("satisfies storage limits and full localization across every template", () => {
    const templateKeys = Object.keys(RECOMMENDATION_TEMPLATES);
    expect(templateKeys.length).toBeGreaterThanOrEqual(15);
    for (const key of templateKeys) {
      const tpl = RECOMMENDATION_TEMPLATES[key];
      expect(tpl.title.en.length, `${key} title`).toBeLessThanOrEqual(200);
      expect(tpl.content.en.length, `${key} content`).toBeLessThanOrEqual(2000);
      for (const lang of LANGS) {
        expect(tpl.title[lang], `${key} title.${lang}`).toBeTruthy();
        expect(tpl.content[lang], `${key} content.${lang}`).toBeTruthy();
      }
    }
  });
});

describe("recommendation engine — persistence", () => {
  beforeAll(connectTestDb);
  afterEach(cleanDb);

  it("generates an assessment-linked SYSTEM recommendation exactly once (idempotent)", async () => {
    const userId = new mongoose.Types.ObjectId();
    const assessment = await MaternalRiskAssessment.create({
      user: userId,
      assessedBy: userId,
      status: "completed",
      riskLevel: "high",
      riskScore: 0.91,
      riskFactors: [],
      recommendations: [],
      inputFeatures: {},
      modelVersion: "v1-test",
    });

    expect(await generateAndPersistForUser(String(userId))).toBe(1);
    expect(await generateAndPersistForUser(String(userId))).toBe(0);

    const recs = await Recommendation.find({ user: userId, sourceType: "SYSTEM" });
    expect(recs).toHaveLength(1);
    expect(recs[0].templateKey).toBe("maternal-risk-high");
    expect(recs[0].category).toBe("warning");
    expect(recs[0].priority).toBe("high");
    expect(recs[0].sourceType).toBe("SYSTEM");
    expect(recs[0].source).toBeDefined();
    expect(recs[0].titleLocalized).toBeDefined();
    expect(recs[0].contentLocalized).toBeDefined();
    expect(recs[0].reasonLocalized).toBeDefined();
    expect(recs[0].references).toHaveLength(1);
    expect(recs[0].references![0].assessmentId.toString()).toBe(String(assessment._id));
    expect(recs[0].references![0].assessmentType).toBe("maternal");
    expect(recs[0].references![0].modelVersion).toBe("v1-test");

    const titles = await refreshRecommendationsForAssessment(
      String(userId),
      String(assessment._id)
    );
    expect(titles).toContain(recs[0].title);
  });

  it("never generates from a pending assessment", async () => {
    const userId = new mongoose.Types.ObjectId();
    await MaternalRiskAssessment.create({
      user: userId,
      assessedBy: userId,
      status: "pending",
      riskFactors: [],
      recommendations: [],
      inputFeatures: {},
    });
    expect(await generateAndPersistForUser(String(userId))).toBe(0);
    expect(await Recommendation.countDocuments({ user: userId })).toBe(0);
  });

  it("generates profile / metric / symptom guidance but only once per template", async () => {
    const userId = new mongoose.Types.ObjectId();
    await PregnancyProfile.create({
      user: userId,
      lmp: new Date(Date.now() - 24 * 7 * 86400000),
      expectedDueDate: new Date("2026-09-01"),
      gestationalWeek: 22,
      trimester: 2,
      isHighRisk: true,
    });
    await HealthMetric.create({
      user: userId,
      date: new Date(),
      systolicBP: 148,
      diastolicBP: 96,
      glucose: 160,
    });
    await Symptom.create({
      user: userId,
      date: new Date(),
      symptoms: ["headache"],
      severity: "critical",
      reportedBy: userId,
    });

    expect(await generateAndPersistForUser(String(userId))).toBe(5);
    expect(await generateAndPersistForUser(String(userId))).toBe(0);

    const recs = await Recommendation.find({ user: userId, sourceType: "SYSTEM" }).lean();
    expect(recs.map((r) => r.templateKey).sort()).toEqual([
      "metric-bp-high",
      "metric-glucose-high",
      "pregnancy-high-risk",
      "pregnancy-trimester-2",
      "symptom-critical",
    ]);
    for (const rec of recs) {
      if (rec.references && rec.references.length > 0) {
        expect(rec.references).toHaveLength(1);
      }
    }
  });

  it("never pairs systolic and diastolic readings from different metric records", async () => {
    const userId = new mongoose.Types.ObjectId();
    await HealthMetric.create({
      user: userId,
      date: new Date(Date.now() - 2 * 86400000),
      systolicBP: 165,
    });
    await HealthMetric.create({
      user: userId,
      date: new Date(),
      diastolicBP: 95,
    });
    expect(await generateAndPersistForUser(String(userId))).toBe(0);
    expect(await Recommendation.countDocuments({ user: userId })).toBe(0);
  });

  it("emits the blood pressure recommendation from a single metric record only", async () => {
    const userId = new mongoose.Types.ObjectId();
    await HealthMetric.create({
      user: userId,
      date: new Date(),
      systolicBP: 150,
      diastolicBP: 96,
    });
    expect(await generateAndPersistForUser(String(userId))).toBe(1);
    const recs = await Recommendation.find({ user: userId, sourceType: "SYSTEM" }).lean();
    expect(recs[0].templateKey).toBe("metric-bp-high");
    expect(recs[0].content).toContain("150");
    expect(recs[0].content).toContain("96");
  });

  it("keeps PPD results out unless the assessment is completed (mood data ignored)", async () => {
    const userId = new mongoose.Types.ObjectId();
    const pending = await PPDAssessment.create({
      user: userId,
      assessedBy: userId,
      status: "pending",
      riskFactors: [],
      recommendations: [],
      screeningText: "I feel very low all the time",
    });
    expect(await generateAndPersistForUser(String(userId))).toBe(0);

    await PPDAssessment.updateOne(
      { _id: pending._id },
      { $set: { status: "completed", severity: "severe", modelVersion: "v1-test" } }
    );
    expect(await generateAndPersistForUser(String(userId))).toBe(1);

    const recs = await Recommendation.find({ user: userId, sourceType: "SYSTEM" });
    expect(recs[0].templateKey).toBe("ppd-risk-severe");
    expect(recs[0].references![0].assessmentType).toBe("ppd");
  });
});