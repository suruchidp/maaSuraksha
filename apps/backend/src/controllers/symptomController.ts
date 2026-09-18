import { z } from "zod";
import { ApiError } from "../utils/ApiError";
const querySchema = z.object({ userId: z.string().optional(), severity: z.string().optional() }).passthrough();
function query(req: AuthRequest) { const result = querySchema.safeParse(req.query); if (!result.success) throw ApiError.badRequest("Invalid query parameters"); return result.data; }
import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess, buildPaginationMeta } from "../utils/response";
import { parsePagination } from "../utils/pagination";
import {
  createSymptom,
  listSymptoms,
  getSymptom,
} from "../services/symptomService";

export const createController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = query(req).userId;
    const symptom = await createSymptom(req.user!, userId, req.body);
    sendSuccess(res, symptom, 201);
  }
);

export const listController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { page, limit } = parsePagination(req.query);
    const userId = query(req).userId;
    const severity = query(req).severity;
    const result = await listSymptoms(req.user!, userId, page, limit, severity);
    sendSuccess(res, result.items, 200, buildPaginationMeta(page, limit, result.total));
  }
);

export const getByIdController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const symptom = await getSymptom(req.user!, req.params.id as string);
    sendSuccess(res, symptom);
  }
);