import { describe, it, expect, beforeAll, afterEach } from "vitest";
import { api, connectTestDb, cleanDb, registerAndGetToken } from "./helpers";
import { User } from "../src/models/User";
import { Appointment } from "../src/models/Appointment";
import { Alert } from "../src/models/Alert";
import { refreshPatientAlerts } from "../src/services/alertEngine";
import { appointmentStart, appointmentToday, validAppointmentDate } from "@maasuraksha/shared";

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
 it("reschedules a confirmed booking, requires reconfirmation and rejects terminal changes", async () => {
  const user = await patient();
  const a = await Appointment.create({ patient: user.id, date: new Date('2099-10-01'), time: '10:00', type: 'antenatal', status: 'confirmed' });
  const changed = await api().patch(`/api/v1/appointments/${a._id}/schedule`).set('Authorization', `Bearer ${user.token}`).send({ date: '2099-10-02', time: '11:30' });
  expect(changed.status).toBe(200);
  expect(changed.body.data).toMatchObject({ status: 'scheduled', time: '11:30', scheduleVersion: 1, startsAt: '2099-10-02T06:00:00.000Z', timeZone: 'Asia/Kolkata' });
  await api().patch(`/api/v1/appointments/${a._id}/status`).set('Authorization', `Bearer ${user.token}`).send({ status: 'cancelled' });
  expect((await api().patch(`/api/v1/appointments/${a._id}/schedule`).set('Authorization', `Bearer ${user.token}`).send({ date: '2099-10-03', time: '10:00' })).status).toBe(409);
 });
 it("filters upcoming and history, orders nearest bookings first and scopes query parameters", async () => {
  const user = await patient();
  await Appointment.create([
   { patient: user.id, date: new Date('2099-10-02'), time: '10:00', type: 'antenatal' },
   { patient: user.id, date: new Date('2099-10-01'), time: '11:00', type: 'antenatal' },
   { patient: user.id, date: new Date('2000-01-01'), time: '10:00', type: 'antenatal', status: 'completed' },
   { patient: user.id, date: new Date('2099-10-03'), time: '10:00', type: 'antenatal', status: 'cancelled' },
  ]);
  const upcoming = await api().get('/api/v1/appointments?view=upcoming&limit=1').set('Authorization', `Bearer ${user.token}`);
  expect(upcoming.status).toBe(200);
  expect(upcoming.body.meta.total).toBe(2);
  expect(upcoming.body.data[0].date).toBe('2099-10-01T00:00:00.000Z');
  const past = await api().get('/api/v1/appointments?view=past').set('Authorization', `Bearer ${user.token}`);
  expect(past.body.data).toHaveLength(2);
  for (const query of ['view=bad', 'status=bad', 'patientId=bad', 'patientId[x]=bad']) expect((await api().get('/api/v1/appointments?'+query).set('Authorization', `Bearer ${user.token}`)).status).toBe(400);
 });
 it("validates calendar dates and blocks earlier same-day times", async () => {
  const user = await patient();
  for (const date of ['2099-02-30', '2099-10-01T10:00:00Z']) {
   expect((await api().post('/api/v1/appointments').set('Authorization', `Bearer ${user.token}`).send({ patient: user.id, date, time: '10:00', type: 'antenatal' })).status).toBe(400);
  }
  expect((await api().post('/api/v1/appointments').set('Authorization', `Bearer ${user.token}`).send({ patient: user.id, date: appointmentToday(), time: '00:00', type: 'antenatal' })).status).toBe(400);
  expect(validAppointmentDate('2028-02-29')).toBe(true);
  expect(validAppointmentDate('2027-02-29')).toBe(false);
  expect(appointmentToday(new Date('2030-01-01T20:00:00Z'))).toBe('2030-01-02');
  expect(appointmentStart('2030-01-02', '00:15').toISOString()).toBe('2030-01-01T18:45:00.000Z');
 });
 it("uses assigned care team, limits staff access and manages the status lifecycle", async () => {
  const user = await patient();
  const doctorToken = await registerAndGetToken({ name: 'Assigned Doctor', email: 'assigned@example.com', password: 'StrongPass1', role: 'DOCTOR' });
  const ashaToken = await registerAndGetToken({ name: 'Assigned ASHA', email: 'asha@example.com', password: 'StrongPass1', role: 'ASHA' });
  const outsiderToken = await registerAndGetToken({ name: 'Other Doctor', email: 'outsider@example.com', password: 'StrongPass1', role: 'DOCTOR' });
  const doctor = await User.findOne({ email: 'assigned@example.com' });
  const asha = await User.findOne({ email: 'asha@example.com' });
  const outsider = await User.findOne({ email: 'outsider@example.com' });
  await User.findByIdAndUpdate(user.id, { assignedDoctor: doctor!._id, assignedASHA: asha!._id });
  const created = await api().post('/api/v1/appointments').set('Authorization', `Bearer ${ashaToken}`).send({ patient: user.id, date: '2099-10-01', time: '10:00', type: 'antenatal' });
  expect(created.status).toBe(201);
  expect(created.body.data).toMatchObject({ doctorName: 'Assigned Doctor', ashaName: 'Assigned ASHA' });
  const id = created.body.data.id;
  expect((await api().patch(`/api/v1/appointments/${id}/status`).set('Authorization', `Bearer ${doctorToken}`).send({ status: 'confirmed' })).status).toBe(200);
  expect((await api().patch(`/api/v1/appointments/${id}/status`).set('Authorization', `Bearer ${doctorToken}`).send({ status: 'completed' })).status).toBe(409);
  expect((await api().patch(`/api/v1/appointments/${id}/schedule`).set('Authorization', `Bearer ${outsiderToken}`).send({ date: '2099-10-02', time: '10:00' })).status).toBe(403);
  expect((await api().post('/api/v1/appointments').set('Authorization', `Bearer ${user.token}`).send({ patient: user.id, doctor: outsider!._id.toString(), date: '2099-10-03', time: '10:00', type: 'antenatal' })).status).toBe(403);
  await Appointment.findByIdAndUpdate(id, { date: new Date('2000-01-01') });
  expect((await api().patch(`/api/v1/appointments/${id}/status`).set('Authorization', `Bearer ${doctorToken}`).send({ status: 'completed' })).status).toBe(200);
  expect((await api().patch(`/api/v1/appointments/${id}/status`).set('Authorization', `Bearer ${doctorToken}`).send({ status: 'confirmed' })).status).toBe(409);
 });
 it("retires old schedule reminders, deduplicates replacements and resolves cancellation", async () => {
  const user = await patient();
  const when = new Date(Date.now()+3*3600000);
  const day = appointmentToday(when);
  const time = new Date(when.getTime()+330*60000).toISOString().slice(11,16);
  const a = await Appointment.create({ patient: user.id, date: new Date(day), time, type: 'antenatal' });
  await refreshPatientAlerts(user.id);
  expect(await Alert.countDocuments({ user: user.id, type: 'appointment', status: 'pending' })).toBe(1);
  const later = new Date(when.getTime()+3600000);
  const changed = await api().patch(`/api/v1/appointments/${a._id}/schedule`).set('Authorization', `Bearer ${user.token}`).send({ date: appointmentToday(later), time: new Date(later.getTime()+330*60000).toISOString().slice(11,16) });
  expect(changed.status).toBe(200);
  await refreshPatientAlerts(user.id);
  expect(await Alert.countDocuments({ user: user.id, type: 'appointment', status: 'resolved' })).toBe(1);
  expect(await Alert.countDocuments({ user: user.id, type: 'appointment', status: 'pending' })).toBe(1);
  await api().patch(`/api/v1/appointments/${a._id}/status`).set('Authorization', `Bearer ${user.token}`).send({ status: 'cancelled', cancelledReason: 'Synthetic cancellation' });
  expect(await Alert.countDocuments({ user: user.id, type: 'appointment', status: 'pending' })).toBe(0);
 });
});
