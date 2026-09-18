import { z } from "zod";
import { ApiError } from "../utils/ApiError";
const listQuery = z.object({ patientId: z.string().optional(), status: z.string().optional(), view: z.enum(["all", "upcoming", "past"]).optional() }).passthrough();
import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess, buildPaginationMeta } from "../utils/response";
import { parsePagination } from "../utils/pagination";
import {
  createAppointment,
  listAppointments,
  getAppointment,
  updateAppointmentStatus,
  rescheduleAppointment,
} from "../services/appointmentService";

export const createController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const appointment = await createAppointment(req.user!, req.body);
    sendSuccess(res, appointment, 201);
  }
);

export const listController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { page, limit } = parsePagination(req.query);
    const parsed = listQuery.safeParse(req.query);
    if (!parsed.success) throw ApiError.badRequest("Invalid appointment query");
    const { patientId, status, view } = parsed.data;
    const result = await listAppointments(req.user!, patientId, page, limit, status, view);
    sendSuccess(res, result.items, 200, buildPaginationMeta(page, limit, result.total));
  }
);

export const getByIdController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const appointment = await getAppointment(req.user!, req.params.id as string);
    sendSuccess(res, appointment);
  }
);

export const updateStatusController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const appointment = await updateAppointmentStatus(
      req.user!,
      req.params.id as string,
      req.body.status,
      req.body.cancelledReason
    );
    sendSuccess(res, appointment);
  }
);
export const rescheduleController = asyncHandler(async (req: AuthRequest, res: Response) => { sendSuccess(res, await rescheduleAppointment(req.user!, req.params.id as string, req.body)); });
