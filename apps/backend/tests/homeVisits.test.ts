import { describe, it, expect, beforeAll, afterEach } from "vitest";
import { api, connectTestDb, cleanDb } from "./helpers";
import { User } from "../src/models/User";
import { HomeVisit } from "../src/models/HomeVisit";
import { Referral } from "../src/models/Referral";
import { UserRole } from "@maasuraksha/shared";

interface UserHandle {
  id: string;
  token: string;
}

async function registerUser(name: string, email: string, role: UserRole): Promise<UserHandle> {
  const res = await api().post("/api/v1/auth/register").send({
    name,
    email,
    password: "StrongPass1",
    role,
  });
  return { id: res.body.data.user.id as string, token: res.body.data.token as string };
}

async function registerAdmin(email = "hv_admin@example.com"): Promise<UserHandle> {
  await User.create({
    name: "Home Visit Admin",
    email,
    password: "StrongPass1",
    role: UserRole.ADMIN,
    language: "en",
  });
  const login = await api().post("/api/v1/auth/login").send({ email, password: "StrongPass1" });
  return { id: login.body.data.user.id as string, token: login.body.data.token as string };
}

async function assignCareTeam(patientId: string, ashaId: string, doctorId: string) {
  await User.findByIdAndUpdate(patientId, { assignedASHA: ashaId, assignedDoctor: doctorId });
}

function visitPayload(patientId: string, overrides: Record<string, unknown> = {}) {
  return {
    patient: patientId,
    preferredDate: "2099-10-01",
    preferredTime: "10:00",
    reason: "Persistent fever",
    ...overrides,
  };
}

function requestVisit(token: string, body: Record<string, unknown>) {
  return api().post("/api/v1/home-visits").set("Authorization", `Bearer ${token}`).send(body);
}

function getVisit(token: string, visitId: string) {
  return api().get(`/api/v1/home-visits/${visitId}`).set("Authorization", `Bearer ${token}`);
}

function scheduleVisit(token: string, visitId: string, date = "2099-10-05", time = "09:30") {
  return api()
    .patch(`/api/v1/home-visits/${visitId}/schedule`)
    .set("Authorization", `Bearer ${token}`)
    .send({ scheduledDate: date, scheduledTime: time });
}

function completeVisit(token: string, visitId: string, body: Record<string, unknown> = {}) {
  return api()
    .patch(`/api/v1/home-visits/${visitId}/complete`)
    .set("Authorization", `Bearer ${token}`)
    .send(body);
}

function cancelVisit(token: string, visitId: string, body: Record<string, unknown> = {}) {
  return api()
    .patch(`/api/v1/home-visits/${visitId}/cancel`)
    .set("Authorization", `Bearer ${token}`)
    .send(body);
}

function escalateVisit(token: string, visitId: string, body: Record<string, unknown>) {
  return api()
    .patch(`/api/v1/home-visits/${visitId}/escalate`)
    .set("Authorization", `Bearer ${token}`)
    .send(body);
}

