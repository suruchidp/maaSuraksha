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

const router = Router();

router.use(authenticate);

router.post(
  "/",
  authorize(UserRole.DOCTOR, UserRole.ASHA, UserRole.ADMIN),
  validate(alertSchema),
  createController
);
router.get("/", listController);
router.get("/:id", getByIdController);
router.patch("/:id/status", updateStatusController);

export default router;