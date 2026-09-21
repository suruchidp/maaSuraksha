import { isValidObjectId } from "mongoose";
import { Referral } from "../models/Referral";
import { User } from "../models/User";
import { ApiError } from "../utils/ApiError";
import { getAccessiblePatientIds, getAccessiblePatientIds as getPatientIds } from "./accessService";
import { AuthUser } from "../middleware/auth";
import { ReferralStatus, UserRole } from "@maasuraksha/shared";

export interface ReferralInput {
  patient: string;
  referredTo?: string;
  facility?: string;
  reason: string;
  notes?: string;
}

export async function createReferral(actor: AuthUser, input: ReferralInput) {
  validateId(input.patient);
  if (input.referredTo) {
    validateId(input.referredTo);
    const doctor = await User.exists({
      _id: input.referredTo,
      role: UserRole.DOCTOR,
      isActive: true,
    });
    if (!doctor) throw ApiError.badRequest("referredTo must be an active doctor");
  }

  const allowed = await getPatientIds(actor);
  if (actor.role !== "ADMIN" && !allowed.has(input.patient)) {
    throw ApiError.forbidden("You do not have access to this patient's data");
  }

  const referral = await Referral.create({
    patient: input.patient,
    referredBy: actor.userId,
    referredTo: input.referredTo,
    facility: input.facility,
    reason: input.reason,
    notes: input.notes,
    status: ReferralStatus.PENDING,
    history: [
      {
        status: ReferralStatus.PENDING,
        changedBy: actor.userId,
        changedAt: new Date(),
      },
    ],
  });
  if (input.referredTo) await referral.populate("referredTo", "name");

  return toDto(referral);
}

export async function listReferrals(
  actor: AuthUser,
  role: string,
  targetPatientId: string | undefined,
  page: number,
  limit: number
) {
  let filter: Record<string, unknown>;
  if (role === "ADMIN") {
    filter = targetPatientId ? { patient: targetPatientId } : {};
  } else if (role === "PATIENT") {
    filter = { patient: actor.userId };
  } else {
    const allowed = await getAccessiblePatientIds(actor);
    if (targetPatientId) {
      if (actor.role !== "ADMIN" && !allowed.has(targetPatientId)) {
        throw ApiError.forbidden("You do not have access to this patient's data");
      }
      filter = { patient: targetPatientId };
    } else {
      filter = { patient: { $in: Array.from(allowed) } };
    }
  }

  const total = await Referral.countDocuments(filter);
  const items = await Referral.find(filter)
    .populate("referredTo", "name")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  return { items: items.map(toDto), total };
}

export async function getReferral(actor: AuthUser, referralId: string) {
  validateId(referralId);
  const allowed = await getAccessiblePatientIds(actor);
  const referral = await Referral.findById(referralId).populate("referredTo", "name");
  if (!referral) throw ApiError.notFound("Referral not found");

  if (actor.role !== "ADMIN") {
    const isRelevantDoctor =
      actor.role === "DOCTOR" &&
      (referral.referredTo?.toString() === actor.userId ||
        allowed.has(referral.patient.toString()));
    const isRelevantAsha =
      actor.role === "ASHA" && allowed.has(referral.patient.toString());
    const isOwnPatient = actor.role === "PATIENT" && referral.patient.toString() === actor.userId;
    if (!isRelevantDoctor && !isRelevantAsha && !isOwnPatient) {
      throw ApiError.forbidden("You do not have access to this referral");
    }
  }

  return toDto(referral);
}

export async function updateReferralStatus(
  actor: AuthUser,
  referralId: string,
  status: ReferralStatus,
  note?: string
) {
  if (!Object.values(ReferralStatus).includes(status)) {
    throw ApiError.badRequest("Invalid referral status");
  }
  validateId(referralId);
  const referral = await Referral.findById(referralId);
  if (!referral) throw ApiError.notFound("Referral not found");

  if (actor.role !== "ADMIN") {
    const allowed = await getAccessiblePatientIds(actor);
    const relevant =
      allowed.has(referral.patient.toString()) ||
      referral.referredBy.toString() === actor.userId ||
      referral.referredTo?.toString() === actor.userId;
    if (!relevant) {
      throw ApiError.forbidden("You do not have access to this referral");
    }
  }

  referral.status = status;
  referral.history = [
    ...(referral.history ?? []),
    {
      status,
      changedBy: actor.userId as never,
      changedAt: new Date(),
      note,
    },
  ];
  await referral.save();
  return toDto(referral);
}

function validateId(id: string): void {
  if (!isValidObjectId(id)) throw ApiError.badRequest("Invalid id format");
}

function toDto(referral: InstanceType<typeof Referral>) {
  const referredTo = referral.referredTo as unknown;
  const referredToObj = referredTo && typeof referredTo === "object" && "_id" in (referredTo as object)
    ? (referredTo as { _id: unknown; name?: string })
    : undefined;
  return {
    id: referral._id,
    patient: referral.patient,
    referredBy: referral.referredBy,
    referredTo: referredToObj ? String(referredToObj._id) : referredTo,
    referredToName: referredToObj?.name,
    facility: referral.facility,
    reason: referral.reason,
    notes: referral.notes,
    status: referral.status,
    history: referral.history,
    createdAt: referral.createdAt,
    updatedAt: referral.updatedAt,
  };
}