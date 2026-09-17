import { User } from "../models/User";
import { refreshPatientAlerts } from "./alertEngine";
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

  if (!(await User.exists({ _id: input.user, role: "PATIENT", isActive: true }))) throw ApiError.notFound("Patient not found");
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
  status?: string,
  unread?: string
) {
  const allowed = await getAccessiblePatientIds(actor);
  if (targetUserId) { validateId(targetUserId); assertAllowed(actor, targetUserId, allowed); }
  if (actor.role === "PATIENT") await refreshPatientAlerts(actor.userId);

  const filter: Record<string, unknown> = targetUserId
    ? { user: targetUserId }
    : actor.role === "ADMIN" ? {} : { user: { $in: Array.from(allowed) } };
  if (status) {
    if (!Object.values(AlertStatus).includes(status as AlertStatus)) throw ApiError.badRequest("Invalid alert status");
    filter.status = status;
  }

  if (unread !== undefined) {
    if (!["true", "false"].includes(unread)) throw ApiError.badRequest("Invalid unread filter");
    filter.readAt = { $exists: unread === "false" };
  }
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

  if (actor.role === "PATIENT" && status === AlertStatus.RESOLVED) throw ApiError.forbidden("Your care team must resolve clinical alerts");
  if (alert.status === AlertStatus.RESOLVED && status !== AlertStatus.RESOLVED) throw ApiError.conflict("Resolved alerts cannot be reopened");
  if (status === AlertStatus.PENDING && alert.status !== AlertStatus.PENDING) throw ApiError.conflict("Acknowledged alerts cannot be reset");
  if (alert.user.toString() === actor.userId) alert.readAt = alert.readAt ?? new Date();
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
    readAt: alert.readAt,
    createdAt: alert.createdAt,
    updatedAt: alert.updatedAt,
  };
}
export async function markAlertRead(actor: AuthUser, id: string) {
  const existing = await getAlert(actor, id);
  if (existing.user.toString() !== actor.userId) throw ApiError.forbidden("Only the recipient can mark an alert as read");
  const alert = await Alert.findOneAndUpdate({ _id: id, readAt: { $exists: false } }, { $set: { readAt: new Date() } }, { new: true });
  return alert ? toDto(alert) : getAlert(actor, id);
}
export async function alertSummary(actor: AuthUser) {
  if (actor.role === "PATIENT") await refreshPatientAlerts(actor.userId);
  const allowed = await getAccessiblePatientIds(actor);
  const filter = actor.role === "ADMIN" ? {} : { user: { $in: Array.from(allowed) } };
  const [unread, pending] = await Promise.all([
    Alert.countDocuments({ ...filter, readAt: { $exists: false } }),
    Alert.countDocuments({ ...filter, status: AlertStatus.PENDING }),
  ]);
  return { unread, pending };
}
