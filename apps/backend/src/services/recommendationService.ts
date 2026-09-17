import { isValidObjectId } from "mongoose";
import { Recommendation } from "../models/Recommendation";
import { ApiError } from "../utils/ApiError";
import { getAccessiblePatientIds } from "./accessService";
import { generateAndPersistForUser } from "./recommendationEngine";
import { AuthUser } from "../middleware/auth";
import {
  RECOMMENDATION_CATEGORIES,
  RECOMMENDATION_PRIORITIES,
  RecommendationCategory,
  RecommendationPriority,
} from "@maasuraksha/shared";

const CATEGORIES = new Set<string>(RECOMMENDATION_CATEGORIES);
const PRIORITIES = new Set<string>(RECOMMENDATION_PRIORITIES);

export interface RecommendationInput {
  category: RecommendationCategory;
  title: string;
  content: string;
  priority: RecommendationPriority;
  source?: string;
}

export async function createRecommendation(
  actor: AuthUser,
  targetUserId: string | undefined,
  input: RecommendationInput
) {
  if (!CATEGORIES.has(input.category)) {
    throw ApiError.badRequest("Invalid recommendation category");
  }
  if (!PRIORITIES.has(input.priority)) {
    throw ApiError.badRequest("priority must be low, medium or high");
  }

  const allowed = await getAccessiblePatientIds(actor);
  const userId = resolveTargetPatient(actor, targetUserId, allowed);

  const rec = await Recommendation.create({
    user: userId,
    category: input.category,
    title: input.title,
    content: input.content,
    priority: input.priority,
    source: input.source,
    isPersonalized: true,
    sourceType: "CARE_TEAM",
  });

  return toDto(rec);
}

export async function listRecommendations(
  actor: AuthUser,
  targetUserId: string | undefined,
  page: number,
  limit: number,
  category?: string
) {
  const allowed = await getAccessiblePatientIds(actor);
  if (targetUserId) assertAllowed(actor, targetUserId, allowed);

  // Best-effort engine backfill: regenerate recommendations for the single
  // patient being viewed (patient self-view, or a caregiver looking at one
  // patient). Never run for broad caregiver/admin list views, and never let a
  // generation failure break the listing.
  const backfillUser = targetUserId ?? (actor.role === "PATIENT" ? actor.userId : undefined);
  if (backfillUser) {
    try {
      await generateAndPersistForUser(backfillUser);
    } catch {
      // content generation must never break the listing
    }
  }

  const filter: Record<string, unknown> = targetUserId
    ? { user: targetUserId }
    : { user: { $in: Array.from(allowed) } };
  if (category) filter.category = category;

  const total = await Recommendation.countDocuments(filter);
  const items = await Recommendation.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  return { items: items.map(toDto), total };
}

export async function getRecommendation(actor: AuthUser, recId: string) {
  validateId(recId);
  const allowed = await getAccessiblePatientIds(actor);
  const rec = await Recommendation.findById(recId);
  if (!rec) throw ApiError.notFound("Recommendation not found");
  assertAllowed(actor, rec.user.toString(), allowed);
  return toDto(rec);
}

export async function markRecommendationRead(
  actor: AuthUser,
  recId: string,
  read: boolean
) {
  validateId(recId);
  const allowed = await getAccessiblePatientIds(actor);
  const rec = await Recommendation.findById(recId);
  if (!rec) throw ApiError.notFound("Recommendation not found");
  assertAllowed(actor, rec.user.toString(), allowed);
  rec.isRead = read;
  await rec.save();
  return toDto(rec);
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

function toDto(rec: InstanceType<typeof Recommendation>) {
  return {
    id: rec._id,
    user: rec.user,
    category: rec.category,
    title: rec.title,
    content: rec.content,
    priority: rec.priority,
    isPersonalized: rec.isPersonalized,
    source: rec.source,
    isRead: rec.isRead,
    sourceType: rec.sourceType ?? "CARE_TEAM",
    titleLocalized: rec.titleLocalized ?? undefined,
    contentLocalized: rec.contentLocalized ?? undefined,
    reason: rec.reason,
    reasonLocalized: rec.reasonLocalized ?? undefined,
    references: rec.references ?? [],
    templateKey: rec.templateKey,
    createdAt: rec.createdAt,
    updatedAt: rec.updatedAt,
  };
}