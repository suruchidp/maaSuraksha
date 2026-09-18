import { z } from "zod";
import { Router } from "express";
import {
  upsertProfileController,
  getProfileController, trackingController, milestoneController,
} from "../controllers/pregnancyController";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { pregnancyProfileSchema } from "@maasuraksha/shared";

const router = Router();

router.use(authenticate);

router.get("/tracking", trackingController);
router.patch("/milestones/:key", validate(z.object({completed:z.boolean(),updatedAt:z.string().datetime()}).strict()), milestoneController);

router.put("/", validate(pregnancyProfileSchema), upsertProfileController);
router.post("/", validate(pregnancyProfileSchema), upsertProfileController);
router.get("/", getProfileController);

export default router;