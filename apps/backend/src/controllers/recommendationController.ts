import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess, buildPaginationMeta } from "../utils/response";
import { parsePagination } from "../utils/pagination";
import {
  createRecommendation,
  listRecommendations,
  getRecommendation,
  markRecommendationRead,
} from "../services/recommendationService";

export const createController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.query.userId as string | undefined;
    const rec = await createRecommendation(req.user!, userId, req.body);
    sendSuccess(res, rec, 201);
  }
);

export const listController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { page, limit } = parsePagination(req.query);
    const userId = req.query.userId as string | undefined;
    const category = req.query.category as string | undefined;
    const result = await listRecommendations(req.user!, userId, page, limit, category);
    sendSuccess(res, result.items, 200, buildPaginationMeta(page, limit, result.total));
  }
);

export const getByIdController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const rec = await getRecommendation(req.user!, req.params.id as string);
    sendSuccess(res, rec);
  }
);

export const markReadController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const rec = await markRecommendationRead(
      req.user!,
      req.params.id as string,
      req.body.read !== false
    );
    sendSuccess(res, rec);
  }
);