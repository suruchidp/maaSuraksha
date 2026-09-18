import { z } from "zod";
import { ApiError } from "../utils/ApiError";
const querySchema = z
  .object({ userId: z.string().optional(), type: z.string().optional() })
  .passthrough();
function query(req: AuthRequest) {
  const parsed = querySchema.safeParse(req.query);
  if (!parsed.success) throw ApiError.badRequest("Invalid report query");
  return parsed.data;
}
import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess, buildPaginationMeta } from "../utils/response";
import { parsePagination } from "../utils/pagination";
import {
  createReport,
  listReports,
  getReport,
} from "../services/reportService";

export const createController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = query(req).userId;
    const report = await createReport(req.user!, userId, req.body);
    sendSuccess(res, report, 201);
  },
);

export const listController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { page, limit } = parsePagination(req.query);
    const userId = query(req).userId;
    const result = await listReports(
      req.user!,
      userId,
      page,
      limit,
      query(req).type,
    );
    sendSuccess(
      res,
      result.items,
      200,
      buildPaginationMeta(page, limit, result.total),
    );
  },
);

export const getByIdController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const report = await getReport(req.user!, req.params.id as string);
    sendSuccess(res, report);
  },
);
