import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess, buildPaginationMeta } from "../utils/response";
import { parsePagination } from "../utils/pagination";
import {
  requestHomeVisit as requestHomeVisitService,
  listHomeVisits,
  getHomeVisit,
  scheduleHomeVisit,
  completeHomeVisit,
  cancelHomeVisit,
  escalateHomeVisit,
} from "../services/homeVisitService";

export const requestController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const visit = await requestHomeVisitService(req.user!, req.body);
    sendSuccess(res, visit, 201);
  }
);

export const listController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { page, limit } = parsePagination(req.query);
    const patientId = req.query.patientId as string | undefined;
    const result = await listHomeVisits(
      req.user!,
      patientId,
      page,
      limit
    );
    sendSuccess(res, result.items, 200, buildPaginationMeta(page, limit, result.total));
  }
);

export const getByIdController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const visit = await getHomeVisit(req.user!, req.params.id as string);
    sendSuccess(res, visit);
  }
);

export const scheduleController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const visit = await scheduleHomeVisit(req.user!, {
      visitId: req.params.id as string,
      ...req.body,
    });
    sendSuccess(res, visit);
  }
);

export const completeController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const visit = await completeHomeVisit(req.user!, {
      visitId: req.params.id as string,
      ...req.body,
    });
    sendSuccess(res, visit);
  }
);

export const cancelController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const visit = await cancelHomeVisit(req.user!, {
      visitId: req.params.id as string,
      ...req.body,
    });
    sendSuccess(res, visit);
  }
);

export const escalateController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const visit = await escalateHomeVisit(req.user!, {
      visitId: req.params.id as string,
      ...req.body,
    });
    sendSuccess(res, visit);
  }
);
