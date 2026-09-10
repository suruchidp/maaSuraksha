import { NextFunction, Response } from "express";
import { ApiError } from "../utils/ApiError";
import { AuthRequest } from "./auth";
import { AuditLog } from "../models/AuditLog";

export interface AuditOptions {
  userKey?: "userId";
  details?: Record<string, unknown>;
}

/**
 * Logs security-sensitive or clinically significant actions. The caller must
 * provide the acting user id explicitly; sensitive payloads (passwords, JWTs,
 * full journal text) must NOT be passed in `details`.
 */
export async function logAudit(
  userId: string,
  action: string,
  resource: string,
  resourceId?: string,
  details?: Record<string, unknown>,
  ipAddress?: string
): Promise<void> {
  try {
    await AuditLog.create({
      user: userId,
      action,
      resource,
      resourceId,
      details,
      ipAddress,
    });
  } catch (error) {
    console.error("Audit log error:", error);
  }
}

/**
 * Middleware wrapper to read actor + IP from the request and record an audit
 * entry after the controller responds successfully.
 */
export function audit(action: string, resource: string, options: AuditOptions = {}) {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const originalJson = res.json.bind(res);
    let completed = false;

    res.json = ((body: unknown) => {
      completed = res.statusCode < 400;
      return originalJson(body);
    }) as typeof res.json;

    res.on("finish", () => {
      if (req.user && completed) {
        const resourceId = options.details
          ? undefined
          : (req.params.id as string | undefined);
        void logAudit(
          req.user.userId,
          action,
          resource,
          resourceId,
          options.details,
          req.ip
        );
      }
    });

    next();
  };
}