import { NextFunction, Response } from "express";
import { ApiError } from "../utils/ApiError";
import { AuthRequest } from "./auth";

/**
 * Restricts `req.user` to access only resources related to the patient id
 * found at `req.params[paramName]`. Only the patient themself or an
 * authorized caregiver (ASHA/DOCTOR assigned to them) may pass.
 *
 * Validates that the target user is a PATIENT. ADMIN bypasses the check so
 * admin-only routes can rely on `authorize(UserRole.ADMIN)` instead.
 */
export function requirePatientAccess(paramName = "userId") {
  return async (
    req: AuthRequest,
    _res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const targetId = req.params[paramName] as string;
      if (!targetId) {
        throw ApiError.badRequest("Missing patient id in route params");
      }
      if (!req.user) {
        throw ApiError.unauthorized();
      }
      const { User } = await import("../models/User");
      const allowed = await checkAccess(req.user.userId, req.user.role, targetId, User);
      if (!allowed) {
        throw ApiError.forbidden("You do not have access to this patient's data");
      }
      next();
    } catch (error) {
      next(error);
    }
  };
}

export async function checkCanAccessPatient(
  requesterId: string,
  requesterRole: string,
  targetPatientId: string
): Promise<boolean> {
  const { User } = await import("../models/User");
  return checkAccess(requesterId, requesterRole, targetPatientId, User);
}

async function checkAccess(
  requesterId: string,
  requesterRole: string,
  targetId: string,
  UserModel: typeof import("../models/User").User
): Promise<boolean> {
  if (requesterRole === "ADMIN") return true;
  if (requesterId === targetId && requesterRole === "PATIENT") return true;

  const target = await UserModel.findById(targetId).select(
    "role assignedASHA assignedDoctor"
  );
  if (!target || target.role !== "PATIENT") {
    return false;
  }

  if (requesterRole === "ASHA") {
    return target.assignedASHA?.toString() === requesterId;
  }
  if (requesterRole === "DOCTOR") {
    return target.assignedDoctor?.toString() === requesterId;
  }
  return false;
}