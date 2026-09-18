import { describe, it, expect, beforeAll, afterEach } from "vitest";
import { api, connectTestDb, cleanDb, registerAndGetToken } from "./helpers";
import { Alert } from "../src/models/Alert";
import { refreshPatientAlerts } from "../src/services/alertEngine";
import { User } from "../src/models/User";
import { symptomTriage } from "@maasuraksha/shared";

describe("symptom tracking", () => {
 beforeAll(connectTestDb);
 afterEach(cleanDb);
 async function patient(email = "symptoms@example.com") {
  return registerAndGetToken({ name: "Synthetic Patient", email, password: "StrongPass1", role: "PATIENT" });
 }
 it("persists tracking details, retrieves history and deduplicates urgent alerts", async () => {
  const token = await patient();
  const input = { symptoms: ["vaginal_bleeding"], severity: "mild", onset: new Date(Date.now()-3600000).toISOString(), date: new Date().toISOString(), durationHours: 1, frequency: "constant", notes: "Synthetic test" };
  const created = await api().post("/api/v1/symptoms").set("Authorization", `Bearer ${token}`).send(input);
  expect(created.status).toBe(201);
  expect(created.body.data).toMatchObject({ durationHours: 1, frequency: "constant", triage: "urgent" });
  const id = created.body.data.id;
  const detail = await api().get(`/api/v1/symptoms/${id}`).set("Authorization", `Bearer ${token}`);
  expect(detail.body.data.notes).toBe(input.notes);
  const user = await User.findOne({ email: "symptoms@example.com" });
  await refreshPatientAlerts(user!._id.toString());
  await refreshPatientAlerts(user!._id.toString());
  expect(await Alert.countDocuments({ user: user!._id, type: "symptom" })).toBe(1);
  const history = await api().get("/api/v1/symptoms?severity=mild&limit=1").set("Authorization", `Bearer ${token}`);
  expect(history.body.data[0].id).toBe(id);
  expect(history.body.meta.total).toBe(1);
 });
 it("rejects malformed tracking data and queries", async () => {
  const token = await patient();
  for (const change of [{ symptoms: [""] }, { date: "invalid" }, { date: "2099-01-01" }, { frequency: "bad" }, { durationHours: -1 }, { severity: "bad" }, { onset: "2099-01-01" }]) {
   const response = await api().post("/api/v1/symptoms").set("Authorization", `Bearer ${token}`).send({ symptoms: ["nausea"], severity: "mild", ...change });
   expect(response.status).toBe(400);
  }
  expect((await api().get("/api/v1/symptoms?severity=bad").set("Authorization", `Bearer ${token}`)).status).toBe(400);
  expect((await api().get("/api/v1/symptoms?userId[x]=bad").set("Authorization", `Bearer ${token}`)).status).toBe(400);
 });
 it("isolates patients and requires authentication", async () => {
  const token = await patient();
  const other = await patient("other-symptoms@example.com");
  const created = await api().post("/api/v1/symptoms").set("Authorization", `Bearer ${token}`).send({ symptoms: ["nausea"], severity: "mild" });
  expect((await api().get(`/api/v1/symptoms/${created.body.data.id}`).set("Authorization", `Bearer ${other}`)).status).toBe(403);
  expect((await api().get("/api/v1/symptoms").set("Authorization", `Bearer ${other}`)).body.data).toEqual([]);
  expect(await Alert.countDocuments()).toBe(0);
  expect((await api().get("/api/v1/symptoms")).status).toBe(401);
 });
 it("distinguishes common discomfort from explicit warning signs", () => {
  expect(symptomTriage(["nausea", "heartburn"], "mild")).toBe("routine");
  expect(symptomTriage(["headache"], "moderate")).toBe("review");
  for (const symptom of ["fever_38", "chest_pain", "self_harm_thoughts", "reduced_fetal_movement", "unable_to_keep_fluids"]) expect(symptomTriage([symptom], "mild")).toBe("urgent");
 });
});
