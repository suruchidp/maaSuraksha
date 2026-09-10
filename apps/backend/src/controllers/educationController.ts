import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess, buildPaginationMeta } from "../utils/response";
import { parsePagination } from "../utils/pagination";
import { Language } from "@maasuraksha/shared";
import {
  createContent,
  listContent,
  getContent,
  updateContent,
} from "../services/educationService";

export const createController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const content = await createContent(req.user!.userId, req.body);
    sendSuccess(res, content, 201);
  }
);

export const listController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { page, limit } = parsePagination(req.query);
    const category = req.query.category as string | undefined;
    const lang = req.query.lang as Language | undefined;
    const result = await listContent(page, limit, category, lang);
    sendSuccess(res, result.items, 200, buildPaginationMeta(page, limit, result.total));
  }
);

export const getByIdController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const lang = req.query.lang as Language | undefined;
    const content = await getContent(req.params.id as string, lang);
    sendSuccess(res, content);
  }
);

export const adminListController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { page, limit } = parsePagination(req.query);
    const result = await listContent(page, limit);
    sendSuccess(res, result.items, 200, buildPaginationMeta(page, limit, result.total));
  }
);

export const updateController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const content = await updateContent(req.user!.role, req.params.id as string, req.body);
    sendSuccess(res, content);
  }
);