import { User } from "../models/User";
import { AuthUser } from "../middleware/auth";
import { ApiError } from "../utils/ApiError";
import { UserRole } from "@maasuraksha/shared";

/**
 * Resolves which patient ids a requester may access as a MongoDB filter.
 * Returns null for ADMIN (full access). Throws FORBIDDEN for anyone else
 * when the query requires a specific patient they cannot access.
 */
export async function resolveAccessiblePatientFilter(
  requester: AuthUser,
  requestedUserId?: string
): Promise<{ user: { $in: string[] } } | { user: string } | null> {
  if (requester.role === UserRole.ADMIN) {
    return requestedUserId ? { user: requestedUserId } : null;
  }

  const allowed = await getAccessiblePatientIds(requester);

  if (requestedUserId) {
    if (!allowed.has(requestedUserId)) {
      throw ApiError.forbidden(
        "You do not have access to this patient's data"
      );
    }
    return { user: requestedUserId };
  }

  return { user: { $in: Array.from(allowed) } };
}

export async function getAccessiblePatientIds(
  requester: AuthUser
): Promise<Set<string>> {
  if (requester.role === UserRole.ADMIN) {
    return new Set();
  }

  if (requester.role === UserRole.PATIENT) {
    return new Set([requester.userId]);
  }

  const filter =
    requester.role === UserRole.ASHA
      ? { role: UserRole.PATIENT, assignedASHA: requester.userId }
      : { role: UserRole.PATIENT, assignedDoctor: requester.userId };

  const patients = await User.find(filter).select("_id");
  return new Set(patients.map((p) => p._id.toString()));
}

export function assertRequesterIsPatient(
  requester: AuthUser,
  targetUserId: string
): void {
  if (requester.userId !== targetUserId) {
    throw ApiError.forbidden("You can only manage your own data");
  }
}