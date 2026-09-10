import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess, buildPaginationMeta } from "../utils/response";
import { parsePagination } from "../utils/pagination";
import { getSystemOverview, listAuditLogs } from "../services/adminService";
import {
  listUsers,
  updateUserByAdmin,
  createUserByAdmin,
} from "../services/userService";

export const overviewController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const overview = await getSystemOverview(req.user!.role);
    sendSuccess(res, overview);
  }
);

export const listUsersController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { page, limit } = parsePagination(req.query);
    const role = req.query.role as string | undefined;
    const result = await listUsers(req.user!.role, { page, limit, role });
    sendSuccess(res, result.users, 200, buildPaginationMeta(page, limit, result.total));
  }
);

export const updateUserController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const user = await updateUserByAdmin(req.user!.role, req.params.id as string, req.body);
    sendSuccess(res, user);
  }
);

export const createUserController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const user = await createUserByAdmin(req.user!.role, req.body);
    sendSuccess(res, user, 201);
  }
);

export const auditLogsController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { page, limit } = parsePagination(req.query);
    const result = await listAuditLogs(req.user!.role, page, limit);
    sendSuccess(res, result.items, 200, buildPaginationMeta(page, limit, result.total));
  }
);