import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { api, connectTestDb, cleanDb } from "./helpers";
import { User } from "../src/models/User";
import { UserRole } from "@maasuraksha/shared";

async function registerUser(name: string, email: string, role: UserRole) {
  const res = await api().post("/api/v1/auth/register").send({
    name,
    email,
    password: "StrongPass1",
    role,
  });
  return { id: res.body.data.user.id as string, token: res.body.data.token as string };
}

describe("ownership & patient access", () => {
  let patientA: { id: string; token: string };
  let patientB: { id: string; token: string };
  let asha: { id: string; token: string };
  let doctor: { id: string; token: string };

  beforeAll(async () => {
    await connectTestDb();
  });

  beforeEach(async () => {
    await cleanDb();
    patientA = await registerUser("Pa", "a@own.com", UserRole.PATIENT);
    patientB = await registerUser("Pb", "b@own.com", UserRole.PATIENT);
    asha = await registerUser("Asha", "asha@own.com", UserRole.ASHA);
    doctor = await registerUser("Doc", "doc@own.com", UserRole.DOCTOR);

    await User.findByIdAndUpdate(patientA.id, {
      assignedASHA: asha.id,
      assignedDoctor: doctor.id,
    });
  });

  it("lets a patient read their own metrics", async () => {
    const create = await api()
      .post("/api/v1/health-metrics")
      .set("Authorization", `Bearer ${patientA.token}`)
      .send({ weight: 62, systolicBP: 110 });
    expect(create.status).toBe(201);

    const list = await api()
      .get("/api/v1/health-metrics")
      .set("Authorization", `Bearer ${patientA.token}`);
    expect(list.status).toBe(200);
    expect(list.body.data).toHaveLength(1);
  });

  it("blocks a patient from reading another patient's metrics", async () => {
    const res = await api()
      .get(`/api/v1/health-metrics?userId=${patientB.id}`)
      .set("Authorization", `Bearer ${patientA.token}`);
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
  });

  it("lets an assigned ASHA read only their own patients", async () => {
    const ok = await api()
      .get(`/api/v1/health-metrics?userId=${patientA.id}`)
      .set("Authorization", `Bearer ${asha.token}`);
    expect(ok.status).toBe(200);

    const blocked = await api()
      .get(`/api/v1/health-metrics?userId=${patientB.id}`)
      .set("Authorization", `Bearer ${asha.token}`);
    expect(blocked.status).toBe(403);
  });

  it("lets an assigned doctor read only their own patients", async () => {
    const ok = await api()
      .get(`/api/v1/health-metrics?userId=${patientA.id}`)
      .set("Authorization", `Bearer ${doctor.token}`);
    expect(ok.status).toBe(200);

    const blocked = await api()
      .get(`/api/v1/health-metrics?userId=${patientB.id}`)
      .set("Authorization", `Bearer ${doctor.token}`);
    expect(blocked.status).toBe(403);
  });

  it("requires an explicit userId for caregiver-recorded metrics", async () => {
    const res = await api()
      .post("/api/v1/health-metrics")
      .set("Authorization", `Bearer ${asha.token}`)
      .send({ weight: 60 });
    expect(res.status).toBe(400);
  });

  it("blocked access to a single metric by id", async () => {
    const create = await api()
      .post("/api/v1/health-metrics")
      .set("Authorization", `Bearer ${patientA.token}`)
      .send({ weight: 58 });
    const metricId = create.body.data.id as string;

    const blocked = await api()
      .get(`/api/v1/health-metrics/${metricId}`)
      .set("Authorization", `Bearer ${patientB.token}`);
    expect(blocked.status).toBe(403);

    const own = await api()
      .get(`/api/v1/health-metrics/${metricId}`)
      .set("Authorization", `Bearer ${patientA.token}`);
    expect(own.status).toBe(200);
  });

  it("notFound for unknown metric ids", async () => {
    const res = await api()
      .get("/api/v1/health-metrics/000000000000000000000000")
      .set("Authorization", `Bearer ${patientA.token}`);
    expect(res.status).toBe(404);
  });
});