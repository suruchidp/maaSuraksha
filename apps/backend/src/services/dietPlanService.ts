import { isValidObjectId } from "mongoose";
import { DietPlan } from "../models/DietPlan";
import { ApiError } from "../utils/ApiError";
import { getAccessiblePatientIds } from "./accessService";
import { AuthUser } from "../middleware/auth";

const DISCLAIMER =
  "This diet guidance is educational only and does not constitute a medical " +
  "prescription. Always consult your doctor before changing your diet.";

export interface DietPlanInput {
  title: string;
  description: string;
  meals: { name: string; items: string[]; notes?: string }[];
  nutritionalNotes: string;
}

export async function createDietPlan(
  actor: AuthUser,
  targetUserId: string | undefined,
  input: DietPlanInput
) {
  const allowed = await getAccessiblePatientIds(actor);
  const userId = resolveTargetPatient(actor, targetUserId, allowed);

  const plan = await DietPlan.create({
    user: userId,
    title: input.title,
    description: input.description,
    meals: input.meals,
    nutritionalNotes: input.nutritionalNotes,
    disclaimer: DISCLAIMER,
    createdBy: actor.userId,
  });

  return toDto(plan);
}

export async function listDietPlans(
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

  const total = await DietPlan.countDocuments(filter);
  const items = await DietPlan.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  return { items: items.map(toDto), total };
}

export async function getDietPlan(actor: AuthUser, planId: string) {
  validateId(planId);
  const allowed = await getAccessiblePatientIds(actor);
  const plan = await DietPlan.findById(planId);
  if (!plan) throw ApiError.notFound("Diet plan not found");
  assertAllowed(actor, plan.user.toString(), allowed);
  return toDto(plan);
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

function toDto(plan: InstanceType<typeof DietPlan>) {
  return {
    id: plan._id,
    user: plan.user,
    title: plan.title,
    description: plan.description,
    meals: plan.meals,
    nutritionalNotes: plan.nutritionalNotes,
    disclaimer: plan.disclaimer,
    createdBy: plan.createdBy,
    createdAt: plan.createdAt,
    updatedAt: plan.updatedAt,
  };
}