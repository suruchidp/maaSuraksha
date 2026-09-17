import { describe, it, expect, beforeAll, afterEach } from "vitest";
import { api, connectTestDb, cleanDb, registerAndGetToken } from "./helpers";
import { User } from "../src/models/User";

describe("appointment booking lifecycle", () => {
 beforeAll(connectTestDb);
 afterEach(cleanDb);
 async function patient(email = "booking@example.com") {
  const token = await registerAndGetToken({ name: "Patient", email, password: "StrongPass1", role: "PATIENT" });
  const user = await User.findOne({ email });
  return { token, id: user!._id.toString() };
 }
 it("persists a booking, lists it, cancels it and prevents patients from confirming it", async () => {
  const user = await patient();
  const created = await api().post("/api/v1/appointments").set("Authorization", `Bearer ${user.token}`).send({ patient: user.id, date: "2099-10-01", time: "10:00", type: "antenatal", notes: "First visit" });
  expect(created.status).toBe(201);
  expect(created.body.data.status).toBe("scheduled");
  const id = created.body.data.id;
  const list = await api().get("/api/v1/appointments").set("Authorization", `Bearer ${user.token}`);
  expect(list.body.data[0].id).toBe(id);
  const forbidden = await api().patch(`/api/v1/appointments/${id}/status`).set("Authorization", `Bearer ${user.token}`).send({ status: "confirmed" });
  expect(forbidden.status).toBe(403);
  const cancelled = await api().patch(`/api/v1/appointments/${id}/status`).set("Authorization", `Bearer ${user.token}`).send({ status: "cancelled", cancelledReason: "Cannot attend" });
  expect(cancelled.status).toBe(200);
  const saved = await api().get(`/api/v1/appointments/${id}`).set("Authorization", `Bearer ${user.token}`);
  expect(saved.body.data.status).toBe("cancelled");
  expect(saved.body.data.cancelledReason).toBe("Cannot attend");
 });
 it("rejects invalid times, past dates and another patient's booking", async () => {
  const user = await patient();
  const other = await patient("other@example.com");
  for (const [changes, status] of [[{ time: "25:99" }, 400], [{ date: "2000-01-01" }, 400], [{ patient: other.id }, 403]] as const) {
   const response = await api().post("/api/v1/appointments").set("Authorization", `Bearer ${user.token}`).send({ patient: user.id, date: "2099-10-01", time: "10:00", type: "antenatal", ...changes });
   expect(response.status).toBe(status);
  }
 });
 it("requires authentication", async () => {
  expect((await api().get("/api/v1/appointments")).status).toBe(401);
 });
});
