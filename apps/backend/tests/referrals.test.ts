import { describe, it, expect, beforeAll, afterEach } from "vitest";
import { User } from "../src/models/User";
import { api, connectTestDb, cleanDb, registerAndGetToken } from "./helpers";

interface Account {
  token: string;
  id: string;
  name: string;
}

async function makeAccount(role: string, email: string): Promise<Account> {
  const name = email.split("@")[0];
  const token = await registerAndGetToken({
    name,
    email,
    password: "Passw0rd!123",
    role,
  });
  const user = await User.findOne({ email }).lean();
  return { token, id: user!._id.toString(), name };
}

describe("referrals — staff creation, doctor enforcement, RBAC and filtering", () => {
  beforeAll(connectTestDb);
  afterEach(cleanDb);

  async function seed() {
    const asha = await makeAccount("ASHA", "asha-refer@qa.com");
    const doctor = await makeAccount("DOCTOR", "doc-refer@qa.com");
    const patientA = await makeAccount("PATIENT", "patient-a-refer@qa.com");
    const patientB = await makeAccount("PATIENT", "patient-b-refer@qa.com");
    await User.updateOne(
      { _id: patientA.id },
      { $set: { assignedASHA: asha.id, assignedDoctor: doctor.id } }
    );
    return { asha, doctor, patientA, patientB };
  }

  it("lets an ASHA refer a patient to an active doctor and resolves the doctor name", async () => {
    const { asha, doctor, patientA } = await seed();
    const create = await api()
      .post("/api/v1/referrals")
      .set("Authorization", `Bearer ${asha.token}`)
      .send({
        patient: patientA.id,
        referredTo: doctor.id,
        reason: "Fetal ultrasound review required",
      });
    expect(create.status).toBe(201);
    expect(create.body.data.referredTo).toBe(doctor.id);
    expect(create.body.data.referredToName).toBe(doctor.name);
    expect(create.body.data.status).toBe("pending");

    const list = await api()
      .get(`/api/v1/referrals?patientId=${patientA.id}`)
      .set("Authorization", `Bearer ${asha.token}`);
    expect(list.status).toBe(200);
    expect(Array.isArray(list.body.data)).toBe(true);
    expect(list.body.data).toHaveLength(1);
    expect(list.body.data[0].referredToName).toBe(doctor.name);
  });

  it("rejects a malformed referredTo id", async () => {
    const { asha, patientA } = await seed();
    const res = await api()
      .post("/api/v1/referrals")
      .set("Authorization", `Bearer ${asha.token}`)
      .send({ patient: patientA.id, referredTo: "not-an-object-id", reason: "Review" });
    expect(res.status).toBe(400);
  });

  it("rejects a referredTo that is not an active doctor", async () => {
    const { asha, doctor, patientA, patientB } = await seed();
    const stranger = await makeAccount("PATIENT", "stranger-refer@qa.com");

    const patientAsDoctor = await api()
      .post("/api/v1/referrals")
      .set("Authorization", `Bearer ${asha.token}`)
      .send({ patient: patientA.id, referredTo: stranger.id, reason: "Review" });
    expect(patientAsDoctor.status).toBe(400);

    await User.updateOne({ _id: doctor.id }, { $set: { isActive: false } });
    const inactiveDoctor = await api()
      .post("/api/v1/referrals")
      .set("Authorization", `Bearer ${asha.token}`)
      .send({ patient: patientA.id, referredTo: doctor.id, reason: "Review" });
    expect(inactiveDoctor.status).toBe(400);

    const activeDoctor = await makeAccount("DOCTOR", "doc-unrelated-refer@qa.com");
    const unrelated = await api()
      .post("/api/v1/referrals")
      .set("Authorization", `Bearer ${asha.token}`)
      .send({ patient: patientB.id, referredTo: activeDoctor.id, reason: "Review" });
    expect(unrelated.status).toBe(403);
  });

  it("forbids a patient from updating referral status while staff may", async () => {
    const { asha, doctor, patientA } = await seed();
    const create = await api()
      .post("/api/v1/referrals")
      .set("Authorization", `Bearer ${asha.token}`)
      .send({ patient: patientA.id, referredTo: doctor.id, reason: "Orthopaedic consultation" });
    const referralId = create.body.data.id as string;

    const asPatient = await api()
      .patch(`/api/v1/referrals/${referralId}/status`)
      .set("Authorization", `Bearer ${patientA.token}`)
      .send({ status: "accepted" });
    expect(asPatient.status).toBe(403);

    const asDoctor = await api()
      .patch(`/api/v1/referrals/${referralId}/status`)
      .set("Authorization", `Bearer ${doctor.token}`)
      .send({ status: "accepted" });
    expect(asDoctor.status).toBe(200);
    expect(asDoctor.body.data.status).toBe("accepted");
    expect(asDoctor.body.data.history).toHaveLength(2);
  });

  it("scopes staff lists to their own patients only", async () => {
    const { asha, doctor, patientA, patientB } = await seed();
    await api()
      .post("/api/v1/referrals")
      .set("Authorization", `Bearer ${asha.token}`)
      .send({ patient: patientA.id, referredTo: doctor.id, reason: "Paediatric check" });

    const forbidden = await api()
      .get(`/api/v1/referrals?patientId=${patientB.id}`)
      .set("Authorization", `Bearer ${asha.token}`);
    expect(forbidden.status).toBe(403);
  });

  it("lists only active doctors for authenticating users", async () => {
    const { asha } = await seed();
    const activeDoc = await makeAccount("DOCTOR", "doc-active-refer@qa.com");
    const inactiveDoc = await makeAccount("DOCTOR", "doc-inactive-refer@qa.com");
    await User.updateOne({ _id: inactiveDoc.id }, { $set: { isActive: false } });

    const res = await api()
      .get("/api/v1/users/doctors")
      .set("Authorization", `Bearer ${asha.token}`);
    expect(res.status).toBe(200);
    const ids = res.body.data.map((d: { id: string }) => d.id);
    expect(ids).toContain(activeDoc.id);
    expect(ids).not.toContain(inactiveDoc.id);
    expect(res.body.data.every((d: { name: string }) => typeof d.name === "string")).toBe(true);
  });
});