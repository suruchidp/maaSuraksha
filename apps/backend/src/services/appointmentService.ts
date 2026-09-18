import { isValidObjectId } from "mongoose";
import { appointmentSchema, appointmentStart, AppointmentStatus, APPOINTMENT_TIME_ZONE } from "@maasuraksha/shared";
import type { AppointmentInput } from "@maasuraksha/shared";
import { Appointment } from "../models/Appointment";
import { User } from "../models/User";
import { ApiError } from "../utils/ApiError";
import { getAccessiblePatientIds } from "./accessService";
import { AuthUser } from "../middleware/auth";
import { refreshAlertsAfterWrite } from "./alertEngine";

const active = [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED];
export async function createAppointment(actor: AuthUser, input: AppointmentInput) {
  const parsed = appointmentSchema.safeParse(input);
  if (!parsed.success) throw ApiError.badRequest(parsed.error.issues[0].message);
  input = parsed.data;
  const allowed = await getAccessiblePatientIds(actor);
  if (actor.role !== "ADMIN" && !allowed.has(input.patient)) throw ApiError.forbidden("You do not have access to this patient");
  const patient = await User.findOne({ _id: input.patient, role: "PATIENT", isActive: true });
  if (!patient) throw ApiError.notFound("Patient not found");
  assertFuture(input.date, input.time);
  const doctor = input.doctor ?? patient.assignedDoctor?.toString();
  const asha = input.asha ?? patient.assignedASHA?.toString();
  if (actor.role !== "ADMIN" && ((input.doctor && input.doctor !== patient.assignedDoctor?.toString()) || (input.asha && input.asha !== patient.assignedASHA?.toString()))) throw ApiError.forbidden("Appointments must use the patient's assigned care team");
  for (const [id, role] of [[doctor, "DOCTOR"], [asha, "ASHA"]] as const) {
    if (id && !await User.exists({ _id: id, role, isActive: true })) throw ApiError.badRequest(`Assigned ${role.toLowerCase()} is unavailable`);
  }
  const a = await Appointment.create({ ...input, doctor, asha, date: new Date(`${input.date}T00:00:00Z`) });
  await refreshAlertsAfterWrite(input.patient);
  return toDto(a);
}

export async function listAppointments(actor: AuthUser, patientId: string | undefined, page: number, limit: number, status?: string, view = "all") {
  if (patientId) validateId(patientId);
  if (!['all', 'upcoming', 'past'].includes(view)) throw ApiError.badRequest("Invalid appointment view");
  if (status && !Object.values(AppointmentStatus).includes(status as AppointmentStatus)) throw ApiError.badRequest("Invalid appointment status");
  const allowed = await getAccessiblePatientIds(actor);
  if (patientId && actor.role !== "ADMIN" && !allowed.has(patientId)) throw ApiError.forbidden("You do not have access to this patient");
  const assignment = actor.role === "DOCTOR" ? { doctor: actor.userId } : { asha: actor.userId };
  const filter: Record<string, unknown> = actor.role === "ADMIN" ? {} : actor.role === "PATIENT" ? { patient: actor.userId } : { $or: [{ patient: { $in: [...allowed] } }, assignment] };
  if (patientId) filter.patient = patientId;
  if (status) filter.status = status;
  // Compute legacy records from their original date and India-time fields.
  const start = { $dateFromString: { dateString: { $concat: [{ $dateToString: { date: "$date", format: "%Y-%m-%d", timezone: "UTC" } }, "T", "$time", ":00+05:30"] }, onError: null, onNull: null } };
  if (view === "upcoming") filter.$expr = { $and: [{ $gte: [start, new Date()] }, { $in: ["$status", active] }] };
  if (view === "past") filter.$expr = { $or: [{ $lt: [start, new Date()] }, { $not: [{ $in: ["$status", active] }] }] };
  const total = await Appointment.countDocuments(filter);
  const items = await Appointment.find(filter).sort({ date: view === "upcoming" ? 1 : -1, time: view === "upcoming" ? 1 : -1, _id: -1 }).skip((page-1)*limit).limit(limit);
  return { items: await Promise.all(items.map(toDto)), total };
}

async function accessibleAppointment(actor: AuthUser, id: string) {
  validateId(id);
  const a = await Appointment.findById(id);
  if (!a) throw ApiError.notFound("Appointment not found");
  const allowed = await getAccessiblePatientIds(actor);
  const assigned = (actor.role === "DOCTOR" && a.doctor?.toString() === actor.userId) || (actor.role === "ASHA" && a.asha?.toString() === actor.userId);
  if (actor.role !== "ADMIN" && !allowed.has(a.patient.toString()) && !assigned) throw ApiError.forbidden("You do not have access to this appointment");
  return a;
}
export async function getAppointment(actor: AuthUser, id: string) { return toDto(await accessibleAppointment(actor, id)); }

