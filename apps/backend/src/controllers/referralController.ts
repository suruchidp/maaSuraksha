import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess, buildPaginationMeta } from "../utils/response";
import { parsePagination } from "../utils/pagination";
import {
  createReferral,
  listReferrals,
  getReferral,
  updateReferralStatus,
} from "../services/referralService";

export const createController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const referral = await createReferral(req.user!, req.body);
    sendSuccess(res, referral, 201);
  }
);

export const listController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { page, limit } = parsePagination(req.query);
    const patientId = req.query.patientId as string | undefined;
    const result = await listReferrals(req.user!, req.user!.role, patientId, page, limit);
    sendSuccess(res, result.items, 200, buildPaginationMeta(page, limit, result.total));
  }
);

export const getByIdController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const referral = await getReferral(req.user!, req.params.id as string);
    sendSuccess(res, referral);
  }
);

export const updateStatusController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const referral = await updateReferralStatus(
      req.user!,
      req.params.id as string,
      req.body.status,
      req.body.note
    );
    sendSuccess(res, referral);
  }
);