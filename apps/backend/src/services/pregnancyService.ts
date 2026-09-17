import { refreshAlertsAfterWrite } from "./alertEngine";
import { Types } from "mongoose";
import { PregnancyProfile } from "../models/PregnancyProfile";
import { ApiError } from "../utils/ApiError";
import { getAccessiblePatientIds } from "./accessService";
import { AuthUser } from "../middleware/auth";
import { Trimester } from "@maasuraksha/shared";

export const WEEKS_PER_TRIMESTER = 13.33;

export function calculateDueDate(lmp: Date): Date {
  const result = new Date(lmp);
  result.setDate(result.getDate() + 280);
  return result;
}

export function calculateGestationalWeek(lmp: Date, now = new Date()): number {
  const diffMs = now.getTime() - lmp.getTime();
  if (diffMs < 0) return 1;
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return Math.min(Math.max(Math.floor(days / 7) + 1, 1), 42);
}

export function calculateTrimester(gestationalWeek: number): Trimester {
  if (gestationalWeek <= 13) return Trimester.FIRST;
  if (gestationalWeek <= 26) return Trimester.SECOND;
  return Trimester.THIRD;
}

function isIsoDate(value: unknown): value is string {
  return typeof value === "string" && !isNaN(Date.parse(value));
}

export async function createOrUpdatePregnancyProfile(
  actor: AuthUser,
  targetUserId: string | undefined,
  input: { lmp: string; gravida?: number; para?: number; medicalHistory?: string[]; riskFactors?: string[] }
) {
  if (!isIsoDate(input.lmp)) {
    throw ApiError.badRequest("lmp must be a valid date");
  }

  const allowed = await getAccessiblePatientIds(actor);
  const userId = resolveTargetPatient(actor, targetUserId, allowed);

  const lmp = new Date(input.lmp);
  const expectedDueDate = calculateDueDate(lmp);
  const week = calculateGestationalWeek(lmp);
  const trimester = calculateTrimester(week);

  const existing = await PregnancyProfile.findOne({ user: userId });

  const data = {
    user: userId,
    lmp,
    expectedDueDate,
    gestationalWeek: week,
    trimester,
    gravida: input.gravida,
    para: input.para,
    medicalHistory: input.medicalHistory ?? [],
    riskFactors: input.riskFactors ?? [],
    isHighRisk: (input.riskFactors?.length ?? 0) > 0,
  };

  let profile;
  if (existing) {
    existing.set(data);
    await existing.save();
    profile = existing;
  } else {
    profile = await PregnancyProfile.create(data);
  }

  await refreshAlertsAfterWrite(userId);
  return toDto(profile);
}

export async function getPregnancyProfile(
  actor: AuthUser,
  targetUserId: string | undefined
) {
  const allowed = await getAccessiblePatientIds(actor);
  const userId = targetUserId ?? actor.userId;
  if (actor.role !== "ADMIN" && !allowed.has(userId)) {
    throw ApiError.forbidden("You do not have access to this patient's data");
  }

  const profile = await PregnancyProfile.findOne({ user: userId });
  if (!profile) {
    throw ApiError.notFound("Pregnancy profile not found");
  }
  return toDto(profile);
}

export async function listPregnancyProfiles(userIds: string[]) {
  const profiles = await PregnancyProfile.find({
    user: { $in: userIds },
  }).sort({ createdAt: -1 });
  return profiles.map(toDto);
}

function resolveTargetPatient(
  actor: AuthUser,
  targetUserId: string | undefined,
  allowed: Set<string>
): string {
  if (actor.role === "ADMIN") {
    if (!targetUserId) throw ApiError.badRequest("userId is required");
    return targetUserId;
  }
  if (targetUserId) {
    if (!allowed.has(targetUserId)) {
      throw ApiError.forbidden("You do not have access to this patient's data");
    }
    return targetUserId;
  }
  if (actor.role === "PATIENT") return actor.userId;
  throw ApiError.badRequest("userId is required");
}

function toDto(profile: InstanceType<typeof PregnancyProfile>) {
  return {
    id: profile._id,
    user: profile.user,
    lmp: profile.lmp,
    expectedDueDate: profile.expectedDueDate,
    gestationalWeek: profile.gestationalWeek,
    trimester: profile.trimester,
    gravida: profile.gravida,
    para: profile.para,
    isHighRisk: profile.isHighRisk,
    riskFactors: profile.riskFactors,
    medicalHistory: profile.medicalHistory,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  };
}