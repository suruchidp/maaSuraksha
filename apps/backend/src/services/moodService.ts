import { isValidObjectId } from "mongoose";
import { MoodSentiment } from "@maasuraksha/shared";
import { MoodEntry } from "../models/MoodEntry";
import { ApiError } from "../utils/ApiError";
import { getAccessiblePatientIds } from "./accessService";
import { AuthUser } from "../middleware/auth";
import { analyzeMood } from "./mlClient";

const UNAVAILABLE_MESSAGE =
  "Mood analysis (NLP) is not available in this environment yet. " +
  "The journal entry was stored securely but no model-backed sentiment " +
  "classification was computed. The ML service returned no real model result, " +
  "so nothing was invented.";

export async function createMoodEntry(
  actor: AuthUser,
  targetUserId: string | undefined,
  journalText: string
) {
  const allowed = await getAccessiblePatientIds(actor);
  const userId = resolveTargetPatient(actor, targetUserId, allowed);

  const entry = await MoodEntry.create({
    user: userId,
    journalText,
    status: "pending",
    keywords: [],
    safetyFlag: false,
  });

  const ml = await analyzeMood(journalText, "en");

  if (ml.available && ml.modelStatus === "MODEL_AVAILABLE" && ml.sentiment) {
    await MoodEntry.updateOne(
      { _id: entry._id },
      {
        $set: {
          status: "analyzed",
          sentiment: ml.sentiment as MoodSentiment,
          sentimentScore: ml.sentimentScore,
          safetyFlag: ml.safetyFlag,
          safetyNotes: ml.safetyMessage,
          keywords: ml.safetyFlag ? [] : [],
        },
      }
    );
    const updated = await MoodEntry.findById(entry._id);
    return {
      ...toDto(updated ?? entry),
      message: `Mood entry analyzed by the ML service (model ${ml.modelVersion}).`,
    };
  }

  if (ml.available && ml.modelStatus === "RULE_BASED") {
    // Real deterministic safety heuristic; still not model-backed sentiment.
    await MoodEntry.updateOne(
      { _id: entry._id },
      { $set: { safetyFlag: ml.safetyFlag, safetyNotes: ml.safetyMessage } }
    );
    const updated = await MoodEntry.findById(entry._id);
    return {
      ...toDto(updated ?? entry),
      message: UNAVAILABLE_MESSAGE,
    };
  }

  return { ...toDto(entry), message: UNAVAILABLE_MESSAGE };
}

export async function listMoodEntries(
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

  const total = await MoodEntry.countDocuments(filter);
  const entries = await MoodEntry.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  return { items: entries.map(toDto), total };
}

export async function getMoodEntry(actor: AuthUser, entryId: string) {
  validateId(entryId);
  const allowed = await getAccessiblePatientIds(actor);
  const entry = await MoodEntry.findById(entryId);
  if (!entry) throw ApiError.notFound("Mood entry not found");
  assertAllowed(actor, entry.user.toString(), allowed);
  return toDto(entry);
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

function toDto(entry: InstanceType<typeof MoodEntry>) {
  return {
    id: entry._id,
    user: entry.user,
    journalText: entry.journalText,
    status: entry.status,
    sentiment: entry.sentiment,
    sentimentScore: entry.sentimentScore,
    keywords: entry.keywords,
    safetyFlag: entry.safetyFlag,
    safetyNotes: entry.safetyNotes,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
  };
}