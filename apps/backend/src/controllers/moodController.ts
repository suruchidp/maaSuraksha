import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess, buildPaginationMeta } from "../utils/response";
import { parsePagination } from "../utils/pagination";
import {
  createMoodEntry,
  listMoodEntries,
  getMoodEntry,
} from "../services/moodService";

export const createController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.query.userId as string | undefined;
    const entry = await createMoodEntry(req.user!, userId, req.body.journalText);
    sendSuccess(res, entry, 201);
  }
);

export const listController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { page, limit } = parsePagination(req.query);
    const userId = req.query.userId as string | undefined;
    const result = await listMoodEntries(req.user!, userId, page, limit);
    sendSuccess(res, result.items, 200, buildPaginationMeta(page, limit, result.total));
  }
);

export const getByIdController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const entry = await getMoodEntry(req.user!, req.params.id as string);
    sendSuccess(res, entry);
  }
);