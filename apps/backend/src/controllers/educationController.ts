import { z } from "zod";
import { ApiError } from "../utils/ApiError";
import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess, buildPaginationMeta } from "../utils/response";
import { parsePagination } from "../utils/pagination";
import { Language } from "@maasuraksha/shared";
import {
  adminListContent,
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
    const query=z.object({category:z.string().optional(),lang:z.nativeEnum(Language).optional(),search:z.string().max(100).optional(),view:z.enum(["all","for_you","saved"]).optional()}).safeParse(req.query);
    if(!query.success) throw ApiError.badRequest("Invalid education filters",query.error.flatten());
    const {category,lang,search,view}=query.data;
    const result = await listContent(page, limit, category, lang, {search, view,actor:req.user!});
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
    const result = await adminListContent(req.user!.role, page, limit);
    sendSuccess(res, result.items, 200, buildPaginationMeta(page, limit, result.total));
  }
);

export const updateController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const content = await updateContent(req.user!.role, req.params.id as string, req.body);
    sendSuccess(res, content);
  }
);