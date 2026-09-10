import { Router } from "express";
import {
  createController,
  listController,
  getByIdController,
} from "../controllers/dietPlanController";
import { authenticate, authorize } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { dietPlanSchema } from "@maasuraksha/shared";
import { UserRole } from "@maasuraksha/shared";

const router = Router();

router.use(authenticate);

router.post(
  "/",
  authorize(UserRole.DOCTOR, UserRole.ASHA, UserRole.ADMIN),
  validate(dietPlanSchema),
  createController
);
router.get("/", listController);
router.get("/:id", getByIdController);

export default router;