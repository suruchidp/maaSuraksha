import { Router } from "express";
import {
  createController,
  listController,
  getByIdController,
  updateController,
} from "../controllers/healthMetricController";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { healthMetricSchema } from "@maasuraksha/shared";

const router = Router();

router.use(authenticate);

router.post("/", validate(healthMetricSchema), createController);
router.get("/", listController);
router.get("/:id", getByIdController);
router.patch("/:id", validate(healthMetricSchema), updateController);

export default router;