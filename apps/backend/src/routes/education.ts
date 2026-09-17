import { z } from "zod";
import { updateProgress } from "../services/educationService";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/response";
import { AuthRequest } from "../middleware/auth";
import { Router } from "express";
import {
  adminListController,
  createController,
  listController,
  getByIdController,
  updateController,
} from "../controllers/educationController";
import { authenticate, authorize } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { educationalContentSchema } from "@maasuraksha/shared";
import { UserRole } from "@maasuraksha/shared";

const router = Router();

router.use(authenticate);

router.get("/", listController);
router.get("/manage", authorize(UserRole.ADMIN), adminListController);
router.patch("/:id/progress", validate(z.object({isSaved:z.boolean().optional(),isRead:z.boolean().optional()}).strict().refine(value=>Object.keys(value).length>0,"Provide a progress change")), asyncHandler(async(req:AuthRequest,res)=>{sendSuccess(res,await updateProgress(req.user!,req.params.id as string,req.body));}));
router.get("/:id", getByIdController);

router.post(
  "/",
  authorize(UserRole.ADMIN),
  validate(educationalContentSchema),
  createController
);
router.patch(
  "/:id",
  authorize(UserRole.ADMIN),
  validate(educationalContentSchema.partial().strict()),
  updateController
);

export default router;