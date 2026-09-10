import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess, buildPaginationMeta } from "../utils/response";
import { parsePagination } from "../utils/pagination";
import {
  createDietPlan,
  listDietPlans,
  getDietPlan,
} from "../services/dietPlanService";

export const createController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.query.userId as string | undefined;
    const plan = await createDietPlan(req.user!, userId, req.body);
    sendSuccess(res, plan, 201);
  }
);

export const listController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { page, limit } = parsePagination(req.query);
    const userId = req.query.userId as string | undefined;
    const result = await listDietPlans(req.user!, userId, page, limit);
    sendSuccess(res, result.items, 200, buildPaginationMeta(page, limit, result.total));
  }
);

export const getByIdController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const plan = await getDietPlan(req.user!, req.params.id as string);
    sendSuccess(res, plan);
  }
);