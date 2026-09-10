import { isValidObjectId } from "mongoose";
import { Alert } from "../models/Alert";
import { ApiError } from "../utils/ApiError";
import { getAccessiblePatientIds } from "./accessService";
import { AuthUser } from "../middleware/auth";
import { AlertSeverity, AlertStatus } from "@maasuraksha/shared";

const TYPES = new Set([
  "vitals",
  "symptom",
  "assessment",
  "mood_safety",
  "follow_up",
  "appointment",
  "referral",
]);

export interface AlertInput {
  user: string;
  type: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  source?: string;
}

export async function createAlert(actor: AuthUser, input: AlertInput) {
  if (!TYPES.has(input.type)) {
    throw ApiError.badRequest("Invalid alert type");
  }
  validateId(input.user);

  if (actor.role !== "ADMIN") {
    const allowed = await getAccessiblePatientIds(actor);
    if (!allowed.has(input.user)) {
      throw ApiError.forbidden("You do not have access to this patient's data");
    }
  }

  const alert = await Alert.create({
    user: input.user,
    type: input.type,
    severity: input.severity,
    title: input.title,
    message: input.message,
    source: input.source,
  });

  return toDto(alert);
}

export async function listAlerts(
  actor: AuthUser,
  targetUserId: string | undefined,
  page: number,
  limit: number,
  status?: string
) {
  const allowed = await getAccessiblePatientIds(actor);
  if (targetUserId) assertAllowed(actor, targetUserId, allowed);

  const filter: Record<string, unknown> = targetUserId
    ? { user: targetUserId }
    : { user: { $in: Array.from(allowed) } };
  if (status) filter.status = status;

  const total = await Alert.countDocuments(filter);
  const items = await Alert.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  return { items: items.map(toDto), total };
}

export async function getAlert(actor: AuthUser, alertId: string) {
  validateId(alertId);
  const allowed = await getAccessiblePatientIds(actor);
  const alert = await Alert.findById(alertId);
  if (!alert) throw ApiError.notFound("Alert not found");
  assertAllowed(actor, alert.user.toString(), allowed);
  return toDto(alert);
}

export async function updateAlertStatus(
  actor: AuthUser,
  alertId: string,
  status: AlertStatus
) {
  if (!Object.values(AlertStatus).includes(status)) {
    throw ApiError.badRequest("Invalid alert status");
  }
  validateId(alertId);
  const allowed = await getAccessiblePatientIds(actor);
  const alert = await Alert.findById(alertId);
  if (!alert) throw ApiError.notFound("Alert not found");
  assertAllowed(actor, alert.user.toString(), allowed);

  alert.status = status;
  if (status === AlertStatus.ACKNOWLEDGED && !alert.acknowledgedBy) {
    alert.acknowledgedBy = actor.userId as never;
    alert.acknowledgedAt = new Date();
  }
  if (status === AlertStatus.RESOLVED) {
    alert.acknowledgedBy = alert.acknowledgedBy ?? (actor.userId as never);
    alert.acknowledgedAt = alert.acknowledgedAt ?? new Date();
  }
  await alert.save();
  return toDto(alert);
}

function assertAllowed(actor: AuthUser, userId: string, allowed: Set<string>): void {
  if (actor.role === "ADMIN") return;
  if (!allowed.has(userId)) {
    throw ApiError.forbidden("You do not have access to this patient's data");
  }
}

function validateId(id: string): void {
  if (!isValidObjectId(id)) throw ApiError.badRequest("Invalid id format");
}

function toDto(alert: InstanceType<typeof Alert>) {
  return {
    id: alert._id,
    user: alert.user,
    type: alert.type,
    severity: alert.severity,
    title: alert.title,
    message: alert.message,
    status: alert.status,
    acknowledgedBy: alert.acknowledgedBy,
    acknowledgedAt: alert.acknowledgedAt,
    source: alert.source,
    createdAt: alert.createdAt,
    updatedAt: alert.updatedAt,
  };
}