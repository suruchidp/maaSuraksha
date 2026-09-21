import { isValidObjectId } from "mongoose";
import { HomeVisit } from "../models/HomeVisit";
import { ApiError } from "../utils/ApiError";
import {
  getAccessiblePatientIds as getPatientIds,
} from "./accessService";
import { AuthUser } from "../middleware/auth";
import { HomeVisitStatus, UserRole } from "@maasuraksha/shared";
import { createReferral } from "./referralService";

export interface HomeVisitRequestInput {
  patient: string;
  reason: string;
  notes?: string;
  preferredDate: string;
  preferredTime: string;
}

export interface HomeVisitActionInput {
  visitId: string;
  scheduledDate?: string;
  scheduledTime?: string;
  visitNotes?: string;
  followUpNeeded?: boolean;
  result?: Record<string, number>;
  cancelledReason?: string;
  escalateReason?: string;
}

function toVisitPatientId(visit: InstanceType<typeof HomeVisit>): string {
  const ref = visit.patient as unknown;
  return typeof ref === "object" && ref !== null && "_id" in ref
    ? (ref as { _id: { toString(): string } })._id.toString()
    : (ref as { toString(): string }).toString();
}

export function toHomeVisitDto(visit: InstanceType<typeof HomeVisit>) {
  const patientRef = visit.patient as unknown;
  const isPopulated =
    typeof patientRef === "object" &&
    patientRef !== null &&
    "name" in patientRef;
  return {
    _id: visit._id,
    patient: toVisitPatientId(visit),
    patientName: isPopulated
      ? (patientRef as { name?: string }).name
      : undefined,
    requestedBy: visit.requestedBy,
    reason: visit.reason,
    notes: visit.notes,
    preferredDate: visit.preferredDate,
    preferredTime: visit.preferredTime,
    status: visit.status,
    scheduledDate: visit.scheduledDate,
    scheduledTime: visit.scheduledTime,
    scheduledBy: visit.scheduledBy,
    completedAt: visit.completedAt,
    completedBy: visit.completedBy,
    visitNotes: visit.visitNotes,
    followUpNeeded: visit.followUpNeeded,
    result: visit.result,
    referralId: visit.referralId,
    escalatedTo: visit.escalatedTo,
    escalateReason: visit.escalateReason,
    cancelledReason: visit.cancelledReason,
    history: visit.history,
    createdAt: visit.createdAt,
    updatedAt: visit.updatedAt,
  };
}

async function getHomeVisitForAction(actor: AuthUser, visitId: string) {
  validateId(visitId);
  const visit = await HomeVisit.findById(visitId).populate("patient", "name");
  if (!visit) throw ApiError.notFound("Home visit not found");
  await assertHomeVisitAccess(actor, visit);
  return visit;
}

async function assertHomeVisitAccess(
  actor: AuthUser,
  visit: InstanceType<typeof HomeVisit>
) {
  if (actor.role === "PATIENT") {
    if (visit.requestedBy.toString() !== actor.userId) {
      throw ApiError.forbidden("You do not have access to this home visit");
    }
    return;
  }
  if (actor.role === "ADMIN") {
    return;
  }
  const allowed = await getPatientIds(actor);
  if (!allowed.has(toVisitPatientId(visit))) {
    throw ApiError.forbidden("You do not have access to this patient data");
  }
}

async function getHomeVisitFilter(
  actor: AuthUser,
  requestedBy?: string
): Promise<{ patient?: object | string; requestedBy?: object | string }> {
  if (actor.role === "ADMIN") {
    return {
      ...(requestedBy ? { requestedBy } : {}),
      ...(requestedBy ? {} : {}),
    };
  }
  if (actor.role === "PATIENT") {
    return { requestedBy: actor.userId };
  }
  const allowed = await getPatientIds(actor);
  return {
    patient: { $in: Array.from(allowed) },
    ...(requestedBy ? { requestedBy } : {}),
  };
}

function validateId(id: string): void {
  if (!isValidObjectId(id)) throw ApiError.badRequest("Invalid id format");
}

export async function requestHomeVisit(
  actor: AuthUser,
  input: HomeVisitRequestInput
) {
  if (actor.role !== UserRole.PATIENT) {
    throw ApiError.forbidden("Only patients can request a home visit");
  }
  validateId(input.patient);
  if (input.patient !== actor.userId) {
    throw ApiError.forbidden("You can only request a home visit for yourself");
  }

  const visit = await HomeVisit.create({
    patient: input.patient,
    requestedBy: actor.userId,
    reason: input.reason,
    notes: input.notes,
    preferredDate: input.preferredDate,
    preferredTime: input.preferredTime,
    status: HomeVisitStatus.PENDING,
    history: [],
  });
  return toHomeVisitDto(visit);
}

