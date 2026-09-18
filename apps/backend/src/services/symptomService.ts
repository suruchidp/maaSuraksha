import { symptomSchema, symptomTriage, type SymptomInput } from "@maasuraksha/shared";
import { User } from "../models/User";
import { refreshAlertsAfterWrite } from "./alertEngine";
import { isValidObjectId } from "mongoose";
import { Symptom } from "../models/Symptom";
import { ApiError } from "../utils/ApiError";
import { getAccessiblePatientIds } from "./accessService";
import { AuthUser } from "../middleware/auth";

const SEVERITIES = new Set(["mild", "moderate", "severe", "critical"]);

export async function createSymptom(
  actor: AuthUser,
  targetUserId: string | undefined,
  input: SymptomInput
) {
  const parsed = symptomSchema.safeParse(input);
  if (!parsed.success) throw ApiError.badRequest(parsed.error.issues[0].message);
  input = parsed.data;
  if (!SEVERITIES.has(input.severity)) {
    throw ApiError.badRequest("severity must be one of: mild, moderate, severe, critical");
  }
  const allowed = await getAccessiblePatientIds(actor);
  const userId = resolveTargetPatient(actor, targetUserId, allowed);

  if (!await User.exists({ _id: userId, role: "PATIENT", isActive: true })) throw ApiError.badRequest("Active patient required");
  const symptom = await Symptom.create({
    user: userId,
    symptoms: input.symptoms,
    severity: input.severity,
    notes: input.notes,
    onset: input.onset, durationHours: input.durationHours, frequency: input.frequency,
    date: input.date ? new Date(input.date) : new Date(),
    reportedBy: actor.userId,
  });

  await refreshAlertsAfterWrite(userId);
  return toDto(symptom);
}

export async function listSymptoms(
  actor: AuthUser,
  targetUserId: string | undefined,
  page: number,
  limit: number,
  severity?: string
) {
  const allowed = await getAccessiblePatientIds(actor);
  if (severity && !SEVERITIES.has(severity)) throw ApiError.badRequest("Invalid severity");
  if (targetUserId) validateId(targetUserId);
  if (targetUserId) assertAllowed(actor, targetUserId, allowed);

  const filter: Record<string, unknown> = targetUserId
    ? { user: targetUserId }
    : actor.role === "ADMIN" ? {} : { user: { $in: Array.from(allowed) } };
  if (severity) filter.severity = severity;

  const total = await Symptom.countDocuments(filter);
  const symptoms = await Symptom.find(filter)
    .sort({ date: -1, _id: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  return { items: symptoms.map(toDto), total };
}

export async function getSymptom(actor: AuthUser, symptomId: string) {
  validateId(symptomId);
  const allowed = await getAccessiblePatientIds(actor);
  const symptom = await Symptom.findById(symptomId);
  if (!symptom) throw ApiError.notFound("Symptom record not found");
  assertAllowed(actor, symptom.user.toString(), allowed);
  return toDto(symptom);
}

function resolveTargetPatient(
  actor: AuthUser,
  targetUserId: string | undefined,
  allowed: Set<string>
): string {
  if (actor.role === "ADMIN") {
    if (!targetUserId) throw ApiError.badRequest("userId is required");
    validateId(targetUserId);
    return targetUserId;
  }
  if (targetUserId) {
    assertAllowed(actor, targetUserId, allowed);
    return targetUserId;
  }
  if (actor.role === "PATIENT") return actor.userId;
  throw ApiError.badRequest("userId is required when recording for a patient");
}

function assertAllowed(actor: AuthUser, userId: string, allowed: Set<string>): void {
  if (actor.role === "ADMIN") return;
  if (!allowed.has(userId)) {
    throw ApiError.forbidden("You do not have access to this patient's data");
  }
}

function validateId(id: string): void {
  if (!isValidObjectId(id)) {
    throw ApiError.badRequest("Invalid id format");
  }
}

function toDto(symptom: InstanceType<typeof Symptom>) {
  return {
    id: symptom._id,
    user: symptom.user,
    date: symptom.date,
    symptoms: symptom.symptoms,
    severity: symptom.severity,
    notes: symptom.notes,
    onset: symptom.onset, durationHours: symptom.durationHours, frequency: symptom.frequency,
    triage: symptomTriage(symptom.symptoms, symptom.severity),
    reportedBy: symptom.reportedBy,
    createdAt: symptom.createdAt,
    updatedAt: symptom.updatedAt,
  };
}