import { describe, it, expect, beforeAll, afterEach, beforeEach } from "vitest";
import mongoose from "mongoose";
import { connectTestDb, cleanDb, api } from "./helpers";
import {
  deriveDietGuidance,
  buildDietContext,
  regenerateDietGuidance,
  type DietGuidanceContext,
} from "../src/services/dietGuidanceEngine";
import { DIET_CONTENT_VERSION, DIET_DISCLAIMER } from "../src/services/dietContent";
import { DietGuidance } from "../src/models/DietGuidance";
import { DietGuidancePreferences } from "../src/models/DietGuidancePreferences";
import { GDMAssessment } from "../src/models/GDMAssessment";
import { PregnancyProfile } from "../src/models/PregnancyProfile";
import { HealthMetric } from "../src/models/HealthMetric";
import { Symptom } from "../src/models/Symptom";
import { MaternalRiskAssessment } from "../src/models/MaternalRiskAssessment";
import { User } from "../src/models/User";
import { UserRole } from "@maasuraksha/shared";

const LANGS = ["en", "hi", "kn"] as const;

function baseCtx(overrides: Partial<DietGuidanceContext> = {}): DietGuidanceContext {
  return {
    user: "u1",
    preferences: { set: false, mealPreference: "vegetarian", region: "other" },
    ...overrides,
  };
}

function keys(drafts: { templateKey: string }[]): string[] {
  return drafts.map((d) => d.templateKey).sort();
}

function expectNoUnresolvedPlaceholders(drafts: {
  titleLocalized: Record<string, string>;
  rationaleLocalized?: Record<string, string>;
  disclaimerLocalized: Record<string, string>;
  sections: {
    heading: Record<string, string>;
    body?: Record<string, string>;
    bullets?: Record<string, string>[];
  }[];
}): void {
  const texts: Record<string, string>[] = [drafts.titleLocalized, drafts.disclaimerLocalized];
  if (drafts.rationaleLocalized) texts.push(drafts.rationaleLocalized);
  for (const s of drafts.sections) {
    texts.push(s.heading);
    if (s.body) texts.push(s.body);
    for (const b of s.bullets ?? []) texts.push(b);
  }
  for (const t of texts) {
    for (const lang of LANGS) {
      expect(t[lang], `localized.${lang}`).toBeTruthy();
      expect(t[lang], `unresolved.${lang}`).not.toMatch(/\{[a-z]+\}/i);
    }
  }
}

function expectLocalizedQuality(drafts: {
  titleLocalized: Record<string, string>;
  rationaleLocalized?: Record<string, string>;
  disclaimerLocalized: Record<string, string>;
}[]): void {
  for (const d of drafts) {
    expect(d.titleLocalized.en.length).toBeLessThanOrEqual(200);
    if (d.rationaleLocalized?.en) {
      expect(d.rationaleLocalized.en.length).toBeLessThanOrEqual(400);
    }
  }
}

