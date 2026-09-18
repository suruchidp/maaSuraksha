import { beforeAll, afterEach, describe, it, expect } from "vitest";
import {
  pregnancyAge,
  appointmentToday,
  pregnancyProfileSchema,
} from "@maasuraksha/shared";
import { api, connectTestDb, cleanDb, registerAndGetToken } from "./helpers";
import { User } from "../src/models/User";
import { PregnancyProfile } from "../src/models/PregnancyProfile";
import { HealthMetric } from "../src/models/HealthMetric";
import { MaternalRiskAssessment } from "../src/models/MaternalRiskAssessment";
import { GDMAssessment } from "../src/models/GDMAssessment";
import { Symptom } from "../src/models/Symptom";
import { Appointment } from "../src/models/Appointment";
import { Alert } from "../src/models/Alert";
import { buildDietContext } from "../src/services/dietGuidanceEngine";
import { refreshPatientAlerts } from "../src/services/alertEngine";
const dateAgo = (days: number) =>
  new Date(Date.parse(appointmentToday()) - days * 86400000)
    .toISOString()
    .slice(0, 10);
describe("pregnancy calendar calculations", () => {
  it("uses completed weeks plus days without a one-week offset or a 42-week clamp", () => {
    expect(
      pregnancyAge("2030-01-01", new Date("2030-01-01T00:00Z")),
    ).toMatchObject({ weeks: 0, days: 0, trimester: 1 });
    expect(
      pregnancyAge("2030-01-01", new Date("2030-01-07T00:00Z")),
    ).toMatchObject({ weeks: 0, days: 6 });
    expect(
      pregnancyAge("2030-01-01", new Date("2030-01-08T00:00Z")),
    ).toMatchObject({ weeks: 1, days: 0 });
    expect(pregnancyAge("2029-01-01", new Date("2030-01-01"))).toMatchObject({
      weeks: 52,
      datingNeedsReview: true,
    });
  });
  it("handles leap dates, India midnight and trimester boundaries", () => {
    const start = "2028-02-29";
    expect(pregnancyAge(start, new Date(start)).dueDate).toBe("2028-12-05");
    expect(
      pregnancyAge("2030-01-01", new Date("2030-01-01T18:29:59Z")).days,
    ).toBe(0);
    expect(
      pregnancyAge("2030-01-01", new Date("2030-01-01T18:30:00Z")).days,
    ).toBe(1);
    const age = (days: number) =>
      pregnancyAge(start, new Date(Date.parse(start) + days * 86400000));
    expect(age(97).trimester).toBe(1);
    expect(age(98).trimester).toBe(2);
    expect(age(195).trimester).toBe(2);
    expect(age(196).trimester).toBe(3);
  });
  it("rejects impossible/future dates, fractional counts and inconsistent birth history", () => {
    for (const input of [
      { lmp: "2025-02-30" },
      { lmp: "2099-01-01" },
      { lmp: "2025-01-01T00:00Z" },
      { lmp: "2025-01-01", gravida: 0 },
      { lmp: "2025-01-01", gravida: 1.5 },
      { lmp: "2025-01-01", gravida: 1, para: 1 },
      { lmp: "2025-01-01", status: "completed" },
      { lmp: "2025-01-01", status: "completed", endedOn: "2024-12-31" },
    ])
      expect(pregnancyProfileSchema.safeParse(input).success).toBe(false);
  });
});
describe("pregnancy tracking integration", () => {
  beforeAll(connectTestDb);
  afterEach(cleanDb);
  async function account(email = "tracking@example.com", role = "PATIENT") {
    const token = await registerAndGetToken({
      name: "Tracking patient",
      email,
      role,
      password: "StrongPass1",
    });
    const p = await User.findOne({ email });
    return { token, id: p!._id.toString(), auth: `Bearer ${token}` };
  }
  async function save(p: { auth: string }, input: object = {}) {
    return api()
      .post("/api/v1/pregnancy")
      .set("Authorization", p.auth)
      .send({ lmp: dateAgo(24 * 7 + 3), gravida: 2, para: 1, ...input });
  }
  it("returns live age despite stale stored week/trimester and updates Diet from the same clock", async () => {
    const p = await account();
    const r = await save(p, {
      riskFactors: ["Prior hypertension"],
      medicalHistory: ["Previous surgery"],
    });
    expect(r.status).toBe(200);
    await PregnancyProfile.updateOne(
      { user: p.id },
      { gestationalWeek: 1, trimester: 1 },
    );
    const get = await api()
      .get("/api/v1/pregnancy")
      .set("Authorization", p.auth);
    expect(get.body.data).toMatchObject({
      gestationalWeek: 24,
      gestationalDays: 3,
      trimester: 2,
      status: "active",
    });
    expect((await buildDietContext(p.id)).trimester).toBe(2);
    const updated = await save(p, { updatedAt: get.body.data.updatedAt });
    expect(updated.status).toBe(200);
    expect(updated.body.data.riskFactors).toEqual(["Prior hypertension"]);
    expect(updated.body.data.medicalHistory).toEqual(["Previous surgery"]);
    expect((await save(p, { updatedAt: get.body.data.updatedAt })).status).toBe(
      409,
    );
  });
  it("persists explicit milestone completion, resolves its reminder, and restores reminders on undo without duplicates", async () => {
    const p = await account();
    const r = await save(p);
    const key = "gdm_screening";
    await refreshPatientAlerts(p.id);
    expect(
      await Alert.countDocuments({
        user: p.id,
        dedupeKey: { $regex: key },
        status: "pending",
      }),
    ).toBe(1);
    const completed = await api()
      .patch(`/api/v1/pregnancy/milestones/${key}`)
      .set("Authorization", p.auth)
      .send({ completed: true, updatedAt: r.body.data.updatedAt });
    expect(completed.status).toBe(200);
    const tracking = await api()
      .get("/api/v1/pregnancy/tracking")
      .set("Authorization", p.auth);
    expect(
      tracking.body.data.milestones.find((m: { key: string }) => m.key === key)
        .state,
    ).toBe("recorded");
    expect(
      await Alert.countDocuments({
        user: p.id,
        dedupeKey: { $regex: key },
        status: "resolved",
      }),
    ).toBe(1);
    expect(
      (
        await api()
          .patch(`/api/v1/pregnancy/milestones/${key}`)
          .set("Authorization", p.auth)
          .send({ completed: false, updatedAt: r.body.data.updatedAt })
      ).status,
    ).toBe(409);
    expect(
      (
        await api()
          .patch(`/api/v1/pregnancy/milestones/${key}`)
          .set("Authorization", p.auth)
          .send({ completed: false, updatedAt: completed.body.data.updatedAt })
      ).status,
    ).toBe(200);
    await refreshPatientAlerts(p.id);
    expect(
      await Alert.countDocuments({ user: p.id, dedupeKey: { $regex: key } }),
    ).toBe(1);
    expect(
      await Alert.countDocuments({
        user: p.id,
        dedupeKey: { $regex: key },
        status: "pending",
      }),
    ).toBe(1);
  });
  it("limits trends to this pregnancy and returns real connected records without treating unavailable models as low risk", async () => {
    const p = await account();
    await save(p);
    await HealthMetric.create([
      { user: p.id, date: new Date(dateAgo(300)), weight: 60 },
      { user: p.id, date: new Date(dateAgo(2)), weight: 65 },
      { user: p.id, date: new Date(dateAgo(1)), glucose: 99 },
    ]);
    await MaternalRiskAssessment.create({
      user: p.id,
      assessedBy: p.id,
      status: "unavailable",
      inputFeatures: {},
    });
    await GDMAssessment.create({
      user: p.id,
      assessedBy: p.id,
      status: "completed",
      riskLevel: "high",
      riskScore: 0.8,
      inputFeatures: {},
    });
    await Symptom.create({
      user: p.id,
      date: new Date(),
      symptoms: ["nausea"],
      severity: "mild",
      reportedBy: p.id,
    });
    await Appointment.create({
      patient: p.id,
      date: new Date("2099-01-01"),
      time: "10:30",
      type: "antenatal",
      status: "confirmed",
    });
    const r = await api()
      .get("/api/v1/pregnancy/tracking")
      .set("Authorization", p.auth);
    expect(r.status).toBe(200);
    const d = r.body.data;
    expect(d.metrics).toMatchObject({
      total: 2,
      included: 2,
      truncated: false,
    });
    expect(d.metrics.items[0].weight).toBe(65);
    expect(d.context.maternal).toMatchObject({ status: "unavailable" });
    expect(d.context.maternal.riskLevel).toBeUndefined();
    expect(d.context.gdm.riskLevel).toBe("high");
    expect(d.context.latestSymptom.symptoms).toEqual(["nausea"]);
    expect(d.context.nextAppointments[0].time).toBe("10:30");
    expect(
      d.milestones.find((m: { key: string }) => m.key === "anatomy_scan").state,
    ).toBe("window_passed");
  });
  it("freezes age at the end date, stops pregnancy reminders, and resets milestones when LMP changes", async () => {
    const p = await account();
    let r = await save(p);
    r = await api()
      .patch("/api/v1/pregnancy/milestones/gdm_screening")
      .set("Authorization", p.auth)
      .send({ completed: true, updatedAt: r.body.data.updatedAt });
    const ended = await save(p, {
      status: "completed",
      endedOn: dateAgo(7),
      updatedAt: r.body.data.updatedAt,
    });
    expect(ended.status).toBe(200);
    expect(ended.body.data.gestationalWeek).toBe(23);
    expect(
      await Alert.countDocuments({
        user: p.id,
        source: {
          $in: [
            "rules-v1:pregnancy-milestone",
            "rules-v1:due-date",
            "rules-v1:pregnancy-risk",
            "rules-v1:pregnancy-overdue",
          ],
        },
        status: { $ne: "resolved" },
      }),
    ).toBe(0);
    expect((await buildDietContext(p.id)).trimester).toBeUndefined();
    expect(
      (
        await api()
          .patch("/api/v1/pregnancy/milestones/gdm_screening")
          .set("Authorization", p.auth)
          .send({ completed: false, updatedAt: ended.body.data.updatedAt })
      ).status,
    ).toBe(409);
    const restarted = await save(p, {
      lmp: dateAgo(30),
      status: "active",
      updatedAt: ended.body.data.updatedAt,
    });
    expect(restarted.status).toBe(200);
    expect(restarted.body.data.milestoneCompletions).toEqual([]);
  });
  it("keeps old profiles visible with uncapped dating warnings and bounded trends", async () => {
    const p = await account();
    const r = await save(p, { lmp: dateAgo(400) });
    expect(r.status).toBe(200);
    expect(r.body.data).toMatchObject({
      gestationalWeek: 57,
      datingNeedsReview: true,
    });
    await HealthMetric.insertMany(
      Array.from({ length: 101 }, () => ({
        user: p.id,
        date: new Date(),
        weight: 65,
      })),
    );
    const d = (
      await api().get("/api/v1/pregnancy/tracking").set("Authorization", p.auth)
    ).body.data;
    expect(d.metrics).toMatchObject({
      included: 100,
      total: 101,
      truncated: true,
    });
    expect(
      await Alert.countDocuments({
        user: p.id,
        source: "rules-v1:pregnancy-overdue",
      }),
    ).toBe(1);
  });
  it("authorizes assigned doctors/ASHA, revokes access, validates IDs and requires authentication", async () => {
    const p = await account();
    const other = await account("other@example.com");
    const d = await account("doctor@example.com", "DOCTOR");
    const a = await account("asha@example.com", "ASHA");
    const r = await save(p);
    for (const actor of [other, d, a])
      expect(
        (
          await api()
            .get(`/api/v1/pregnancy/tracking?userId=${p.id}`)
            .set("Authorization", actor.auth)
        ).status,
      ).toBe(403);
    await User.findByIdAndUpdate(p.id, {
      assignedDoctor: d.id,
      assignedASHA: a.id,
    });
    for (const actor of [d, a])
      expect(
        (
          await api()
            .get(`/api/v1/pregnancy/tracking?userId=${p.id}`)
            .set("Authorization", actor.auth)
        ).status,
      ).toBe(200);
    expect(
      (
        await api()
          .patch(`/api/v1/pregnancy/milestones/antenatal_visit?userId=${p.id}`)
          .set("Authorization", d.auth)
          .send({ completed: true, updatedAt: r.body.data.updatedAt })
      ).status,
    ).toBe(200);
    await User.findByIdAndUpdate(p.id, { $unset: { assignedDoctor: 1 } });
    expect(
      (
        await api()
          .get(`/api/v1/pregnancy/tracking?userId=${p.id}`)
          .set("Authorization", d.auth)
      ).status,
    ).toBe(403);
    for (const q of ["userId=bad", "userId[x]=bad"])
      expect(
        (
          await api()
            .get("/api/v1/pregnancy/tracking?" + q)
            .set("Authorization", p.auth)
        ).status,
      ).toBe(400);
    expect((await api().get("/api/v1/pregnancy/tracking")).status).toBe(401);
  });
});
