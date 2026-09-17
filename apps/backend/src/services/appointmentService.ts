import { refreshAlertsAfterWrite } from "./alertEngine";
import { isValidObjectId } from "mongoose";
import { Appointment } from "../models/Appointment";
import { ApiError } from "../utils/ApiError";
import { getAccessiblePatientIds } from "./accessService";
import { AuthUser } from "../middleware/auth";
import { AppointmentStatus } from "@maasuraksha/shared";
import { User } from "../models/User";

export interface AppointmentInput {
  patient: string;
  doctor?: string;
  asha?: string;
  date: string;
  time: string;
  type: string;
  notes?: string;
}

export async function createAppointment(actor: AuthUser, input: AppointmentInput) {
  validateId(input.patient);
  if (input.doctor) validateId(input.doctor);
  if (input.asha) validateId(input.asha);

  const allowed = await getAccessiblePatientIds(actor);
  if (actor.role === "PATIENT" && input.patient !== actor.userId) {
    throw ApiError.forbidden("You can only book appointments for yourself");
  }
  if (actor.role !== "ADMIN" && !allowed.has(input.patient)) {
    throw ApiError.forbidden("You do not have access to this patient's data");
  }

  const patient = await User.findOne({ _id: input.patient, role: "PATIENT", isActive: true });
  if (!patient) throw ApiError.notFound("Patient not found");
  const date = new Date(input.date);
  const today = new Date();
  const todayDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) < todayDate) {
    throw ApiError.badRequest("Choose today or a future appointment date");
  }
  const doctor = actor.role === "PATIENT" ? patient.assignedDoctor?.toString() : input.doctor ?? patient.assignedDoctor?.toString();
  const asha = actor.role === "PATIENT" ? patient.assignedASHA?.toString() : input.asha ?? (actor.role === "ASHA" ? actor.userId : patient.assignedASHA?.toString());
  for (const [id, role] of [[doctor, "DOCTOR"], [asha, "ASHA"]] as const) {
    if (id && !(await User.exists({ _id: id, role, isActive: true }))) {
      throw ApiError.badRequest(`Assigned ${role.toLowerCase()} is unavailable`);
    }
  }

  const appointment = await Appointment.create({
    patient: input.patient,
    doctor,
    asha,
    date,
    time: input.time,
    type: input.type,
    notes: input.notes,
  });

  await refreshAlertsAfterWrite(input.patient);
  return toDto(appointment);
}

export async function listAppointments(
  actor: AuthUser,
  targetPatientId: string | undefined,
  page: number,
  limit: number,
  status?: string
) {
  const allowed = await getAccessiblePatientIds(actor);
  let filter: Record<string, unknown>;

  if (actor.role === "PATIENT") {
    filter = { patient: actor.userId };
  } else if (targetPatientId) {
    if (actor.role !== "ADMIN" && !allowed.has(targetPatientId)) {
      throw ApiError.forbidden("You do not have access to this patient's data");
    }
    filter = { patient: targetPatientId };
  } else if (actor.role === "ADMIN") {
    filter = {};
  } else {
    filter = { patient: { $in: Array.from(allowed) } };
  }

  if (status) {
    if (!Object.values(AppointmentStatus).includes(status as AppointmentStatus)) {
      throw ApiError.badRequest("Invalid appointment status");
    }
    filter.status = status;
  }

  const total = await Appointment.countDocuments(filter);
  const items = await Appointment.find(filter)
    .sort({ date: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  return { items: items.map(toDto), total };
}

export async function getAppointment(actor: AuthUser, appointmentId: string) {
  validateId(appointmentId);
  const allowed = await getAccessiblePatientIds(actor);
  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) throw ApiError.notFound("Appointment not found");

  const isRelatedDoctor =
    actor.role === "DOCTOR" && appointment.doctor?.toString() === actor.userId;
  const isRelatedAsha =
    actor.role === "ASHA" && allowed.has(appointment.patient.toString());
  const isRelatedPatient =
    actor.role === "PATIENT" && appointment.patient.toString() === actor.userId;
  const isAssignedDoctor =
    actor.role === "DOCTOR" && allowed.has(appointment.patient.toString());

  if (
    actor.role !== "ADMIN" &&
    !isRelatedDoctor &&
    !isRelatedAsha &&
    !isRelatedPatient &&
    !isAssignedDoctor
  ) {
    throw ApiError.forbidden("You do not have access to this appointment");
  }
  return toDto(appointment);
}

export async function updateAppointmentStatus(
  actor: AuthUser,
  appointmentId: string,
  status: AppointmentStatus,
  cancelledReason?: string
) {
  if (!Object.values(AppointmentStatus).includes(status)) {
    throw ApiError.badRequest("Invalid appointment status");
  }
  validateId(appointmentId);
  const allowed = await getAccessiblePatientIds(actor);
  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) throw ApiError.notFound("Appointment not found");

  const related =
    appointment.patient.toString() === actor.userId ||
    appointment.doctor?.toString() === actor.userId ||
    appointment.asha?.toString() === actor.userId ||
    actor.role === "ADMIN" ||
    (actor.role !== "PATIENT" && allowed.has(appointment.patient.toString()));

  if (!related) {
    throw ApiError.forbidden("You do not have access to this appointment");
  }

  if (actor.role === "PATIENT" && status !== AppointmentStatus.CANCELLED) {
    throw ApiError.forbidden("Patients can only cancel appointments");
  }
  if (appointment.status === status) return toDto(appointment);
  const transitions: Record<string, AppointmentStatus[]> = {
    scheduled: [AppointmentStatus.CONFIRMED, AppointmentStatus.CANCELLED, AppointmentStatus.MISSED],
    confirmed: [AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED, AppointmentStatus.MISSED],
  };
  if (!transitions[appointment.status]?.includes(status)) {
    throw ApiError.conflict("This appointment can no longer be changed");
  }
  if (cancelledReason !== undefined && (typeof cancelledReason !== "string" || cancelledReason.length > 500)) {
    throw ApiError.badRequest("Cancellation reason must be under 500 characters");
  }

  appointment.status = status;
  if (status === AppointmentStatus.CANCELLED && cancelledReason) {
    appointment.cancelledReason = cancelledReason;
  }
  await appointment.save();
  await refreshAlertsAfterWrite(appointment.patient.toString());
  return toDto(appointment);
}

function validateId(id: string): void {
  if (!isValidObjectId(id)) throw ApiError.badRequest("Invalid id format");
}

function toDto(a: InstanceType<typeof Appointment>) {
  return {
    id: a._id,
    patient: a.patient,
    doctor: a.doctor,
    asha: a.asha,
    date: a.date,
    time: a.time,
    type: a.type,
    status: a.status,
    notes: a.notes,
    cancelledReason: a.cancelledReason,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
  };
}