describe("diet guidance engine — pure rules", () => {
  it("always emits a stage card and a meal card, fully localized, for any context", () => {
    const drafts = deriveDietGuidance(baseCtx());
    expect(keys(drafts)).toEqual(["meals-vegetarian-other", "stage-missing"]);

    for (const d of drafts) {
      expect(d.sourceType).toBe("SYSTEM");
      expect(d.contentVersion).toBe(DIET_CONTENT_VERSION);
      expect(d.disclaimer).toBe(DIET_DISCLAIMER.en);
      expect(d.disclaimerLocalized).toBeDefined();
      expect(d.attribution.length).toBeGreaterThan(0);
      expect(d.priority).toBe("low");
      expectNoUnresolvedPlaceholders(d);
    }
    expectLocalizedQuality(drafts);
  });

  it("maps the trimester from the profile to stage-trimester-{N}", () => {
    for (const trimester of [1, 2, 3] as const) {
      const drafts = deriveDietGuidance(
        baseCtx({ trimester, preferences: { set: false, mealPreference: "vegetarian" } })
      );
      expect(drafts.some((d) => d.templateKey === `stage-trimester-${trimester}`)).toBe(true);
      const stage = drafts.find((d) => d.templateKey === `stage-trimester-${trimester}`)!;
      expect(stage.priority).toBe("low");
      expectNoUnresolvedPlaceholders(stage);
    }
  });

  it("never invents a trimester when the profile is missing", () => {
    const drafts = deriveDietGuidance(baseCtx());
    expect(drafts.some((d) => d.templateKey === "stage-missing")).toBe(true);
    expect(drafts.every((d) => !d.templateKey.startsWith("stage-trimester"))).toBe(true);
  });

  it("flags high-risk review from the profile flag, without assessment references", () => {
    const drafts = deriveDietGuidance(
      baseCtx({ isHighRisk: true, preferences: { set: false, mealPreference: "vegetarian" } })
    );
    const card = drafts.find((d) => d.templateKey === "high-risk-review")!;
    expect(card.priority).toBe("high");
    expect(card.references).toBeUndefined();
    expectNoUnresolvedPlaceholders(card);
    expect(card.attribution.map((a) => a.id)).toContain("nhm-gdm");
  });

  it("flags high-risk review from a completed maternal high/critical assessment with a reference", () => {
    for (const level of ["high", "critical"]) {
      const drafts = deriveDietGuidance(
        baseCtx({ maternal: { riskLevel: level, modelVersion: "v2", assessmentId: "a1" } })
      );
      const card = drafts.find((d) => d.templateKey === "high-risk-review")!;
      expect(card.priority).toBe("high");
      expect(card.references).toHaveLength(1);
      expect(card.references![0].assessmentType).toBe("maternal");
      expect(card.references![0].assessmentId).toBe("a1");
      expect(card.references![0].modelVersion).toBe("v2");
      expectNoUnresolvedPlaceholders(card);
    }
  });

  it("does not flag high-risk review for a medium maternal result", () => {
    const drafts = deriveDietGuidance(
      baseCtx({ maternal: { riskLevel: "medium", assessmentId: "a1" } })
    );
    expect(drafts.some((d) => d.templateKey === "high-risk-review")).toBe(false);
  });

  it("emits GDM guidance only for completed moderate/high risk, referencing the GDM assessment", () => {
    for (const level of ["moderate", "high"]) {
      const drafts = deriveDietGuidance(
        baseCtx({ gdm: { riskLevel: level, modelVersion: "v3", assessmentId: "g1" } })
      );
      const card = drafts.find((d) => d.templateKey === "gdm-guidance")!;
      expect(card.priority).toBe("high");
      expect(card.references).toHaveLength(1);
      expect(card.references![0].assessmentType).toBe("gdm");
      expect(card.references![0].assessmentId).toBe("g1");
      expectNoUnresolvedPlaceholders(card);
      expect(card.rationale.toLowerCase()).toContain(level);
    }
  });

  it("never emits GDM guidance from a low-risk result, a glucose reading, a symptom, or no data", () => {
    const low = deriveDietGuidance(baseCtx({ gdm: { riskLevel: "low", assessmentId: "g1" } }));
    expect(low.some((d) => d.templateKey === "gdm-guidance")).toBe(false);

    const readingOnly = deriveDietGuidance(
      baseCtx({ latestMetrics: { glucose: 190 } })
    );
    expect(readingOnly.some((d) => d.templateKey === "gdm-guidance")).toBe(false);

    const symptomOnly = deriveDietGuidance(
      baseCtx({ latestSymptom: { severity: "severe" } })
    );
    expect(symptomOnly.some((d) => d.templateKey === "gdm-guidance")).toBe(false);

    const bareAssessment = deriveDietGuidance(baseCtx({ gdm: { assessmentId: "g9" } }));
    expect(bareAssessment.some((d) => d.templateKey === "gdm-guidance")).toBe(false);
  });

  it("emits metric cards only at thresholds, embedding the real stored values", () => {
    const drafts = deriveDietGuidance(
      baseCtx({
        latestMetrics: { systolicBP: 148, diastolicBP: 96, glucose: 165, hemoglobin: 9.4 },
      })
    );
    expect(keys(drafts)).toEqual([
      "meals-vegetarian-other",
      "metric-bp",
      "metric-glucose",
      "metric-iron",
      "stage-missing",
    ]);
    const bp = drafts.find((d) => d.templateKey === "metric-bp")!;
    const glucose = drafts.find((d) => d.templateKey === "metric-glucose")!;
    const iron = drafts.find((d) => d.templateKey === "metric-iron")!;
    expect(iron.priority).toBe("medium");
    expect(bp.priority).toBe("high");
    expect(glucose.priority).toBe("medium");
    expect(bp.rationale).toContain("148/96");
    expect(iron.rationale).toContain("9.4");
    expect(glucose.rationale).toContain("165");
    // a single reading is never framed as a diabetes result
    expect(glucose.rationale.toLowerCase()).not.toContain("diabet");
    for (const card of [bp, glucose, iron]) expectNoUnresolvedPlaceholders(card);

    const normal = deriveDietGuidance(
      baseCtx({
        latestMetrics: { systolicBP: 116, diastolicBP: 74, glucose: 112, hemoglobin: 12.1 },
      })
    );
    expect(normal.some((d) => d.templateKey.startsWith("metric"))).toBe(false);
  });

  it("requires both systolic and diastolic values before flagging blood pressure", () => {
    const partial = deriveDietGuidance(baseCtx({ latestMetrics: { systolicBP: 150 } }));
    expect(partial.some((d) => d.templateKey === "metric-bp")).toBe(false);
  });

  it("emits a symptom caution only at severe or critical severity", () => {
    for (const severity of ["severe", "critical"]) {
      const drafts = deriveDietGuidance(baseCtx({ latestSymptom: { severity } }));
      const card = drafts.find((d) => d.templateKey === "symptom-caution")!;
      expect(card.priority).toBe("high");
      expectNoUnresolvedPlaceholders(card);
      expect(card.rationale.toLowerCase()).toContain(severity);
    }
    expect(
      deriveDietGuidance(baseCtx({ latestSymptom: { severity: "mild" } })).some(
        (d) => d.templateKey === "symptom-caution"
      )
    ).toBe(false);
    expect(
      deriveDietGuidance(baseCtx({ latestSymptom: { severity: "moderate" } })).some(
        (d) => d.templateKey === "symptom-caution"
      )
    ).toBe(false);
  });

  it("personalizes meal examples from preferences and region; falls back honestly when unset", () => {
    const set = deriveDietGuidance(
      baseCtx({
        preferences: { set: true, mealPreference: "non_vegetarian", region: "south" },
      })
    );
    const card = set.find((d) => d.templateKey === "meals-non_vegetarian-south")!;
    const slotKeys = card.sections.map((s) => s.key);
    expect(slotKeys).toEqual(
      expect.arrayContaining([
        "meals.note",
        "meals.breakfast",
        "meals.lunch",
        "meals.snacks",
        "meals.dinner",
        "substitutions",
        "foodSafety",
        "hydration",
      ])
    );
    expect(set.some((d) => d.templateKey === "meals-vegetarian-other")).toBe(false);

    const regionMissing = deriveDietGuidance(
      baseCtx({ preferences: { set: true, mealPreference: "eggitarian" } })
    );
    expect(regionMissing.some((d) => d.templateKey === "meals-eggitarian-other")).toBe(true);

    const unset = deriveDietGuidance(baseCtx()).find((d) =>
      d.templateKey.startsWith("meals-")
    )!;
    expect(unset.templateKey).toBe("meals-vegetarian-other");
    expect(unset.rationale.toLowerCase()).toContain("not set");
  });

  it("keeps every template fully localized and placeholder-free across all rules", () => {
    const contexts: DietGuidanceContext[] = [
      baseCtx(),
      baseCtx({ trimester: 1 }),
      baseCtx({ trimester: 2, isHighRisk: true }),
      baseCtx({ trimester: 3, maternal: { riskLevel: "critical", assessmentId: "a1" } }),
      baseCtx({ gdm: { riskLevel: "moderate", assessmentId: "g1" } }),
      baseCtx({
        latestSymptom: { severity: "critical" },
        latestMetrics: { systolicBP: 150, diastolicBP: 99, glucose: 200, hemoglobin: 8.9 },
        preferences: { set: true, mealPreference: "non_vegetarian", region: "east" },
      }),
    ];
    for (const c of contexts) {
      const drafts = deriveDietGuidance(c);
      expect(drafts.length).toBeGreaterThanOrEqual(2);
      for (const d of drafts) {
        expectNoUnresolvedPlaceholders(d);
        expect(d.titleLocalized.en.length).toBeLessThanOrEqual(200);
        if (d.rationaleLocalized) expect(d.rationaleLocalized.en.length).toBeLessThanOrEqual(400);
      }
    }
  });
});