describe("home visit request creation", () => {
  beforeAll(connectTestDb);
  afterEach(cleanDb);

  it("lets an authenticated patient request a home visit for themselves with PENDING status", async () => {
    const p = await registerUser("Priya Sharma", "hv_priya@example.com", UserRole.PATIENT);
    const res = await requestVisit(p.token, {
      ...visitPayload(p.id),
      notes: "Has had fever for two days",
    });
    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      patient: p.id,
      requestedBy: p.id,
      reason: "Persistent fever",
      notes: "Has had fever for two days",
      preferredDate: "2099-10-01",
      preferredTime: "10:00",
      status: "pending",
    });
    expect(res.body.data._id).toBeTruthy();
    expect(Array.isArray(res.body.data.history)).toBe(true);
    const saved = await HomeVisit.findById(res.body.data._id);
    expect(saved).not.toBeNull();
    expect(saved!.status).toBe("pending");
  });

  it("blocks an ASHA from creating a home visit request", async () => {
    const p = await registerUser("Sunita Rao", "hv_sunita@example.com", UserRole.PATIENT);
    const asha = await registerUser("Asha G", "hv_asha@example.com", UserRole.ASHA);
    await assignCareTeam(p.id, asha.id, asha.id);
    const res = await requestVisit(asha.token, visitPayload(p.id));
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
    expect(await HomeVisit.countDocuments({})).toBe(0);
  });

  it("blocks a DOCTOR from creating a home visit request", async () => {
    const p = await registerUser("Doctor P", "hv_doc_p@example.com", UserRole.PATIENT);
    const doctor = await registerUser("Doc G", "hv_doc@example.com", UserRole.DOCTOR);
    await assignCareTeam(p.id, doctor.id, doctor.id);
    const res = await requestVisit(doctor.token, visitPayload(p.id));
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
    expect(await HomeVisit.countDocuments({})).toBe(0);
  });

  it("blocks an ADMIN from creating a home visit request", async () => {
    const p = await registerUser("Admin P", "hv_admin_p@example.com", UserRole.PATIENT);
    const admin = await registerAdmin("hv_admin_create@example.com");
    const res = await requestVisit(admin.token, visitPayload(p.id));
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
    expect(await HomeVisit.countDocuments({})).toBe(0);
  });

  it("rejects unauthenticated requests", async () => {
    const payload = visitPayload("000000000000000000000000");
    expect((await api().post("/api/v1/home-visits").send(payload)).status).toBe(401);
    expect((await api().get("/api/v1/home-visits")).status).toBe(401);
  });

  it("rejects invalid request payloads", async () => {
    const p = await registerUser("Nirmala Devi", "hv_nirmala@example.com", UserRole.PATIENT);
    const cases: Record<string, unknown>[] = [
      { patient: "abc", preferredDate: "2099-10-01", preferredTime: "10:00", reason: "Fever" },
      { patient: p.id, preferredTime: "10:00", reason: "Fever" },
      { patient: p.id, preferredDate: "2099-10-01", reason: "Fever" },
      { patient: p.id, preferredDate: "2099-10-01", preferredTime: "10:00" },
      { patient: p.id, preferredDate: "not-a-date", preferredTime: "10:00", reason: "Fever" },
      { patient: p.id, preferredDate: "2099-10-01", preferredTime: "25:99", reason: "Fever" },
      { patient: p.id, preferredDate: "2099-10-01", preferredTime: "10:00", reason: "   " },
    ];
    for (const body of cases) {
      const res = await requestVisit(p.token, body);
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("BAD_REQUEST");
    }
  });

  it("prevents a patient from requesting a visit for another patient", async () => {
    const a = await registerUser("Patient A", "hv_a@example.com", UserRole.PATIENT);
    const b = await registerUser("Patient B", "hv_b@example.com", UserRole.PATIENT);
    const res = await requestVisit(a.token, visitPayload(b.id));
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
  });
});

