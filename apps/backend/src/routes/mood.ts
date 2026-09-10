import { Router } from "express";
import {
  createController,
  listController,
  getByIdController,
} from "../controllers/moodController";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { moodEntrySchema } from "@maasuraksha/shared";

const router = Router();

router.use(authenticate);

router.post("/", validate(moodEntrySchema), createController);
router.get("/", listController);
router.get("/:id", getByIdController);

export default router;