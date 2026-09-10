import { Router } from "express";
import {
  createController,
  listController,
  getByIdController,
  updateStatusController,
} from "../controllers/appointmentController";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { appointmentSchema } from "@maasuraksha/shared";

const router = Router();

router.use(authenticate);

router.post("/", validate(appointmentSchema), createController);
router.get("/", listController);
router.get("/:id", getByIdController);
router.patch("/:id/status", updateStatusController);

export default router;