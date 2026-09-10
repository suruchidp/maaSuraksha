import { Router } from "express";
import {
  overviewController,
  listUsersController,
  updateUserController,
  createUserController,
  auditLogsController,
} from "../controllers/adminController";
import { authenticate, authorize } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { registerSchema } from "@maasuraksha/shared";
import { UserRole } from "@maasuraksha/shared";

const router = Router();

router.use(authenticate, authorize(UserRole.ADMIN));

router.get("/overview", overviewController);
router.get("/users", listUsersController);
router.patch("/users/:id", updateUserController);
router.post("/users", validate(registerSchema), createUserController);
router.get("/audit-logs", auditLogsController);

export default router;