describe("home visit access control", () => {
  beforeAll(connectTestDb);
  afterEach(cleanDb);

  async function setup() {
    const pA = await registerUser("Access A", "hv_acc_a@example.com", UserRole.PATIENT);
    const pB = await registerUser("Access B", "hv_acc_b@example.com", UserRole.PATIENT);
    const ashaA = await registerUser("Access Asha A", "hv_acc_asha@example.com", UserRole.ASHA);
    const ashaB = await registerUser("Access Asha B", "hv_acc_asha2@example.com", UserRole.ASHA);
    const doctorA = await registerUser("Access Doc A", "hv_acc_doc@example.com", UserRole.DOCTOR);
    const doctorB = await registerUser("Access Doc B", "hv_acc_doc2@example.com", UserRole.DOCTOR);
    const admin = await registerAdmin("hv_admin_acc@example.com");
    await assignCareTeam(pA.id, ashaA.id, doctorA.id);
    const created = await requestVisit(pA.token, visitPayload(pA.id));
    expect(created.status).toBe(201);
    return { visitId: created.body.data._id as string, pA, pB, ashaA, ashaB, doctorA, doctorB, admin };
  }

  it("lets the owning patient read their own visit", async () => {
    const { visitId, pA } = await setup();
    const res = await getVisit(pA.token, visitId);
    expect(res.status).toBe(200);
    expect(res.body.data._id).toBe(visitId);
    expect(res.body.data.status).toBe("pending");
  });

  it("blocks another patient from reading a visit", async () => {
    const { visitId, pB } = await setup();
    const res = await getVisit(pB.token, visitId);
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
  });

  it("lets the assigned ASHA read the patient's visit", async () => {
    const { visitId, ashaA } = await setup();
    expect((await getVisit(ashaA.token, visitId)).status).toBe(200);
  });

  it("blocks an unrelated ASHA from reading the visit", async () => {
    const { visitId, ashaB } = await setup();
    expect((await getVisit(ashaB.token, visitId)).status).toBe(403);
  });

  it("lets the assigned doctor read the patient's visit", async () => {
    const { visitId, doctorA } = await setup();
    expect((await getVisit(doctorA.token, visitId)).status).toBe(200);
  });

  it("blocks an unrelated doctor from reading the visit", async () => {
    const { visitId, doctorB } = await setup();
    expect((await getVisit(doctorB.token, visitId)).status).toBe(403);
  });

  it("lets an admin read any home visit", async () => {
    const { visitId, admin } = await setup();
    expect((await getVisit(admin.token, visitId)).status).toBe(200);
  });

  it("rejects malformed and unknown visit ids", async () => {
    const { pA } = await setup();
    expect((await getVisit(pA.token, "not-an-id")).status).toBe(400);
    expect((await getVisit(pA.token, "000000000000000000000000")).status).toBe(404);
  });
});