export async function updateAppointmentStatus(actor: AuthUser, id: string, status: AppointmentStatus, cancelledReason?: string) {
  if (!Object.values(AppointmentStatus).includes(status)) throw ApiError.badRequest("Invalid appointment status");
  const a = await accessibleAppointment(actor, id);
  if (actor.role === "PATIENT" && status !== AppointmentStatus.CANCELLED) throw ApiError.forbidden("Patients can only cancel appointments");
  if (cancelledReason !== undefined && (typeof cancelledReason !== "string" || cancelledReason.length > 500)) throw ApiError.badRequest("Cancellation reason must be under 500 characters");
  if (a.status === status) return toDto(a);
  const transitions: Record<string, AppointmentStatus[]> = { scheduled: [AppointmentStatus.CONFIRMED, AppointmentStatus.CANCELLED, AppointmentStatus.MISSED], confirmed: [AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED, AppointmentStatus.MISSED] };
  if (!transitions[a.status]?.includes(status)) throw ApiError.conflict("This appointment can no longer be changed");
  const future = appointmentStart(a.date, a.time).getTime() > Date.now();
  if (actor.role === "PATIENT" && !future) throw ApiError.conflict("Contact your care team to change a past appointment");
  if (future && [AppointmentStatus.COMPLETED, AppointmentStatus.MISSED].includes(status)) throw ApiError.conflict("Appointment time has not arrived yet");
  const updated = await Appointment.findOneAndUpdate({ _id: a._id, status: a.status, date: a.date, time: a.time, updatedAt: a.updatedAt }, { $set: { status, ...(status === AppointmentStatus.CANCELLED ? { cancelledReason: cancelledReason?.trim() } : {}) } }, { new: true, runValidators: true });
  if (!updated) throw ApiError.conflict("Appointment changed; refresh and try again");
  await refreshAlertsAfterWrite(a.patient.toString());
  return toDto(updated);
}

export async function rescheduleAppointment(actor: AuthUser, id: string, input: { date: string; time: string }) {
  const a = await accessibleAppointment(actor, id);
  const parsed = appointmentSchema.pick({ date: true, time: true }).strict().safeParse(input);
  if (!parsed.success) throw ApiError.badRequest(parsed.error.issues[0].message);
  assertFuture(input.date, input.time);
  if (!active.includes(a.status)) throw ApiError.conflict("Only scheduled or confirmed appointments can be rescheduled");
  if (actor.role === "PATIENT" && appointmentStart(a.date, a.time).getTime() <= Date.now()) throw ApiError.conflict("Contact your care team to change a past appointment");
  if (a.date.toISOString().slice(0,10) === input.date && a.time === input.time) return toDto(a);
  // A changed time is a new request requiring care-team confirmation again.
  const updated = await Appointment.findOneAndUpdate({ _id: a._id, status: a.status, date: a.date, time: a.time, updatedAt: a.updatedAt }, { $set: { date: new Date(`${input.date}T00:00:00Z`), time: input.time, status: AppointmentStatus.SCHEDULED }, $inc: { scheduleVersion: 1 } }, { new: true, runValidators: true });
  if (!updated) throw ApiError.conflict("Appointment changed; refresh and try again");
  await refreshAlertsAfterWrite(a.patient.toString());
  return toDto(updated);
}

function assertFuture(date: string, time: string) { const start = appointmentStart(date, time); if (isNaN(start.getTime()) || start.getTime() <= Date.now()) throw ApiError.badRequest("Choose a future appointment date and time (India time)"); }
function validateId(id: string) { if (!isValidObjectId(id)) throw ApiError.badRequest("Invalid id format"); }
async function toDto(a: InstanceType<typeof Appointment>) {
  const staff = await User.find({ _id: { $in: [a.doctor, a.asha].filter(Boolean) } }).select("name role");
  return { id: a._id, patient: a.patient, doctor: a.doctor, asha: a.asha, doctorName: staff.find(u => u.role === "DOCTOR")?.name, ashaName: staff.find(u => u.role === "ASHA")?.name, date: a.date, time: a.time, startsAt: appointmentStart(a.date, a.time), timeZone: APPOINTMENT_TIME_ZONE, type: a.type, status: a.status, notes: a.notes, cancelledReason: a.cancelledReason, scheduleVersion: a.scheduleVersion ?? 0, createdAt: a.createdAt, updatedAt: a.updatedAt };
}
