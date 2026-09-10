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
    const userId = req.query.userId as string | undefined;
    const symptom = await createSymptom(req.user!, userId, req.body);
    sendSuccess(res, symptom, 201);
  }
);

export const listController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { page, limit } = parsePagination(req.query);
    const userId = req.query.userId as string | undefined;
    const severity = req.query.severity as string | undefined;
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