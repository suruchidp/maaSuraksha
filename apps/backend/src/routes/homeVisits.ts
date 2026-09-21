import { Router } from "express";
import {
  requestController,
  listController,
  getByIdController,
  scheduleController,
  completeController,
  cancelController,
  escalateController,
} from "../controllers/homeVisitController";
import { authenticate, authorize } from "../middleware/auth";
import { validate } from "../middleware/validate";
import {
  homeVisitRequestSchema,
  homeVisitEscalateSchema,
  UserRole,
} from "@maasuraksha/shared";

const router = Router();

router.use(authenticate);

router.post(
  "/",
  authorize(UserRole.PATIENT),
  validate(homeVisitRequestSchema),
  requestController
);
router.get(
  "/",
  authorize(UserRole.PATIENT, UserRole.ASHA, UserRole.DOCTOR, UserRole.ADMIN),
  listController
);
router.get(
  "/:id",
  authorize(UserRole.PATIENT, UserRole.ASHA, UserRole.DOCTOR, UserRole.ADMIN),
  getByIdController
);
router.patch(
  "/:id/schedule",
  authorize(UserRole.ASHA, UserRole.DOCTOR, UserRole.ADMIN),
  scheduleController
);
router.patch(
  "/:id/complete",
  authorize(UserRole.ASHA, UserRole.DOCTOR, UserRole.ADMIN),
  completeController
);
router.patch(
  "/:id/cancel",
  authorize(UserRole.PATIENT, UserRole.ASHA, UserRole.DOCTOR, UserRole.ADMIN),
  cancelController
);
router.patch(
  "/:id/escalate",
  authorize(UserRole.ASHA, UserRole.DOCTOR, UserRole.ADMIN),
  validate(homeVisitEscalateSchema),
  escalateController
);

export default router;
