import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess, buildPaginationMeta } from "../utils/response";
import { parsePagination } from "../utils/pagination";
import {
  createMaternalRiskAssessment,
  listMaternalRiskAssessments,
  getLatestMaternalRiskAssessment,
  createGDMAssessment,
  listGDMAssessments,
  getLatestGDMAssessment,
  createPPDAssessment,
  listPPDAssessments,
  getLatestPPDAssessment,
} from "../services/assessmentService";

const userIdFromQuery = (req: AuthRequest) =>
  (req.query.userId as string | undefined) ??
  (req.body.user as string | undefined);

export const createMaternalRiskController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const result = await createMaternalRiskAssessment(
      req.user!,
      userIdFromQuery(req),
      req.body
    );
    sendSuccess(res, result, 201);
  }
);

export const listMaternalRiskController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { page, limit } = parsePagination(req.query);
    const result = await listMaternalRiskAssessments(
      req.user!,
      userIdFromQuery(req),
      page,
      limit
    );
    sendSuccess(res, result.items, 200, buildPaginationMeta(page, limit, result.total));
  }
);

export const latestMaternalRiskController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const result = await getLatestMaternalRiskAssessment(
      req.user!,
      req.params.userId as string
    );
    sendSuccess(res, result);
  }
);

export const createGDMController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const result = await createGDMAssessment(req.user!, userIdFromQuery(req), req.body);
    sendSuccess(res, result, 201);
  }
);

export const listGDMController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { page, limit } = parsePagination(req.query);
    const result = await listGDMAssessments(req.user!, userIdFromQuery(req), page, limit);
    sendSuccess(res, result.items, 200, buildPaginationMeta(page, limit, result.total));
  }
);

export const latestGDMController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const result = await getLatestGDMAssessment(req.user!, req.params.userId as string);
    sendSuccess(res, result);
  }
);

export const createPPDController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const result = await createPPDAssessment(req.user!, userIdFromQuery(req), req.body);
    sendSuccess(res, result, 201);
  }
);

export const listPPDController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { page, limit } = parsePagination(req.query);
    const result = await listPPDAssessments(req.user!, userIdFromQuery(req), page, limit);
    sendSuccess(res, result.items, 200, buildPaginationMeta(page, limit, result.total));
  }
);

export const latestPPDController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const result = await getLatestPPDAssessment(req.user!, req.params.userId as string);
    sendSuccess(res, result);
  }
);