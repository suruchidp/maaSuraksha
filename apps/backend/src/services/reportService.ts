import { isValidObjectId } from "mongoose";
import { Report } from "../models/Report";
import { ApiError } from "../utils/ApiError";
import { getAccessiblePatientIds } from "./accessService";
import { AuthUser } from "../middleware/auth";

const REPORT_TYPES = new Set([
  "pregnancy_summary",
  "health_metrics",
  "risk_assessment",
  "gdm_assessment",
  "ppd_assessment",
  "mood_history",
  "comprehensive",
]);

export interface ReportInput {
  type: string;
  data: Record<string, unknown>;
  title?: string;
}

export async function createReport(
  actor: AuthUser,
  targetUserId: string | undefined,
  input: ReportInput
) {
  if (!REPORT_TYPES.has(input.type)) {
    throw ApiError.badRequest("Invalid report type");
  }

  const allowed = await getAccessiblePatientIds(actor);
  const userId = resolveTargetPatient(actor, targetUserId, allowed);

  const report = await Report.create({
    user: userId,
    type: input.type,
    data: input.data,
    title: input.title ?? `Report - ${input.type}`,
    generatedBy: actor.userId,
  });

  return toDto(report);
}

export async function listReports(
  actor: AuthUser,
  targetUserId: string | undefined,
  page: number,
  limit: number
) {
  const allowed = await getAccessiblePatientIds(actor);
  if (targetUserId) assertAllowed(actor, targetUserId, allowed);

  const filter: Record<string, unknown> = targetUserId
    ? { user: targetUserId }
    : { user: { $in: Array.from(allowed) } };

  const total = await Report.countDocuments(filter);
  const items = await Report.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  return {
    items: items.map((r) => ({ ...toDto(r), data: undefined })),
    total,
  };
}

export async function getReport(actor: AuthUser, reportId: string) {
  validateId(reportId);
  const allowed = await getAccessiblePatientIds(actor);
  const report = await Report.findById(reportId);
  if (!report) throw ApiError.notFound("Report not found");
  assertAllowed(actor, report.user.toString(), allowed);
  return toDto(report);
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
  throw ApiError.badRequest("userId is required");
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

function toDto(report: InstanceType<typeof Report>) {
  return {
    id: report._id,
    user: report.user,
    type: report.type,
    title: report.title,
    data: report.data,
    generatedBy: report.generatedBy,
    createdAt: report.createdAt,
    updatedAt: report.updatedAt,
  };
}