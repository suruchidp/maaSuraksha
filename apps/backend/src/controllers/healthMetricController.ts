import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess, buildPaginationMeta } from "../utils/response";
import { parsePagination } from "../utils/pagination";
import {
  createHealthMetric,
  listHealthMetrics,
  getHealthMetric,
  updateHealthMetric,
} from "../services/healthMetricService";

export const createController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.query.userId as string | undefined;
    const metric = await createHealthMetric(req.user!, userId, req.body);
    sendSuccess(res, metric, 201);
  }
);

export const listController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { page, limit } = parsePagination(req.query);
    const userId = req.query.userId as string | undefined;
    const fromDate = req.query.fromDate as string | undefined;
    const toDate = req.query.toDate as string | undefined;
    const result = await listHealthMetrics(req.user!, userId, page, limit, fromDate, toDate);
    sendSuccess(res, result.items, 200, buildPaginationMeta(page, limit, result.total));
  }
);

export const getByIdController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const metric = await getHealthMetric(req.user!, req.params.id as string);
    sendSuccess(res, metric);
  }
);

export const updateController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const metric = await updateHealthMetric(req.user!, req.params.id as string, req.body);
    sendSuccess(res, metric);
  }
);