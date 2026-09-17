import { Router } from "express";
import {
  createController,
  listController,
  getByIdController,
  updateStatusController,
} from "../controllers/alertController";
import { authenticate, authorize } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { alertSchema } from "@maasuraksha/shared";
import { UserRole } from "@maasuraksha/shared";

import { alertSummary, markAlertRead } from "../services/alertService";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/response";
import { AuthRequest } from "../middleware/auth";
const router = Router();

router.use(authenticate);

router.post(
  "/",
  authorize(UserRole.DOCTOR, UserRole.ASHA, UserRole.ADMIN),
  validate(alertSchema),
  createController
);
router.get("/", listController);
router.get("/summary", asyncHandler(async (req: AuthRequest, res) => { sendSuccess(res, await alertSummary(req.user!)); }));
router.patch("/:id/read", asyncHandler(async (req: AuthRequest, res) => { sendSuccess(res, await markAlertRead(req.user!, req.params.id as string)); }));
router.get("/:id", getByIdController);
router.patch("/:id/status", updateStatusController);

export default router;