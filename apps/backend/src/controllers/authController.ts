import { Request, Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/response";
import { register, login, getProfile } from "../services/authService";
import { logAudit } from "../middleware/audit";

export const registerController = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await register(req.body);
    await logAudit(result.user.id, "register", "user", result.user.id, undefined, req.ip);
    sendSuccess(res, result, 201);
  }
);

export const loginController = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await login(req.body);
    await logAudit(result.user.id, "login", "user", result.user.id, undefined, req.ip);
    sendSuccess(res, result);
  }
);

export const meController = asyncHandler(async (req: AuthRequest, res: Response) => {
  const profile = await getProfile(req.user!.userId);
  sendSuccess(res, profile);
});

export const profileController = meController;