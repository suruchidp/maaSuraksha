import { isValidObjectId } from "mongoose";
import { Symptom } from "../models/Symptom";
import { ApiError } from "../utils/ApiError";
import { getAccessiblePatientIds } from "./accessService";
import { AuthUser } from "../middleware/auth";

export interface SymptomInput {
  symptoms: string[];
  severity: string;
  notes?: string;
  date?: string;
}

const SEVERITIES = new Set(["mild", "moderate", "severe", "critical"]);

export async function createSymptom(
  actor: AuthUser,
  targetUserId: string | undefined,
  input: SymptomInput
) {
  if (!SEVERITIES.has(input.severity)) {
    throw ApiError.badRequest("severity must be one of: mild, moderate, severe, critical");
  }
  const allowed = await getAccessiblePatientIds(actor);
  const userId = resolveTargetPatient(actor, targetUserId, allowed);

  const symptom = await Symptom.create({
    user: userId,
    symptoms: input.symptoms,
    severity: input.severity,
    notes: input.notes,
    date: input.date ? new Date(input.date) : new Date(),
    reportedBy: actor.userId,
  });

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
  if (targetUserId) assertAllowed(actor, targetUserId, allowed);

  const filter: Record<string, unknown> = targetUserId
    ? { user: targetUserId }
    : { user: { $in: Array.from(allowed) } };
  if (severity) filter.severity = severity;

  const total = await Symptom.countDocuments(filter);
  const symptoms = await Symptom.find(filter)
    .sort({ date: -1 })
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
    reportedBy: symptom.reportedBy,
    createdAt: symptom.createdAt,
    updatedAt: symptom.updatedAt,
  };
}