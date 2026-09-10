import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/response";
import { updateOwnProfile } from "../services/userService";

export const updateProfileController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const result = await updateOwnProfile(req.user!.userId, req.body);
    sendSuccess(res, result);
  }
);