import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess, buildPaginationMeta } from "../utils/response";
import { parsePagination } from "../utils/pagination";
import { listAccessiblePatients } from "../services/userService";

export const listPatientsController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { page, limit } = parsePagination(req.query);
    const search = req.query.search as string | undefined;
    const result = await listAccessiblePatients(req.user!, {
      page,
      limit,
      search,
    });
    sendSuccess(
      res,
      result.users,
      200,
      buildPaginationMeta(page, limit, result.total)
    );
  }
);