import { Router } from "express";
import {
  getGuidanceController,
  getPreferencesController,
  upsertPreferencesController,
} from "../controllers/dietGuidanceController";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { dietGuidancePreferencesSchema } from "@maasuraksha/shared";

const router = Router();

router.use(authenticate);

router.get("/", getGuidanceController);
router.get("/preferences", getPreferencesController);
router.patch(
  "/preferences",
  validate(dietGuidancePreferencesSchema),
  upsertPreferencesController
);

export default router;