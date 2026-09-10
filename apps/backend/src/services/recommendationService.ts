import { isValidObjectId } from "mongoose";
import { Recommendation } from "../models/Recommendation";
import { ApiError } from "../utils/ApiError";
import { getAccessiblePatientIds } from "./accessService";
import { AuthUser } from "../middleware/auth";

const CATEGORIES = new Set([
  "nutrition",
  "exercise",
  "rest",
  "medical",
  "mental_health",
  "general",
  "warning",
]);
const PRIORITIES = new Set(["low", "medium", "high"]);

export interface RecommendationInput {
  category: string;
  title: string;
  content: string;
  priority: string;
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
    createdAt: rec.createdAt,
    updatedAt: rec.updatedAt,
  };
}