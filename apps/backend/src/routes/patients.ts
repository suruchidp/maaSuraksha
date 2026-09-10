import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth";
import { UserRole } from "@maasuraksha/shared";
import { listPatientsController } from "../controllers/patientsController";

const router = Router();

router.use(authenticate);

router.get(
  "/",
  authorize(UserRole.ASHA, UserRole.DOCTOR, UserRole.ADMIN),
  listPatientsController
);

export default router;