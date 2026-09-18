import { isValidObjectId } from "mongoose";
import { AuthUser } from "../middleware/auth";
import { getAccessiblePatientIds } from "./accessService";
import { ApiError } from "../utils/ApiError";
import { User } from "../models/User";
export function recordId(id: string) {
  if (!isValidObjectId(id)) throw ApiError.badRequest("Invalid id format");
}
export async function assertRecordAccess(actor: AuthUser, userId: string) {
  recordId(userId);
  if (
    actor.role !== "ADMIN" &&
    !(await getAccessiblePatientIds(actor)).has(userId)
  )
    throw ApiError.forbidden(
      "You do not have access to this patient's records",
    );
}
export async function recordPatient(actor: AuthUser, target?: string) {
  const id = target ?? (actor.role === "PATIENT" ? actor.userId : undefined);
  if (!id) throw ApiError.badRequest("userId is required");
  await assertRecordAccess(actor, id);
  if (!(await User.exists({ _id: id, role: "PATIENT", isActive: true })))
    throw ApiError.notFound("Active patient not found");
  return id;
}
export async function recordListFilter(
  actor: AuthUser,
  target?: string,
): Promise<Record<string, unknown>> {
  if (target) {
    await assertRecordAccess(actor, target);
    return { user: target };
  }
  return actor.role === "ADMIN"
    ? {}
    : { user: { $in: [...(await getAccessiblePatientIds(actor))] } };
}
