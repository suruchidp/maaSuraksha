import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/response";
import {
  createOrUpdatePregnancyProfile,
  getPregnancyProfile,
} from "../services/pregnancyService";

export const upsertProfileController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const targetUserId = req.query.userId as string | undefined;
    const profile = await createOrUpdatePregnancyProfile(
      req.user!,
      targetUserId,
      req.body
    );
    sendSuccess(res, profile, 200);
  }
);

export const getProfileController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const targetUserId = req.query.userId as string | undefined;
    const profile = await getPregnancyProfile(req.user!, targetUserId);
    sendSuccess(res, profile);
  }
);