import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/ApiError";
import { verifyToken } from "../utils/token";
import { User } from "../models/User";
import { UserRole } from "@maasuraksha/shared";

export interface AuthUser {
  userId: string;
  role: UserRole;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

export async function authenticate(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw ApiError.unauthorized();
    }

    const token = authHeader.split(" ")[1];

    let payload: { userId: string; role: UserRole };
    try {
      payload = verifyToken(token);
    } catch {
      throw ApiError.unauthorized("Invalid or expired token");
    }

    const user = await User.findById(payload.userId).select("_id role isActive");
    if (!user || !user.isActive) {
      throw ApiError.unauthorized("Account is inactive or no longer exists");
    }

    req.user = { userId: user._id.toString(), role: user.role };
    next();
  } catch (error) {
    next(error);
  }
}

export function authorize(...roles: UserRole[]) {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(ApiError.unauthorized());
      return;
    }
    if (!roles.includes(req.user.role)) {
      next(ApiError.forbidden());
      return;
    }
    next();
  };
}