describe("home visit listing", () => {
  beforeAll(connectTestDb);
  afterEach(cleanDb);

  it("lets a patient see only their own visits", async () => {
    const a = await registerUser("List A", "hv_list_a@example.com", UserRole.PATIENT);
    const b = await registerUser("List B", "hv_list_b@example.com", UserRole.PATIENT);
    await requestVisit(a.token, visitPayload(a.id));
    await requestVisit(b.token, visitPayload(b.id));
    const res = await api().get("/api/v1/home-visits").set("Authorization", `Bearer ${a.token}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].patient).toBe(a.id);
  });

  it("lets an assigned ASHA see only their patients' visits", async () => {
    const a = await registerUser("Shown", "hv_asha_list@example.com", UserRole.PATIENT);
    const b = await registerUser("Hidden", "hv_asha_list2@example.com", UserRole.PATIENT);
    const asha = await registerUser("List Asha", "hv_list_asha@example.com", UserRole.ASHA);
    await assignCareTeam(a.id, asha.id, asha.id);
    await requestVisit(a.token, visitPayload(a.id));
    await requestVisit(b.token, visitPayload(b.id));
    const res = await api().get("/api/v1/home-visits").set("Authorization", `Bearer ${asha.token}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].patient).toBe(a.id);
  });

  it("includes the patient name for an assigned ASHA's listing", async () => {
    const a = await registerUser("Navya Kulkarni", "hv_asha_name@example.com", UserRole.PATIENT);
    const asha = await registerUser("Name Asha", "hv_name_asha@example.com", UserRole.ASHA);
    await assignCareTeam(a.id, asha.id, asha.id);
    const created = await requestVisit(a.token, visitPayload(a.id));
    expect(created.status).toBe(201);
    const res = await api().get("/api/v1/home-visits").set("Authorization", `Bearer ${asha.token}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].patient).toBe(a.id);
    expect(res.body.data[0].patientName).toBe("Navya Kulkarni");
  });

  it("hides visits belonging to a patient assigned to another ASHA", async () => {
    const a = await registerUser("Routed", "hv_routed_b@example.com", UserRole.PATIENT);
    const ashaA = await registerUser("Routed Asha", "hv_routed_asha@example.com", UserRole.ASHA);
    const ashaB = await registerUser("Unrelated Asha", "hv_unrelated_asha@example.com", UserRole.ASHA);
    await assignCareTeam(a.id, ashaA.id, ashaA.id);
    await requestVisit(a.token, visitPayload(a.id));
    const res = await api().get("/api/v1/home-visits").set("Authorization", `Bearer ${ashaB.token}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
  });

  it("lets an admin see all visits", async () => {
    const a = await registerUser("All A", "hv_all_a@example.com", UserRole.PATIENT);
    const b = await registerUser("All B", "hv_all_b@example.com", UserRole.PATIENT);
    const admin = await registerAdmin("hv_admin_list@example.com");
    await requestVisit(a.token, visitPayload(a.id));
    await requestVisit(b.token, visitPayload(b.id));
    const res = await api().get("/api/v1/home-visits").set("Authorization", `Bearer ${admin.token}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
  });

  it("applies page/limit pagination", async () => {
    const p = await registerUser("Pager", "hv_page@example.com", UserRole.PATIENT);
    for (let i = 0; i < 3; i += 1) {
      await requestVisit(p.token, visitPayload(p.id, { notes: `visit ${i}` }));
    }
    const pageOne = await api()
      .get("/api/v1/home-visits?page=1&limit=2")
      .set("Authorization", `Bearer ${p.token}`);
    expect(pageOne.status).toBe(200);
    expect(pageOne.body.data).toHaveLength(2);
    expect(pageOne.body.meta).toMatchObject({ page: 1, limit: 2, total: 3, totalPages: 2 });
    const pageTwo = await api()
      .get("/api/v1/home-visits?page=2&limit=2")
      .set("Authorization", `Bearer ${p.token}`);
    expect(pageTwo.body.data).toHaveLength(1);
    expect(pageTwo.body.meta).toMatchObject({ page: 2, limit: 2, total: 3, totalPages: 2 });
    const ids = [...pageOne.body.data.map((v: { _id: string }) => v._id), pageTwo.body.data[0]._id];
    expect(new Set(ids).size).toBe(3);
  });

  it("rejects invalid page and limit", async () => {
    const p = await registerUser("Pager Bad", "hv_page_bad@example.com", UserRole.PATIENT);
    for (const query of ["page=0", "limit=abc", "page=-1"]) {
      const res = await api().get(`/api/v1/home-visits?${query}`).set("Authorization", `Bearer ${p.token}`);
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("BAD_REQUEST");
    }
  });
});

describe("scheduling home visits", () => {
  beforeAll(connectTestDb);
  afterEach(cleanDb);

  it("lets the assigned ASHA schedule a pending visit and persists the schedule", async () => {
    const p = await registerUser("Schedule P", "hv_sched@example.com", UserRole.PATIENT);
    const asha = await registerUser("Schedule Asha", "hv_sched_asha@example.com", UserRole.ASHA);
    await assignCareTeam(p.id, asha.id, asha.id);
    const created = await requestVisit(p.token, visitPayload(p.id));
    const res = await scheduleVisit(asha.token, created.body.data._id);
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("scheduled");
    expect(res.body.data.scheduledDate).toBe("2099-10-05");
    expect(res.body.data.scheduledTime).toBe("09:30");
    expect(res.body.data.scheduledBy).toBe(asha.id);
    const saved = await HomeVisit.findById(created.body.data._id);
    expect(saved!.status).toBe("scheduled");
    expect(saved!.scheduledDate).toBe("2099-10-05");
    expect(saved!.scheduledTime).toBe("09:30");
    expect(saved!.scheduledBy!.toString()).toBe(asha.id);
  });

  it("lets an admin schedule a visit", async () => {
    const p = await registerUser("Schedule Admin P", "hv_sched_admin_p@example.com", UserRole.PATIENT);
    const admin = await registerAdmin("hv_sched_admin@example.com");
    const created = await requestVisit(p.token, visitPayload(p.id));
    expect((await scheduleVisit(admin.token, created.body.data._id)).status).toBe(200);
  });

  it("blocks the owning patient from scheduling (route RBAC)", async () => {
    const p = await registerUser("Schedule P2", "hv_sched_p2@example.com", UserRole.PATIENT);
    const created = await requestVisit(p.token, visitPayload(p.id));
    const res = await scheduleVisit(p.token, created.body.data._id);
    expect(res.status).toBe(403);
  });

  it("blocks an unrelated ASHA from scheduling", async () => {
    const p = await registerUser("Schedule P3", "hv_sched_p3@example.com", UserRole.PATIENT);
    const ashaB = await registerUser("Schedule Other", "hv_sched_other@example.com", UserRole.ASHA);
    const created = await requestVisit(p.token, visitPayload(p.id));
    expect((await scheduleVisit(ashaB.token, created.body.data._id)).status).toBe(403);
  });

  it("requires a scheduled date and time", async () => {
    const p = await registerUser("Schedule P4", "hv_sched_p4@example.com", UserRole.PATIENT);
    const asha = await registerUser("Schedule Asha2", "hv_sched_asha2@example.com", UserRole.ASHA);
    await assignCareTeam(p.id, asha.id, asha.id);
    const created = await requestVisit(p.token, visitPayload(p.id));
    const res = await api()
      .patch(`/api/v1/home-visits/${created.body.data._id}/schedule`)
      .set("Authorization", `Bearer ${asha.token}`)
      .send({});
    expect(res.status).toBe(400);
  });

  it("rejects scheduling a non-pending visit", async () => {
    const p = await registerUser("Schedule P5", "hv_sched_p5@example.com", UserRole.PATIENT);
    const asha = await registerUser("Schedule Asha3", "hv_sched_asha3@example.com", UserRole.ASHA);
    await assignCareTeam(p.id, asha.id, asha.id);
    const created = await requestVisit(p.token, visitPayload(p.id));
    const visitId = created.body.data._id;
    expect((await scheduleVisit(asha.token, visitId)).status).toBe(200);
    const again = await scheduleVisit(asha.token, visitId);
    expect(again.status).toBe(400);
    expect(again.body.error.message).toBe("Only pending visits can be scheduled");
  });
});

describe("completing home visits", () => {
  beforeAll(connectTestDb);
  afterEach(cleanDb);

  it("lets an assigned ASHA complete a scheduled visit and persists notes/follow-up/result", async () => {
    const p = await registerUser("Complete P", "hv_comp@example.com", UserRole.PATIENT);
    const asha = await registerUser("Complete Asha", "hv_comp_asha@example.com", UserRole.ASHA);
    await assignCareTeam(p.id, asha.id, asha.id);
    const created = await requestVisit(p.token, visitPayload(p.id));
    const visitId = created.body.data._id;
    expect((await scheduleVisit(asha.token, visitId)).status).toBe(200);
    const res = await completeVisit(asha.token, visitId, {
      visitNotes: "Nebulisation provided",
      followUpNeeded: true,
      result: { spo2: 97 },
    });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("completed");
    expect(res.body.data.visitNotes).toBe("Nebulisation provided");
    expect(res.body.data.followUpNeeded).toBe(true);
    expect(res.body.data.completedBy).toBe(asha.id);
    expect(res.body.data.completedAt).toBeTruthy();
    const saved = await HomeVisit.findById(visitId);
    expect(saved!.status).toBe("completed");
    expect(saved!.visitNotes).toBe("Nebulisation provided");
    expect(saved!.followUpNeeded).toBe(true);
    expect(saved!.completedBy!.toString()).toBe(asha.id);
    expect(saved!.completedAt).toBeInstanceOf(Date);
    const storedResult = saved!.result as unknown as Map<string, number>;
    expect(storedResult.get("spo2")).toBe(97);
  });

  it("rejects completing a non-scheduled visit", async () => {
    const p = await registerUser("Complete P2", "hv_comp2@example.com", UserRole.PATIENT);
    const asha = await registerUser("Complete Asha2", "hv_comp_asha2@example.com", UserRole.ASHA);
    await assignCareTeam(p.id, asha.id, asha.id);
    const created = await requestVisit(p.token, visitPayload(p.id));
    const res = await completeVisit(asha.token, created.body.data._id, { visitNotes: "Done" });
    expect(res.status).toBe(400);
    expect(res.body.error.message).toBe("Only scheduled visits can be completed");
  });

  it("blocks the owning patient from completing (route RBAC)", async () => {
    const p = await registerUser("Complete P3", "hv_comp3@example.com", UserRole.PATIENT);
    const created = await requestVisit(p.token, visitPayload(p.id));
    expect((await completeVisit(p.token, created.body.data._id, {})).status).toBe(403);
  });
});

describe("cancelling home visits", () => {
  beforeAll(connectTestDb);
  afterEach(cleanDb);

  it("lets the owning patient cancel a pending visit with a reason", async () => {
    const p = await registerUser("Cancel P", "hv_cancel@example.com", UserRole.PATIENT);
    const created = await requestVisit(p.token, visitPayload(p.id));
    const res = await cancelVisit(p.token, created.body.data._id, { cancelledReason: "Feeling better" });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("cancelled");
    expect(res.body.data.cancelledReason).toBe("Feeling better");
    const saved = await HomeVisit.findById(created.body.data._id);
    expect(saved!.status).toBe("cancelled");
    expect(saved!.cancelledReason).toBe("Feeling better");
  });

  it("lets the owning patient cancel a scheduled visit", async () => {
    const p = await registerUser("Cancel P2", "hv_cancel2@example.com", UserRole.PATIENT);
    const asha = await registerUser("Cancel Asha", "hv_cancel_asha@example.com", UserRole.ASHA);
    await assignCareTeam(p.id, asha.id, asha.id);
    const created = await requestVisit(p.token, visitPayload(p.id));
    const visitId = created.body.data._id;
    expect((await scheduleVisit(asha.token, visitId)).status).toBe(200);
    const res = await cancelVisit(p.token, visitId, { cancelledReason: "Unavailable at that time" });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("cancelled");
  });

  it("rejects cancellation without a reason", async () => {
    const p = await registerUser("Cancel P3", "hv_cancel3@example.com", UserRole.PATIENT);
    const created = await requestVisit(p.token, visitPayload(p.id));
    const res = await cancelVisit(p.token, created.body.data._id, {});
    expect(res.status).toBe(400);
    expect(res.body.error.message).toBe("Cancellation reason is required");
  });

  it("rejects cancelling a terminal visit", async () => {
    const p = await registerUser("Cancel P4", "hv_cancel4@example.com", UserRole.PATIENT);
    const asha = await registerUser("Cancel Asha2", "hv_cancel_asha2@example.com", UserRole.ASHA);
    await assignCareTeam(p.id, asha.id, asha.id);
    const created = await requestVisit(p.token, visitPayload(p.id));
    const visitId = created.body.data._id;
    expect((await scheduleVisit(asha.token, visitId)).status).toBe(200);
    expect((await completeVisit(asha.token, visitId, {})).status).toBe(200);
    const res = await cancelVisit(p.token, visitId, { cancelledReason: "Too late" });
    expect(res.status).toBe(400);
    expect(res.body.error.message).toBe("This visit cannot be cancelled");
  });

  it("lets the assigned ASHA cancel an accessible visit", async () => {
    const p = await registerUser("Cancel P5", "hv_cancel5@example.com", UserRole.PATIENT);
    const asha = await registerUser("Cancel Asha3", "hv_cancel_asha3@example.com", UserRole.ASHA);
    await assignCareTeam(p.id, asha.id, asha.id);
    const created = await requestVisit(p.token, visitPayload(p.id));
    const res = await cancelVisit(asha.token, created.body.data._id, { cancelledReason: "Logistics issue" });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("cancelled");
  });

  it("blocks another patient from cancelling", async () => {
    const a = await registerUser("Cancel A", "hv_cancel_a@example.com", UserRole.PATIENT);
    const b = await registerUser("Cancel B", "hv_cancel_b@example.com", UserRole.PATIENT);
    const created = await requestVisit(a.token, visitPayload(a.id));
    const res = await cancelVisit(b.token, created.body.data._id, { cancelledReason: "Sneaky" });
    expect(res.status).toBe(403);
  });
});

describe("escalating home visits", () => {
  beforeAll(connectTestDb);
  afterEach(cleanDb);

  it("lets the assigned ASHA escalate a pending visit and creates a real referral", async () => {
    const p = await registerUser("Escalation P", "hv_esc@example.com", UserRole.PATIENT);
    const asha = await registerUser("Escalation Asha", "hv_esc_asha@example.com", UserRole.ASHA);
    await assignCareTeam(p.id, asha.id, asha.id);
    const created = await requestVisit(p.token, visitPayload(p.id));
    const visitId = created.body.data._id;
    const res = await escalateVisit(asha.token, visitId, { reason: "Needs specialist assessment" });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("escalated");
    expect(res.body.data.escalateReason).toBe("Needs specialist assessment");
    expect(res.body.data.referralId).toBeTruthy();

    const referral = await Referral.findOne({ patient: p.id });
    expect(referral).not.toBeNull();
    expect(referral!.status).toBe("pending");
    expect(referral!.reason).toBe("Needs specialist assessment");
    expect(referral!.referredBy.toString()).toBe(asha.id);
    expect(referral!.notes).toContain("Escalated from home visit");
    expect(referral!._id.toString()).toBe(res.body.data.referralId);

    const saved = await HomeVisit.findById(visitId);
    expect(saved!.status).toBe("escalated");
    expect(saved!.escalateReason).toBe("Needs specialist assessment");
    expect(saved!.referralId!.toString()).toBe(referral!._id.toString());
  });

  it("escalates from a scheduled visit too", async () => {
    const p = await registerUser("Escalation P2", "hv_esc2@example.com", UserRole.PATIENT);
    const asha = await registerUser("Escalation Asha2", "hv_esc_asha2@example.com", UserRole.ASHA);
    await assignCareTeam(p.id, asha.id, asha.id);
    const created = await requestVisit(p.token, visitPayload(p.id));
    const visitId = created.body.data._id;
    expect((await scheduleVisit(asha.token, visitId)).status).toBe(200);
    const res = await escalateVisit(asha.token, visitId, { reason: "Condition worsened" });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("escalated");
  });

  it("lets an admin escalate a visit", async () => {
    const p = await registerUser("Escalation P3", "hv_esc3@example.com", UserRole.PATIENT);
    const admin = await registerAdmin("hv_esc_admin@example.com");
    const created = await requestVisit(p.token, visitPayload(p.id));
    const res = await escalateVisit(admin.token, created.body.data._id, { reason: "Admin review needed" });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("escalated");
  });

  it("rejects escalating a terminal visit", async () => {
    const p = await registerUser("Escalation P4", "hv_esc4@example.com", UserRole.PATIENT);
    const asha = await registerUser("Escalation Asha3", "hv_esc_asha3@example.com", UserRole.ASHA);
    await assignCareTeam(p.id, asha.id, asha.id);
    const created = await requestVisit(p.token, visitPayload(p.id));
    const visitId = created.body.data._id;
    expect((await scheduleVisit(asha.token, visitId)).status).toBe(200);
    expect((await completeVisit(asha.token, visitId, {})).status).toBe(200);
    const res = await escalateVisit(asha.token, visitId, { reason: "Too late to escalate" });
    expect(res.status).toBe(400);
    expect(res.body.error.message).toBe("Only pending or scheduled visits can be escalated");
  });

  it("rejects a blank escalation reason", async () => {
    const p = await registerUser("Escalation P5", "hv_esc5@example.com", UserRole.PATIENT);
    const asha = await registerUser("Escalation Asha4", "hv_esc_asha4@example.com", UserRole.ASHA);
    await assignCareTeam(p.id, asha.id, asha.id);
    const created = await requestVisit(p.token, visitPayload(p.id));
    const res = await escalateVisit(asha.token, created.body.data._id, { reason: "   " });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("BAD_REQUEST");
  });

  it("blocks the owning patient from escalating (route RBAC)", async () => {
    const p = await registerUser("Escalation P6", "hv_esc6@example.com", UserRole.PATIENT);
    const created = await requestVisit(p.token, visitPayload(p.id));
    const res = await escalateVisit(p.token, created.body.data._id, { reason: "Patient cannot self escalate" });
    expect(res.status).toBe(403);
  });

  it("blocks an unrelated ASHA from escalating", async () => {
    const p = await registerUser("Escalation P7", "hv_esc7@example.com", UserRole.PATIENT);
    const ashaB = await registerUser("Escalation Other", "hv_esc_other@example.com", UserRole.ASHA);
    const created = await requestVisit(p.token, visitPayload(p.id));
    const res = await escalateVisit(ashaB.token, created.body.data._id, { reason: "Should fail" });
    expect(res.status).toBe(403);
  });
});

describe("home visit validation and security", () => {
  beforeAll(connectTestDb);
  afterEach(cleanDb);

  it("rejects malformed ids on every action endpoint", async () => {
    const p = await registerUser("Security P", "hv_sec@example.com", UserRole.PATIENT);
    const asha = await registerUser("Security Asha", "hv_sec_asha@example.com", UserRole.ASHA);
    const bad = "this-is-not-an-object-id";
    expect((await getVisit(p.token, bad)).status).toBe(400);
    expect((await scheduleVisit(asha.token, bad)).status).toBe(400);
    expect((await completeVisit(asha.token, bad, {})).status).toBe(400);
    expect((await cancelVisit(p.token, bad, { cancelledReason: "x" })).status).toBe(400);
    expect((await escalateVisit(asha.token, bad, { reason: "x" })).status).toBe(400);
  });

  it("rejects unauthenticated access to every endpoint", async () => {
    const validId = "000000000000000000000000";
    expect((await api().post("/api/v1/home-visits").send(visitPayload(validId))).status).toBe(401);
    expect((await api().get("/api/v1/home-visits")).status).toBe(401);
    expect((await api().get(`/api/v1/home-visits/${validId}`)).status).toBe(401);
    expect((await api().patch(`/api/v1/home-visits/${validId}/schedule`).send({})).status).toBe(401);
    expect((await api().patch(`/api/v1/home-visits/${validId}/complete`).send({})).status).toBe(401);
    expect((await api().patch(`/api/v1/home-visits/${validId}/cancel`).send({})).status).toBe(401);
    expect((await api().patch(`/api/v1/home-visits/${validId}/escalate`).send({ reason: "x" })).status).toBe(401);
  });

  it("enforces the route-level RBAC matrix", async () => {
    const p = await registerUser("Rbac P", "hv_rbac@example.com", UserRole.PATIENT);
    const asha = await registerUser("Rbac Asha", "hv_rbac_asha@example.com", UserRole.ASHA);
    await assignCareTeam(p.id, asha.id, asha.id);
    const created = await requestVisit(p.token, visitPayload(p.id));
    const visitId = created.body.data._id;
    expect((await scheduleVisit(p.token, visitId)).status).toBe(403);
    expect((await completeVisit(p.token, visitId, {})).status).toBe(403);
    expect((await escalateVisit(p.token, visitId, { reason: "x" })).status).toBe(403);
    expect((await cancelVisit(asha.token, visitId, { cancelledReason: "Staff backup" })).status).toBe(200);
  });
});