describe("diet guidance engine — persistence (snapshot semantics)", () => {
  beforeAll(connectTestDb);
  afterEach(cleanDb);

  it("regenerates idempotently and stores exactly one record per dedupe key", async () => {
    const userId = new mongoose.Types.ObjectId();
    await PregnancyProfile.create({
      user: userId,
      lmp: new Date("2026-01-01"),
      expectedDueDate: new Date("2026-09-01"),
      gestationalWeek: 24,
      trimester: 2,
      isHighRisk: false,
    });

    expect(await regenerateDietGuidance(String(userId))).toBe(2);
    expect(await regenerateDietGuidance(String(userId))).toBe(2);

    const docs = await DietGuidance.find({ user: userId, sourceType: "SYSTEM" }).lean();
    expect(docs.map((d) => d.templateKey).sort()).toEqual([
      "meals-vegetarian-other",
      "stage-trimester-2",
    ]);
    for (const d of docs) {
      expect(d.dedupeKey).toBeDefined();
      expect(d.contentVersion).toBe(DIET_CONTENT_VERSION);
      expect(d.titleLocalized.en).toBeTruthy();
      expect(d.sections.length).toBeGreaterThan(0);
    }
  });

  it("prunes stale amd rebuilds records when preferences change", async () => {
    const userId = new mongoose.Types.ObjectId();
    await PregnancyProfile.create({
      user: userId,
      lmp: new Date("2026-01-01"),
      expectedDueDate: new Date("2026-09-01"),
      gestationalWeek: 24,
      trimester: 2,
      isHighRisk: false,
    });
    await DietGuidancePreferences.create({
      user: userId,
      mealPreference: "non_vegetarian",
      region: "south",
    });

    await regenerateDietGuidance(String(userId));

    const docs = await DietGuidance.find({ user: userId, sourceType: "SYSTEM" }).lean();
    expect(docs.map((d) => d.templateKey).sort()).toEqual([
      "meals-non_vegetarian-south",
      "stage-trimester-2",
    ]);
    expect(
      await DietGuidance.countDocuments({ user: userId, templateKey: "meals-vegetarian-other" })
    ).toBe(0);
  });

  it("uses GDM guidance only from a completed GDM assessment; a reading alone never does", async () => {
    const completedUser = new mongoose.Types.ObjectId();
    const gdm = await GDMAssessment.create({
      user: completedUser,
      assessedBy: completedUser,
      status: "completed",
      riskLevel: "moderate",
      riskScore: 0.6,
      riskFactors: [],
      recommendations: [],
      inputFeatures: {},
      modelVersion: "v1-test",
    });

    await regenerateDietGuidance(String(completedUser));
    const completedDocs = await DietGuidance.find({ user: completedUser }).lean();
    const gdmCard = completedDocs.find((d) => d.templateKey === "gdm-guidance")!;
    expect(gdmCard).toBeDefined();
    expect(gdmCard.references).toHaveLength(1);
    expect(gdmCard.references![0].assessmentType).toBe("gdm");
    expect(gdmCard.references![0].assessmentId.toString()).toBe(String(gdm._id));
    expect(gdmCard.references![0].modelVersion).toBe("v1-test");

    const readingOnlyUser = new mongoose.Types.ObjectId();
    await GDMAssessment.create({
      user: readingOnlyUser,
      assessedBy: readingOnlyUser,
      status: "pending",
      riskFactors: [],
      recommendations: [],
      inputFeatures: {},
    });
    await HealthMetric.create({
      user: readingOnlyUser,
      date: new Date(),
      glucose: 185,
    });

    expect(await regenerateDietGuidance(String(readingOnlyUser))).toBe(3);
    const readingDocs = await DietGuidance.find({ user: readingOnlyUser }).lean();
    expect(keys(readingDocs as unknown as { templateKey: string }[])).toEqual([
      "meals-vegetarian-other",
      "metric-glucose",
      "stage-missing",
    ]);
  });

  it("keeps high-risk review when high risk comes from the profile only", async () => {
    const userId = new mongoose.Types.ObjectId();
    await PregnancyProfile.create({
      user: userId,
      lmp: new Date("2026-01-01"),
      expectedDueDate: new Date("2026-09-01"),
      gestationalWeek: 20,
      trimester: 2,
      isHighRisk: true,
    });
    await regenerateDietGuidance(String(userId));
    const docs = await DietGuidance.find({ user: userId }).lean();
    expect(docs.map((d) => d.templateKey).sort()).toEqual([
      "high-risk-review",
      "meals-vegetarian-other",
      "stage-trimester-2",
    ]);
    const highRisk = docs.find((d) => d.templateKey === "high-risk-review")!;
    expect(highRisk.references ?? []).toHaveLength(0);
  });

  it("never persists a record from an unavailable maternal assessment", async () => {
    const userId = new mongoose.Types.ObjectId();
    await MaternalRiskAssessment.create({
      user: userId,
      assessedBy: userId,
      status: "unavailable",
      riskFactors: [],
      recommendations: [],
      inputFeatures: {},
    });
    await regenerateDietGuidance(String(userId));
    const docs = await DietGuidance.find({ user: userId }).lean();
    expect(docs.some((d) => d.templateKey === "high-risk-review")).toBe(false);
  });
});

