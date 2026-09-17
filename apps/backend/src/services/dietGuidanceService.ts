import { isValidObjectId } from "mongoose";
import { DietGuidance } from "../models/DietGuidance";
import { DietGuidancePreferences } from "../models/DietGuidancePreferences";
import { regenerateDietGuidance } from "./dietGuidanceEngine";
import { ApiError } from "../utils/ApiError";
import { getAccessiblePatientIds } from "./accessService";
import { AuthUser } from "../middleware/auth";
import type { DietMealPreference, DietRegion } from "@maasuraksha/shared";

export interface DietGuidancePreferencesInput {
  mealPreference: DietMealPreference;
  region?: DietRegion;
}

/**
 * Returns the persisted diet guidance for a single patient, regenerating it
 * first (best-effort, snapshot semantics). Never runs for broad list views.
 */
export async function getDietGuidance(
  actor: AuthUser,
  targetUserId: string | undefined
) {
  const allowed = await getAccessiblePatientIds(actor);
  const userId = resolveTargetPatient(actor, targetUserId, allowed);

  try {
    await regenerateDietGuidance(userId);
  } catch {
    // content generation must never break the view; existing records stay.
  }

  const items = await DietGuidance.find({ user: userId })
    .sort({ priority: 1, createdAt: 1 })
    .lean();

  const prefs = await DietGuidancePreferences.findOne({ user: userId }).lean();

  return {
    guidance: items.map((item) => toGuidanceDto(item as unknown as GuidanceLean)),
    preferences: prefs ? toPreferencesDto(prefs as unknown as PreferencesLean) : null,
  };
}

export async function getDietGuidancePreferences(
  actor: AuthUser,
  targetUserId: string | undefined
) {
  const allowed = await getAccessiblePatientIds(actor);
  const userId = resolveTargetPatient(actor, targetUserId, allowed);
  const prefs = await DietGuidancePreferences.findOne({ user: userId }).lean();
  return prefs ? toPreferencesDto(prefs as unknown as PreferencesLean) : null;
}

export async function upsertDietGuidancePreferences(
  actor: AuthUser,
  targetUserId: string | undefined,
  input: DietGuidancePreferencesInput
) {
  const allowed = await getAccessiblePatientIds(actor);
  const userId = resolveTargetPatient(actor, targetUserId, allowed);

  const data = {
    mealPreference: input.mealPreference,
    region: input.region ?? undefined,
    updatedBy: actor.userId,
  };

  const prefs = await DietGuidancePreferences.findOneAndUpdate(
    { user: userId },
    { $set: data },
    { upsert: true, new: true, runValidators: true }
  );

  return toPreferencesDto(prefs as unknown as PreferencesLean);
}

function resolveTargetPatient(
  actor: AuthUser,
  targetUserId: string | undefined,
  allowed: Set<string>
): string {
  if (targetUserId) {
    if (actor.role === "ADMIN") {
      validateId(targetUserId);
      return targetUserId;
    }
    if (!allowed.has(targetUserId)) {
      throw ApiError.forbidden("You do not have access to this patient's data");
    }
    return targetUserId;
  }
  if (actor.role === "PATIENT") return actor.userId;
  throw ApiError.badRequest("userId is required");
}

function validateId(id: string): void {
  if (!isValidObjectId(id)) throw ApiError.badRequest("Invalid id format");
}

interface GuidanceLean {
  _id: unknown;
  user: unknown;
  sourceType?: unknown;
  templateKey?: unknown;
  intent?: unknown;
  contentVersion?: unknown;
  priority?: unknown;
  title?: unknown;
  titleLocalized?: unknown;
  sections?: unknown;
  rationale?: unknown;
  rationaleLocalized?: unknown;
  disclaimer?: unknown;
  disclaimerLocalized?: unknown;
  attribution?: unknown;
  references?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
}

interface PreferencesLean {
  _id: unknown;
  user: unknown;
  mealPreference?: unknown;
  region?: unknown;
  updatedBy?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
}

function toGuidanceDto(item: GuidanceLean) {
  return {
    id: item._id,
    user: item.user,
    sourceType: item.sourceType,
    templateKey: item.templateKey,
    intent: item.intent,
    contentVersion: item.contentVersion,
    priority: item.priority,
    title: item.title,
    titleLocalized: item.titleLocalized,
    sections: item.sections ?? [],
    rationale: item.rationale,
    rationaleLocalized: item.rationaleLocalized,
    disclaimer: item.disclaimer,
    disclaimerLocalized: item.disclaimerLocalized,
    attribution: item.attribution ?? [],
    references: item.references ?? [],
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

function toPreferencesDto(prefs: PreferencesLean) {
  return {
    id: prefs._id,
    user: prefs.user,
    mealPreference: prefs.mealPreference,
    region: prefs.region ?? undefined,
    updatedBy: prefs.updatedBy ?? undefined,
    createdAt: prefs.createdAt,
    updatedAt: prefs.updatedAt,
  };
}