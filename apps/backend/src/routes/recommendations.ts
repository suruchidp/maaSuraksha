import { Router } from "express";
import {
  createController,
  listController,
  getByIdController,
  markReadController,
} from "../controllers/recommendationController";
import { authenticate, authorize } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { recommendationSchema } from "@maasuraksha/shared";
import { UserRole } from "@maasuraksha/shared";

const router = Router();

router.use(authenticate);

router.post(
  "/",
  authorize(UserRole.DOCTOR, UserRole.ASHA, UserRole.ADMIN),
  validate(recommendationSchema),
  createController
);
router.get("/", listController);
router.get("/:id", getByIdController);
router.patch("/:id/read", markReadController);

export default router;