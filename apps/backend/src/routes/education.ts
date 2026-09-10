import { Router } from "express";
import {
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
  updateController
);

export default router;