describe("diet guidance API — access control", () => {
  let patientA: { id: string; token: string };
  let patientB: { id: string; token: string };
  let asha: { id: string; token: string };
  let doctor: { id: string; token: string };

  beforeAll(connectTestDb);

  beforeEach(async () => {
    await cleanDb();
    const register = async (name: string, email: string, role: UserRole) => {
      const res = await api().post("/api/v1/auth/register").send({
        name,
        email,
        password: "StrongPass1",
        role,
      });
      return { id: res.body.data.user.id as string, token: res.body.data.token as string };
    };
    patientA = await register("Da", "a@dg.com", UserRole.PATIENT);
    patientB = await register("Db", "b@dg.com", UserRole.PATIENT);
    asha = await register("Asha", "asha@dg.com", UserRole.ASHA);
    doctor = await register("Doc", "doc@dg.com", UserRole.DOCTOR);
    await User.findByIdAndUpdate(patientA.id, {
      assignedASHA: asha.id,
      assignedDoctor: doctor.id,
    });
  });

  it("returns generated guidance and no preferences for a self-service patient", async () => {
    const res = await api()
      .get("/api/v1/diet-guidance")
      .set("Authorization", `Bearer ${patientA.token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const keys = (res.body.data.guidance as { templateKey: string }[]).map((g) => g.templateKey).sort();
    expect(keys).toEqual(["meals-vegetarian-other", "stage-missing"]);
    for (const g of res.body.data.guidance as { disclaimer: string }[]) {
      expect(g.disclaimer).toBeTruthy();
    }
    expect(res.body.data.preferences).toBeNull();
  });

  it("blocks a patient from reading another patient's guidance", async () => {
    const res = await api()
      .get(`/api/v1/diet-guidance?userId=${patientB.id}`)
      .set("Authorization", `Bearer ${patientA.token}`);
    expect(res.status).toBe(403);
  });

  it("lets an assigned ASHA or doctor read only their own patient", async () => {
    const okAsha = await api()
      .get(`/api/v1/diet-guidance?userId=${patientA.id}`)
      .set("Authorization", `Bearer ${asha.token}`);
    expect(okAsha.status).toBe(200);

    const blockedAsha = await api()
      .get(`/api/v1/diet-guidance?userId=${patientB.id}`)
      .set("Authorization", `Bearer ${asha.token}`);
    expect(blockedAsha.status).toBe(403);

    const okDoc = await api()
      .get(`/api/v1/diet-guidance?userId=${patientA.id}`)
      .set("Authorization", `Bearer ${doctor.token}`);
    expect(okDoc.status).toBe(200);
  });

  it("requires an explicit userId for caregivers", async () => {
    const res = await api()
      .get("/api/v1/diet-guidance")
      .set("Authorization", `Bearer ${asha.token}`);
    expect(res.status).toBe(400);
  });

  it("requires authentication", async () => {
    const res = await api().get("/api/v1/diet-guidance");
    expect(res.status).toBe(401);
  });

  it("saves diet preferences via PATCH and regenerates meals for the saved choices", async () => {
    const save = await api()
      .patch("/api/v1/diet-guidance/preferences")
      .set("Authorization", `Bearer ${patientA.token}`)
      .send({ mealPreference: "non_vegetarian", region: "south" });
    expect(save.status).toBe(200);
    expect(save.body.data.mealPreference).toBe("non_vegetarian");
    expect(save.body.data.region).toBe("south");

    const list = await api()
      .get("/api/v1/diet-guidance")
      .set("Authorization", `Bearer ${patientA.token}`);
    const keys = (list.body.data.guidance as { templateKey: string }[]).map((g) => g.templateKey);
    expect(keys).toContain("meals-non_vegetarian-south");
    expect(keys).not.toContain("meals-vegetarian-other");
    expect(list.body.data.preferences.mealPreference).toBe("non_vegetarian");
  });

  it("rejects an invalid meal preference", async () => {
    const res = await api()
      .patch("/api/v1/diet-guidance/preferences")
      .set("Authorization", `Bearer ${patientA.token}`)
      .send({ mealPreference: "vegan" });
    expect(res.status).toBe(400);
  });
});