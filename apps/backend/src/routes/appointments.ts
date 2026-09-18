import { Router } from "express";
import {
  createController,
  listController,
  getByIdController,
  updateStatusController,
  rescheduleController,
} from "../controllers/appointmentController";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { appointmentSchema, AppointmentStatus } from "@maasuraksha/shared";
import { z } from "zod";

const router = Router();

router.use(authenticate);

router.post("/", validate(appointmentSchema), createController);
router.get("/", listController);
router.get("/:id", getByIdController);
router.patch("/:id/status", validate(z.object({ status: z.nativeEnum(AppointmentStatus), cancelledReason: z.string().trim().max(500).optional() }).strict()), updateStatusController);
router.patch("/:id/schedule", validate(appointmentSchema.pick({ date: true, time: true }).strict()), rescheduleController);

export default router;
