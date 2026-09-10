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

describe("assigned patients list (ASHA/DOCTOR/ADMIN)", () => {
  let patientA: { id: string; token: string };
  let patientB: { id: string; token: string };
  let asha: { id: string; token: string };
  let doctor: { id: string; token: string };
  let admin: { id: string; token: string };

  beforeAll(async () => {
    await connectTestDb();
  });

  beforeEach(async () => {
    await cleanDb();
    patientA = await registerUser("Priya Sharma", "priya@pts.com", UserRole.PATIENT);
    patientB = await registerUser("Sana Patel", "sana@pts.com", UserRole.PATIENT);
    asha = await registerUser("Asha K", "asha@pts.com", UserRole.ASHA);
    doctor = await registerUser("Dr Rao", "rao@pts.com", UserRole.DOCTOR);

    await User.create({
      name: "Admin",
      email: "admin@pts.com",
      password: "StrongPass1",
      role: UserRole.ADMIN,
      language: "en",
    });
    const login = await api()
      .post("/api/v1/auth/login")
      .send({ email: "admin@pts.com", password: "StrongPass1" });
    admin = { id: login.body.data.user.id as string, token: login.body.data.token as string };

    await User.findByIdAndUpdate(patientA.id, {
      assignedASHA: asha.id,
      assignedDoctor: doctor.id,
    });
  });

  it("lets an ASHA list only their assigned patients", async () => {
    const res = await api()
      .get("/api/v1/patients")
      .set("Authorization", `Bearer ${asha.token}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].name).toBe("Priya Sharma");
  });

  it("lets a doctor list only their assigned patients", async () => {
    const res = await api()
      .get("/api/v1/patients")
      .set("Authorization", `Bearer ${doctor.token}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].id).toBe(patientA.id);
  });

  it("lets an admin list all patients", async () => {
    const res = await api()
      .get("/api/v1/patients")
      .set("Authorization", `Bearer ${admin.token}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
  });

  it("supports search by name", async () => {
    const res = await api()
      .get("/api/v1/patients?search=sana")
      .set("Authorization", `Bearer ${admin.token}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].name).toBe("Sana Patel");
  });

  it("forbids a patient from listing patients", async () => {
    const res = await api()
      .get("/api/v1/patients")
      .set("Authorization", `Bearer ${patientA.token}`);
    expect(res.status).toBe(403);
  });
});