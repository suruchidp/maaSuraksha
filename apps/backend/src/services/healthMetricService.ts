import { HealthMetric } from "../models/HealthMetric";
import { ApiError } from "../utils/ApiError";
import { getAccessiblePatientIds } from "./accessService";
import { AuthUser } from "../middleware/auth";
import { isValidObjectId } from "mongoose";

export interface HealthMetricInput {
  systolicBP?: number;
  diastolicBP?: number;
  weight?: number;
  glucose?: number;
  heartRate?: number;
  temperature?: number;
  hemoglobin?: number;
  date?: string;
  notes?: string;
}

export async function createHealthMetric(
  actor: AuthUser,
  targetUserId: string | undefined,
  input: HealthMetricInput
) {
  const allowed = await getAccessiblePatientIds(actor);
  const userId = resolveTargetPatient(actor, targetUserId, allowed);

  const metric = await HealthMetric.create({
    user: userId,
    systolicBP: input.systolicBP,
    diastolicBP: input.diastolicBP,
    weight: input.weight,
    glucose: input.glucose,
    heartRate: input.heartRate,
    temperature: input.temperature,
    hemoglobin: input.hemoglobin,
    date: input.date ? new Date(input.date) : new Date(),
    notes: input.notes,
    recordedBy: actor.userId,
  });

  return toDto(metric);
}

export async function listHealthMetrics(
  actor: AuthUser,
  targetUserId: string | undefined,
  page: number,
  limit: number,
  fromDate?: string,
  toDate?: string
) {
  const allowed = await getAccessiblePatientIds(actor);
  if (targetUserId) assertAllowed(actor, targetUserId, allowed);

  const filter: Record<string, unknown> = targetUserId
    ? { user: targetUserId }
    : allowed.size > 0 || actor.role === "ADMIN"
      ? { user: { $in: Array.from(allowed) } }
      : { $expr: false };

  if (fromDate || toDate) {
    filter.date = {};
    if (fromDate) (filter.date as Record<string, unknown>).$gte = new Date(fromDate);
    if (toDate) (filter.date as Record<string, unknown>).$lte = new Date(toDate);
  }

  const total = await HealthMetric.countDocuments(filter);
  const metrics = await HealthMetric.find(filter)
    .sort({ date: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  return {
    items: metrics.map(toDto),
    total,
  };
}

export async function getHealthMetric(actor: AuthUser, metricId: string) {
  validateId(metricId);
  const allowed = await getAccessiblePatientIds(actor);
  const metric = await HealthMetric.findById(metricId);
  if (!metric) throw ApiError.notFound("Health metric not found");
  assertAllowed(actor, metric.user.toString(), allowed);
  return toDto(metric);
}

export async function updateHealthMetric(
  actor: AuthUser,
  metricId: string,
  input: HealthMetricInput
) {
  validateId(metricId);
  const allowed = await getAccessiblePatientIds(actor);
  const metric = await HealthMetric.findById(metricId);
  if (!metric) throw ApiError.notFound("Health metric not found");
  assertAllowed(actor, metric.user.toString(), allowed);

  const fields: Array<keyof HealthMetricInput> = [
    "systolicBP",
    "diastolicBP",
    "weight",
    "glucose",
    "heartRate",
    "temperature",
    "hemoglobin",
    "notes",
  ];
  for (const f of fields) {
    if (input[f] !== undefined) {
      (metric as unknown as Record<string, unknown>)[f] = input[f];
    }
  }
  await metric.save();
  return toDto(metric);
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

function toDto(
  metric: InstanceType<typeof HealthMetric>
) {
  return {
    id: metric._id,
    user: metric.user,
    date: metric.date,
    systolicBP: metric.systolicBP,
    diastolicBP: metric.diastolicBP,
    weight: metric.weight,
    glucose: metric.glucose,
    heartRate: metric.heartRate,
    temperature: metric.temperature,
    hemoglobin: metric.hemoglobin,
    recordedBy: metric.recordedBy,
    notes: metric.notes,
    createdAt: metric.createdAt,
    updatedAt: metric.updatedAt,
  };
}