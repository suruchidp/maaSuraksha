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
    const patientId = req.query.patientId as string | undefined;
    const status = req.query.status as string | undefined;
    const result = await listAppointments(req.user!, patientId, page, limit, status);
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