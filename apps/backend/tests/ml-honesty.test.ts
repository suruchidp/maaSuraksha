import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { api, connectTestDb, cleanDb } from "./helpers";

async function patientToken(email: string) {
  const res = await api().post("/api/v1/auth/register").send({
    name: "ML",
    email,
    password: "StrongPass1",
    role: "PATIENT",
  });
  return {
    token: res.body.data.token as string,
    userId: res.body.data.user.id as string,
  };
}

describe("ML honesty policy (pending state, no fabricated scores)", () => {
  let tok: string;
  let uid: string;

  beforeAll(async () => {
    await connectTestDb();
  });

  beforeEach(async () => {
    await cleanDb();
    const acc = await patientToken("ml@honest.com");
    tok = acc.token;
    uid = acc.userId;
  });

  it("stores maternal risk inputs in a pending state without a score", async () => {
    const res = await api()
      .post("/api/v1/assessments/maternal-risk")
      .set("Authorization", `Bearer ${tok}`)
      .send({
        user: uid,
        age: 28,
        systolicBP: 112,
        diastolicBP: 74,
        bloodSugar: 96,
        bodyTemp: 36.6,
        heartRate: 82,
        bmi: 24.2,
        gestationalWeek: 20,
      });
    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe("pending");
    expect(res.body.data.riskScore).toBeUndefined();
    expect(res.body.data.riskLevel).toBeUndefined();
    expect(res.body.data.modelVersion).toBeUndefined();
    expect(res.body.data.message).toContain("not available");
  });

  it("stores GDM inputs in a pending state without a classification", async () => {
    const res = await api()
      .post("/api/v1/assessments/gdm")
      .set("Authorization", `Bearer ${tok}`)
      .send({
        user: uid,
        age: 32,
        pregnancyCount: 2,
        previousPregnancyGestation: 1,
        diastolicBP: 78,
        familyHistory: true,
        unexplainedPrenatalLoss: false,
        largeChildOrBirthDefect: false,
        pcos: false,
        sedentaryLifestyle: false,
      });
    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe("pending");
    expect(res.body.data.riskScore).toBeUndefined();
    expect(res.body.data.message).toContain("not available");
  });

  it("stores PPD answers in a pending state without an Edinburgh score", async () => {
    const res = await api()
      .post("/api/v1/assessments/ppd")
      .set("Authorization", `Bearer ${tok}`)
      .send({
        user: uid,
        edinburghAnswers: [1, 0, 0, 1, 0, 0, 1, 0, 0, 1],
      });
    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe("pending");
    expect(res.body.data.edinburghScore).toBeUndefined();
    expect(res.body.data.severity).toBeUndefined();
    expect(res.body.data.message).toContain("not available");
  });

  it("stores mood journal entries without a fabricated sentiment", async () => {
    const res = await api()
      .post("/api/v1/mood")
      .set("Authorization", `Bearer ${tok}`)
      .send({ journalText: "I felt anxious today about the baby." });
    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe("pending");
    expect(res.body.data.sentiment).toBeUndefined();
    expect(res.body.data.sentimentScore).toBeUndefined();
    expect(res.body.data.safetyFlag).toBe(false);
    expect(res.body.data.message).toContain("not available");
  });
});