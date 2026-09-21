import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/response";
import { listActiveDoctors } from "../services/userService";

export const listDoctorsController = asyncHandler(
  async (_req: AuthRequest, res: Response) => {
    sendSuccess(res, await listActiveDoctors());
  }
);