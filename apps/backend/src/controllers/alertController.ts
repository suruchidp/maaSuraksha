import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess, buildPaginationMeta } from "../utils/response";
import { parsePagination } from "../utils/pagination";
import {
  createAlert,
  listAlerts,
  getAlert,
  updateAlertStatus,
} from "../services/alertService";

export const createController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const alert = await createAlert(req.user!, req.body);
    sendSuccess(res, alert, 201);
  }
);

export const listController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { page, limit } = parsePagination(req.query);
    const userId = req.query.userId as string | undefined;
    const status = req.query.status as string | undefined;
    const result = await listAlerts(req.user!, userId, page, limit, status);
    sendSuccess(res, result.items, 200, buildPaginationMeta(page, limit, result.total));
  }
);

export const getByIdController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const alert = await getAlert(req.user!, req.params.id as string);
    sendSuccess(res, alert);
  }
);

export const updateStatusController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const alert = await updateAlertStatus(req.user!, req.params.id as string, req.body.status);
    sendSuccess(res, alert);
  }
);