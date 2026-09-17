import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/response";
import {
  getDietGuidance,
  getDietGuidancePreferences,
  upsertDietGuidancePreferences,
} from "../services/dietGuidanceService";

export const getGuidanceController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.query.userId as string | undefined;
    const result = await getDietGuidance(req.user!, userId);
    sendSuccess(res, result);
  }
);

export const getPreferencesController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.query.userId as string | undefined;
    const prefs = await getDietGuidancePreferences(req.user!, userId);
    sendSuccess(res, prefs);
  }
);

export const upsertPreferencesController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.query.userId as string | undefined;
    const prefs = await upsertDietGuidancePreferences(req.user!, userId, req.body);
    sendSuccess(res, prefs, 200);
  }
);