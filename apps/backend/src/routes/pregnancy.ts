import { Router } from "express";
import {
  upsertProfileController,
  getProfileController,
} from "../controllers/pregnancyController";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { pregnancyProfileSchema } from "@maasuraksha/shared";

const router = Router();

router.use(authenticate);

router.put("/", validate(pregnancyProfileSchema), upsertProfileController);
router.post("/", validate(pregnancyProfileSchema), upsertProfileController);
router.get("/", getProfileController);

export default router;