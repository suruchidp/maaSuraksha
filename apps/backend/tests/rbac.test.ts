import { describe, it, expect, beforeAll, afterEach } from "vitest";
import { api, connectTestDb, cleanDb, registerAndGetToken } from "./helpers";
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

async function createAdminToken() {
  await User.create({
    name: "Root Admin",
    email: "root@admin.example.com",
    password: "StrongPass1",
    role: UserRole.ADMIN,
    language: "en",
  });
  const res = await api().post("/api/v1/auth/login").send({
    email: "root@admin.example.com",
    password: "StrongPass1",
  });
  return res.body.data.token as string;
}

describe("RBAC", () => {
  beforeAll(connectTestDb);
  afterEach(cleanDb);

  it("blocks non-admin users from admin endpoints", async () => {
    const patientToken = await registerAndGetToken({
      name: "Pat One", email: "p@rbac.com", password: "StrongPass1", role: "PATIENT",
    });
    const doctorToken = await registerAndGetToken({
      name: "Doc One", email: "d@rbac.com", password: "StrongPass1", role: "DOCTOR",
    });

    const patientRes = await api()
      .get("/api/v1/admin/overview")
      .set("Authorization", `Bearer ${patientToken}`);
    expect(patientRes.status).toBe(403);
    expect(patientRes.body.error.code).toBe("FORBIDDEN");

    const doctorRes = await api()
      .get("/api/v1/admin/overview")
      .set("Authorization", `Bearer ${doctorToken}`);
    expect(doctorRes.status).toBe(403);
  });

  it("allows admins to access admin endpoints", async () => {
    const adminToken = await createAdminToken();
    const res = await api()
      .get("/api/v1/admin/overview")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(typeof res.body.data.users).toBe("number");
    expect(typeof res.body.data.assessments).toBe("number");
  });

  it("allows admins to create users including admins", async () => {
    const adminToken = await createAdminToken();
    const res = await api()
      .post("/api/v1/admin/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "New Admin",
        email: "newadmin@rbac.com",
        password: "StrongPass1",
        role: "ADMIN",
      });
    expect(res.status).toBe(201);
    expect(res.body.data.role).toBe("ADMIN");
  });

  it("restricts caregiver-authored endpoints by role", async () => {
    const patient = await registerUser("Pat Two", "p2@rbac.com", UserRole.PATIENT);
    const doctor = await registerUser("Doc Two", "d2@rbac.com", UserRole.DOCTOR);
    await User.findByIdAndUpdate(patient.id, { assignedDoctor: doctor.id });

    const patientCreateRec = await api()
      .post("/api/v1/recommendations")
      .set("Authorization", `Bearer ${patient.token}`)
      .send({
        category: "nutrition",
        title: "Iron intake",
        content: "Add iron-rich foods.",
        priority: "medium",
      });
    expect(patientCreateRec.status).toBe(403);

    const doctorCreateRec = await api()
      .post(`/api/v1/recommendations?userId=${patient.id}`)
      .set("Authorization", `Bearer ${doctor.token}`)
      .send({
        category: "nutrition",
        title: "Iron intake",
        content: "Add iron-rich foods.",
        priority: "medium",
      });
    expect(doctorCreateRec.status).toBe(201);
  });

  it("restricts chat to patients and admins", async () => {
    const doctorToken = await registerAndGetToken({
      name: "Doc Three", email: "d3@rbac.com", password: "StrongPass1", role: "DOCTOR",
    });
    const ashaToken = await registerAndGetToken({
      name: "Asha Three", email: "a3@rbac.com", password: "StrongPass1", role: "ASHA",
    });

    const doctorRes = await api()
      .post("/api/v1/chat")
      .set("Authorization", `Bearer ${doctorToken}`)
      .send({ title: "Hello" });
    expect(doctorRes.status).toBe(403);

    const ashaRes = await api()
      .post("/api/v1/chat")
      .set("Authorization", `Bearer ${ashaToken}`)
      .send({ title: "Hello" });
    expect(ashaRes.status).toBe(403);
  });

  it("allows patients to open a chat conversation", async () => {
    const patientToken = await registerAndGetToken({
      name: "Pat Four", email: "p4@rbac.com", password: "StrongPass1", role: "PATIENT",
    });
    const res = await api()
      .post("/api/v1/chat")
      .set("Authorization", `Bearer ${patientToken}`)
      .send({ title: "My first question" });
    expect(res.status).toBe(201);
    expect(res.body.data.id).toBeTruthy();
  });
});