export async function listHomeVisits(
  actor: AuthUser,
  requestedBy?: string,
  page = 1,
  limit = 20
) {
  const filter = await getHomeVisitFilter(actor, requestedBy);
  const total = await HomeVisit.countDocuments(filter);
  const items = await HomeVisit.find(filter)
    .populate("patient", "name")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
  return { items: items.map(toHomeVisitDto), total };
}

export async function getHomeVisit(actor: AuthUser, visitId: string) {
  const visit = await getHomeVisitForAction(actor, visitId);
  return toHomeVisitDto(visit);
}

export async function scheduleHomeVisit(
  actor: AuthUser,
  input: HomeVisitActionInput
) {
  const visit = await getHomeVisitForAction(actor, input.visitId);
  if (visit.status !== HomeVisitStatus.PENDING) {
    throw ApiError.badRequest("Only pending visits can be scheduled");
  }
  if (!input.scheduledDate || !input.scheduledTime) {
    throw ApiError.badRequest("Scheduled date and time are required");
  }
  visit.status = HomeVisitStatus.SCHEDULED;
  visit.scheduledDate = input.scheduledDate;
  visit.scheduledTime = input.scheduledTime;
  visit.scheduledBy = actor.userId as never;
  visit.visitNotes = input.visitNotes;
  await pushHistory(visit, actor, HomeVisitStatus.SCHEDULED, "Scheduled");
  await visit.save();
  return toHomeVisitDto(visit);
}

export async function completeHomeVisit(
  actor: AuthUser,
  input: HomeVisitActionInput
) {
  const visit = await getHomeVisitForAction(actor, input.visitId);
  if (visit.status !== HomeVisitStatus.SCHEDULED) {
    throw ApiError.badRequest("Only scheduled visits can be completed");
  }
  visit.status = HomeVisitStatus.COMPLETED;
  visit.completedAt = new Date();
  visit.completedBy = actor.userId as never;
  visit.visitNotes = input.visitNotes || visit.visitNotes;
  visit.followUpNeeded = input.followUpNeeded;
  if (input.result) visit.result = input.result;
  await pushHistory(
    visit,
    actor,
    HomeVisitStatus.COMPLETED,
    input.visitNotes || "Completed"
  );
  await visit.save();
  return toHomeVisitDto(visit);
}

export async function cancelHomeVisit(
  actor: AuthUser,
  input: HomeVisitActionInput
) {
  const visit = await getHomeVisitForAction(actor, input.visitId);
  if (![HomeVisitStatus.PENDING, HomeVisitStatus.SCHEDULED].includes(visit.status)) {
    throw ApiError.badRequest("This visit cannot be cancelled");
  }
  if (!input.cancelledReason) {
    throw ApiError.badRequest("Cancellation reason is required");
  }
  visit.status = HomeVisitStatus.CANCELLED;
  visit.cancelledReason = input.cancelledReason;
  await pushHistory(
    visit,
    actor,
    HomeVisitStatus.CANCELLED,
    input.cancelledReason
  );
  await visit.save();
  return toHomeVisitDto(visit);
}

export async function escalateHomeVisit(
  actor: AuthUser,
  input: HomeVisitActionInput & { reason: string }
) {
  const visit = await getHomeVisitForAction(actor, input.visitId);
  if (![HomeVisitStatus.PENDING, HomeVisitStatus.SCHEDULED].includes(visit.status)) {
    throw ApiError.badRequest("Only pending or scheduled visits can be escalated");
  }
  if (!input.reason.trim()) {
    throw ApiError.badRequest("Escalation reason is required");
  }
  const referral = await createReferral(actor, {
    patient: toVisitPatientId(visit),
    reason: input.reason,
    notes: `Escalated from home visit ${visit._id}`,
  });
  visit.status = HomeVisitStatus.ESCALATED;
  visit.referralId = referral.id as never;
  visit.escalatedTo = undefined;
  visit.escalateReason = input.reason;
  await pushHistory(
    visit,
    actor,
    HomeVisitStatus.ESCALATED,
    input.reason
  );
  await visit.save();
  return toHomeVisitDto(visit);
}

async function pushHistory(
  visit: InstanceType<typeof HomeVisit>,
  actor: AuthUser,
  status: HomeVisitStatus,
  note: string
) {
  visit.history = [
    ...(visit.history ?? []),
    {
      status,
      changedBy: actor.userId as never,
      changedAt: new Date(),
      note,
    },
  ];
}
