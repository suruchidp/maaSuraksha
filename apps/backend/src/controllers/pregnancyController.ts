import { z } from "zod";
import { ApiError } from "../utils/ApiError";
const querySchema = z.object({ userId: z.string().optional() }).passthrough();
function target(req: AuthRequest) {
  const q = querySchema.safeParse(req.query);
  if (!q.success) throw ApiError.badRequest("Invalid patient query");
  return q.data.userId;
}
import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/response";
import {
  createOrUpdatePregnancyProfile,
  getPregnancyProfile,
  getPregnancyTracking,
  updatePregnancyMilestone,
} from "../services/pregnancyService";

export const upsertProfileController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const targetUserId = target(req);
    const profile = await createOrUpdatePregnancyProfile(
      req.user!,
      targetUserId,
      req.body,
    );
    sendSuccess(res, profile, 200);
  },
);

export const getProfileController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const targetUserId = target(req);
    const profile = await getPregnancyProfile(req.user!, targetUserId);
    sendSuccess(res, profile);
  },
);
export const trackingController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    sendSuccess(res, await getPregnancyTracking(req.user!, target(req)));
  },
);
export const milestoneController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    sendSuccess(
      res,
      await updatePregnancyMilestone(
        req.user!,
        target(req),
        req.params.key as string,
        req.body.completed,
        req.body.updatedAt,
      ),
    );
  },
);
