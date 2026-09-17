import { describe, it, expect } from "vitest";
import { buildSchemas } from "@/lib/schemas";
import { toLocalInputDate } from "@/lib/date";

/* Minimal stub t that echoes the key (and interpolation) so we can assert on
   which validation rule fired without coupling the test to real translations. */
const t = ((key: string, params?: Record<string, unknown>) =>
  params ? `${key}::${JSON.stringify(params)}` : key) as unknown as Parameters<typeof buildSchemas>[0];

const schemas = buildSchemas(t);

describe("buildSchemas", () => {
  it("rejects an invalid email on login", () => {
    const r = schemas.login.safeParse({ email: "not-an-email", password: "secret" });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues.some((i) => i.path[0] === "email")).toBe(true);
  });

  it("accepts a valid login", () => {
    expect(schemas.login.safeParse({ email: "a@b.com", password: "secret" }).success).toBe(true);
  });

  it("rejects a weak password on register", () => {
    const r = schemas.register.safeParse({
      name: "Anu",
      email: "a@b.com",
      password: "alllowercase",
      role: "PATIENT",
    });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues.some((i) => String(i.message).includes("passwordStrength"))).toBe(true);
  });

  it("enforces clinically valid health metric ranges", () => {
    const high = schemas.healthMetric.safeParse({ weight: 450, systolicBP: 80 });
    expect(high.success).toBe(false);
    if (!high.success) {
      expect(high.error.issues.some((i) => String(i.message).includes("rangeMax") && String(i.message).includes("health.weight"))).toBe(true);
    }
    const low = schemas.healthMetric.safeParse({ systolicBP: 40 });
    expect(low.success).toBe(false);
    if (!low.success) {
      expect(low.error.issues.some((i) => String(i.message).includes("rangeMin") && String(i.message).includes("fields.bp.systolic"))).toBe(true);
    }
  });

  it("treats empty optional metrics as valid", () => {
    expect(schemas.healthMetric.safeParse({}).success).toBe(true);
  });

  it("accepts a health metric dated today or in the past", () => {
    const today = toLocalInputDate(new Date());
    expect(schemas.healthMetric.safeParse({ weight: 60, date: today }).success).toBe(true);

    const past = new Date();
    past.setDate(past.getDate() - 3);
    expect(schemas.healthMetric.safeParse({ weight: 60, date: toLocalInputDate(past) }).success).toBe(true);
  });

  it("rejects a health metric dated in the future", () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const r = schemas.healthMetric.safeParse({ weight: 60, date: toLocalInputDate(tomorrow) });
    expect(r.success).toBe(false);
    if (!r.success) expect(String(r.error.issues[0].message)).toContain("futureDate");
  });

  it("requires at least one symptom", () => {
    const r = schemas.symptom.safeParse({ symptoms: [], severity: "mild" });
    expect(r.success).toBe(false);
    if (!r.success) expect(String(r.error.issues[0].message)).toContain("atLeastOneSymptom");
  });

  it("requires exactly 10 EPDS answers in range 0-3", () => {
    const tooFew = schemas.ppd.safeParse({ user: "u1", edinburghAnswers: [1, 2, 3] });
    expect(tooFew.success).toBe(false);
    if (!tooFew.success) expect(String(tooFew.error.issues[0].message)).toContain("epdsExact");

    const outOfRange = schemas.ppd.safeParse({ user: "u1", edinburghAnswers: Array(10).fill(5) });
    expect(outOfRange.success).toBe(false);

    const ok = schemas.ppd.safeParse({ user: "u1", edinburghAnswers: [0, 1, 2, 3, 0, 1, 2, 3, 0, 1] });
    expect(ok.success).toBe(true);
  });

  it("validates maternal risk inputs against clinical ranges", () => {
    const bad = schemas.maternalRisk.safeParse({
      user: "u1",
      age: 25,
      systolicBP: 120,
      diastolicBP: 80,
      bloodSugar: 90,
      bodyTemp: 37,
      heartRate: 72,
      bmi: 22,
      gestationalWeek: 70,
      hemoglobin: 11,
    });
    expect(bad.success).toBe(false);
    if (!bad.success) expect(String(bad.error.issues[0].message)).toContain("rangeMax");

    const good = schemas.maternalRisk.safeParse({
      user: "u1",
      age: 25,
      systolicBP: 120,
      diastolicBP: 80,
      bloodSugar: 90,
      bodyTemp: 37,
      heartRate: 72,
      bmi: 22,
      gestationalWeek: 24,
    });
    expect(good.success).toBe(true);
  });
});