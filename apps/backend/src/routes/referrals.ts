import { Router } from "express";
import {
  createController,
  listController,
  getByIdController,
  updateStatusController,
} from "../controllers/referralController";
import { authenticate, authorize } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { referralSchema } from "@maasuraksha/shared";
import { UserRole } from "@maasuraksha/shared";

const router = Router();

router.use(authenticate);

router.post(
  "/",
  authorize(UserRole.ASHA, UserRole.DOCTOR, UserRole.ADMIN),
  validate(referralSchema),
  createController
);
router.get("/", listController);
router.get("/:id", getByIdController);
router.patch("/:id/status", updateStatusController);

export default router;