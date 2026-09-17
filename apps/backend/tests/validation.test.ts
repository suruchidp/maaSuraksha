import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { api, connectTestDb, cleanDb } from "./helpers";
import { UserRole } from "@maasuraksha/shared";

async function patientToken(email: string) {
  const res = await api().post("/api/v1/auth/register").send({
    name: "V",
    email,
    password: "StrongPass1",
    role: "PATIENT",
  });
  return res.body.data.token as string;
}

describe("request validation", () => {
  let token: string;
  let userId: string;

  beforeAll(async () => {
    await connectTestDb();
  });

  beforeEach(async () => {
    await cleanDb();
    const res = await api().post("/api/v1/auth/register").send({
      name: "VPat",
      email: "v@val.com",
      password: "StrongPass1",
      role: "PATIENT",
    });
    token = res.body.data.token as string;
    userId = res.body.data.user.id as string;
  });

  it("accepts a valid health metric", async () => {
    const res = await api()
      .post("/api/v1/health-metrics")
      .set("Authorization", `Bearer ${token}`)
      .send({ systolicBP: 110, diastolicBP: 70, weight: 60 });
    expect(res.status).toBe(201);
  });

  it("rejects out-of-range metric values", async () => {
    const res = await api()
      .post("/api/v1/health-metrics")
      .set("Authorization", `Bearer ${token}`)
      .send({ systolicBP: 4000 });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("BAD_REQUEST");
  });

  const localYmd = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  it("accepts a health metric dated today or in the past", async () => {
    const past = new Date();
    past.setDate(past.getDate() - 5);
    const resToday = await api()
      .post("/api/v1/health-metrics")
      .set("Authorization", `Bearer ${token}`)
      .send({ weight: 60, date: localYmd(new Date()) });
    const resPast = await api()
      .post("/api/v1/health-metrics")
      .set("Authorization", `Bearer ${token}`)
      .send({ weight: 60, date: localYmd(past) });
    expect(resToday.status).toBe(201);
    expect(resPast.status).toBe(201);
  });

  it("rejects a health metric dated in the future", async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const res = await api()
      .post("/api/v1/health-metrics")
      .set("Authorization", `Bearer ${token}`)
      .send({ weight: 60, date: localYmd(tomorrow) });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("BAD_REQUEST");
    if (res.body.error.details) {
      expect(res.body.error.details[0].field).toBe("date");
    }
  });

  it("rejects symptoms with an empty array", async () => {
    const res = await api()
      .post("/api/v1/symptoms")
      .set("Authorization", `Bearer ${token}`)
      .send({ symptoms: [], severity: "mild" });
    expect(res.status).toBe(400);
  });

  it("rejects an invalid pregnancy LMP date", async () => {
    const res = await api()
      .put("/api/v1/pregnancy")
      .set("Authorization", `Bearer ${token}`)
      .send({ lmp: "not-a-date" });
    expect(res.status).toBe(400);
  });

  it("rejects an empty mood journal entry", async () => {
    const res = await api()
      .post("/api/v1/mood")
      .set("Authorization", `Bearer ${token}`)
      .send({ journalText: "" });
    expect(res.status).toBe(400);
  });

  it("rejects an appointment without a patient", async () => {
    const res = await api()
      .post("/api/v1/appointments")
      .set("Authorization", `Bearer ${token}`)
      .send({ date: "2026-10-01", time: "10:00", type: "checkup" });
    expect(res.status).toBe(400);
  });

  it("accepts a valid appointment", async () => {
    const res = await api()
      .post("/api/v1/appointments")
      .set("Authorization", `Bearer ${token}`)
      .send({
        patient: userId,
        date: "2026-10-01",
        time: "10:00",
        type: "checkup",
      });
    expect(res.status).toBe(201);
  });
});