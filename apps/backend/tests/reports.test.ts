import { describe, it, expect, beforeAll, afterEach } from "vitest";
import { api, connectTestDb, cleanDb, registerAndGetToken } from "./helpers";
import { User } from "../src/models/User";
import { HealthMetric } from "../src/models/HealthMetric";
import { HealthRecord } from "../src/models/HealthRecord";
import { PPDAssessment } from "../src/models/PPDAssessment";
import { Report } from "../src/models/Report";
describe("reports and health records", () => {
  beforeAll(connectTestDb);
  afterEach(cleanDb);
  async function account(email = "records@example.com", role = "PATIENT") {
    const token = await registerAndGetToken({
      name: "Records patient",
      email,
      role,
      password: "StrongPass1",
    });
    const user = await User.findOne({ email });
    return { token, id: user!._id.toString() };
  }
  const record = {
    category: "lab_result",
    title: "Blood count",
    date: "2025-01-02",
    provider: "Clinic",
    details: "Hemoglobin 11 g/dL",
  };
  it("persists, edits, archives and restores records with stale-write protection", async () => {
    const p = await account();
    const auth = `Bearer ${p.token}`;
    const created = await api()
      .post("/api/v1/health-records")
      .set("Authorization", auth)
      .send(record);
    expect(created.status).toBe(201);
    const r = created.body.data;
    expect(r).toMatchObject({
      recordedBy: p.id,
      user: p.id,
      authorRole: "PATIENT",
    });
    const edit = await api()
      .patch(`/api/v1/health-records/${r.id}`)
      .set("Authorization", auth)
      .send({ title: "Updated result", updatedAt: r.updatedAt });
    expect(edit.status).toBe(200);
    expect(
      (
        await api()
          .patch(`/api/v1/health-records/${r.id}`)
          .set("Authorization", auth)
          .send({ title: "Stale", updatedAt: r.updatedAt })
      ).status,
    ).toBe(409);
    const archived = await api()
      .patch(`/api/v1/health-records/${r.id}`)
      .set("Authorization", auth)
      .send({ isArchived: true, updatedAt: edit.body.data.updatedAt });
    expect(archived.status).toBe(200);
    expect(
      (await api().get("/api/v1/health-records").set("Authorization", auth))
        .body.data,
    ).toHaveLength(0);
    expect(
      (
        await api()
          .get("/api/v1/health-records?archived=true")
          .set("Authorization", auth)
      ).body.data,
    ).toHaveLength(1);
    expect(
      (
        await api()
          .patch(`/api/v1/health-records/${r.id}`)
          .set("Authorization", auth)
          .send({ isArchived: false, updatedAt: archived.body.data.updatedAt })
      ).status,
    ).toBe(200);
  });
  it("builds immutable snapshots from saved data, excludes private screening text and archived records", async () => {
    const p = await account();
    const auth = `Bearer ${p.token}`;
    await HealthMetric.create({
      user: p.id,
      recordedBy: p.id,
      date: new Date("2025-01-02T06:00Z"),
      systolicBP: 120,
      diastolicBP: 80,
    });
    await HealthRecord.create({
      ...record,
      user: p.id,
      recordedBy: p.id,
      authorRole: "PATIENT",
    });
    await HealthRecord.create({
      ...record,
      title: "Archived",
      user: p.id,
      recordedBy: p.id,
      authorRole: "PATIENT",
      isArchived: true,
    });
    await PPDAssessment.create({
      user: p.id,
      assessedBy: p.id,
      status: "unavailable",
      screeningText: "PRIVATE SCREENING TEXT",
    });
    const generated = await api()
      .post("/api/v1/reports")
      .set("Authorization", auth)
      .send({ type: "comprehensive" });
    expect(generated.status).toBe(201);
    const data = generated.body.data;
    expect(data.data.sections.healthMetrics.items[0]).toMatchObject({
      systolicBP: 120,
    });
    expect(data.data.sections.healthRecords.total).toBe(1);
    expect(data.data.sections.ppdAssessments.items[0]).toMatchObject({
      status: "unavailable",
    });
    expect(JSON.stringify(data)).not.toContain("PRIVATE SCREENING TEXT");
    await HealthMetric.deleteMany({});
    expect(
      (await api().get(`/api/v1/reports/${data.id}`).set("Authorization", auth))
        .body.data.data.sections.healthMetrics.total,
    ).toBe(1);
    expect(
      (await api().get("/api/v1/reports").set("Authorization", auth)).body
        .data[0].data,
    ).toBeUndefined();
  });
  it("rejects caller-supplied report data, invalid dates, unknown types and anonymous access", async () => {
    const p = await account();
    const auth = `Bearer ${p.token}`;
    for (const input of [
      { type: "snapshot" },
      { type: "comprehensive", data: { fake: true } },
      { type: "comprehensive", fromDate: "2025-02-30" },
      { type: "comprehensive", fromDate: "2025-03-01", toDate: "2025-01-01" },
    ])
      expect(
        (
          await api()
            .post("/api/v1/reports")
            .set("Authorization", auth)
            .send(input)
        ).status,
      ).toBe(400);
    for (const changes of [
      { date: "2099-01-01" },
      { date: "2025-02-30" },
      { title: " " },
      { recordedBy: p.id },
    ])
      expect(
        (
          await api()
            .post("/api/v1/health-records")
            .set("Authorization", auth)
            .send({ ...record, ...changes })
        ).status,
      ).toBe(400);
    for (const path of ["/reports", "/health-records"])
      expect((await api().get("/api/v1" + path)).status).toBe(401);
  });
  it("scopes patients and care teams, prevents editing another author's record and revokes access", async () => {
    const p = await account();
    const other = await account("other@example.com");
    const d = await account("doctor@example.com", "DOCTOR");
    const auth = `Bearer ${p.token}`;
    const doctor = `Bearer ${d.token}`;
    const r = (
      await api()
        .post("/api/v1/health-records")
        .set("Authorization", auth)
        .send(record)
    ).body.data;
    const report = (
      await api()
        .post("/api/v1/reports")
        .set("Authorization", auth)
        .send({ type: "comprehensive" })
    ).body.data;
    for (const path of [
      `/health-records/${r.id}`,
      `/reports/${report.id}`,
      `/health-records?userId=${p.id}`,
      `/reports?userId=${p.id}`,
    ])
      expect(
        (
          await api()
            .get("/api/v1" + path)
            .set("Authorization", `Bearer ${other.token}`)
        ).status,
      ).toBe(403);
    expect(
      (
        await api()
          .get(`/api/v1/reports/${report.id}`)
          .set("Authorization", doctor)
      ).status,
    ).toBe(403);
    await User.findByIdAndUpdate(p.id, { assignedDoctor: d.id });
    expect(
      (
        await api()
          .get(`/api/v1/reports/${report.id}`)
          .set("Authorization", doctor)
      ).status,
    ).toBe(200);
    expect(
      (
        await api()
          .patch(`/api/v1/health-records/${r.id}`)
          .set("Authorization", doctor)
          .send({ title: "Change", updatedAt: r.updatedAt })
      ).status,
    ).toBe(403);
    expect(
      (
        await api()
          .post(`/api/v1/health-records?userId=${p.id}`)
          .set("Authorization", doctor)
          .send(record)
      ).status,
    ).toBe(201);
    expect(
      (
        await api()
          .post(`/api/v1/reports?userId=${p.id}`)
          .set("Authorization", doctor)
          .send({ type: "comprehensive" })
      ).status,
    ).toBe(201);
    await User.findByIdAndUpdate(p.id, { $unset: { assignedDoctor: 1 } });
    expect(
      (
        await api()
          .get(`/api/v1/reports/${report.id}`)
          .set("Authorization", doctor)
      ).status,
    ).toBe(403);
  });
  it("handles India-day boundaries, calendar dates, pagination and explicit truncation", async () => {
    const p = await account();
    const auth = `Bearer ${p.token}`;
    await HealthMetric.create([
      {
        user: p.id,
        recordedBy: p.id,
        date: new Date("2025-01-01T18:29:59Z"),
        glucose: 90,
      },
      {
        user: p.id,
        recordedBy: p.id,
        date: new Date("2025-01-01T18:30:00Z"),
        glucose: 100,
      },
      {
        user: p.id,
        recordedBy: p.id,
        date: new Date("2025-01-02T18:30:00Z"),
        glucose: 110,
      },
    ]);
    await HealthRecord.insertMany(
      Array.from({ length: 101 }, (_, i) => ({
        ...record,
        title: `Record ${i}`,
        user: p.id,
        recordedBy: p.id,
        authorRole: "PATIENT",
      })),
    );
    const r = await api()
      .post("/api/v1/reports")
      .set("Authorization", auth)
      .send({
        type: "comprehensive",
        fromDate: "2025-01-02",
        toDate: "2025-01-02",
      });
    expect(r.status).toBe(201);
    const s = r.body.data.data.sections;
    expect(
      s.healthMetrics.items.map((v: { glucose: number }) => v.glucose),
    ).toEqual([100]);
    expect(s.healthRecords).toMatchObject({
      total: 101,
      included: 100,
      truncated: true,
    });
    const list = await api()
      .get("/api/v1/health-records?limit=1&page=2&category=lab_result")
      .set("Authorization", auth);
    expect(list.body.meta).toMatchObject({ total: 101, page: 2 });
    expect(list.body.data).toHaveLength(1);
    expect(
      (
        await api()
          .get("/api/v1/health-records?category=bad")
          .set("Authorization", auth)
      ).status,
    ).toBe(400);
    expect(
      (await api().get("/api/v1/reports/bad").set("Authorization", auth))
        .status,
    ).toBe(400);
    expect(await Report.countDocuments({ user: p.id })).toBe(1);
  });
});
