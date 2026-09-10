import { Router } from "express";
import {
  createController,
  listController,
  getByIdController,
} from "../controllers/symptomController";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { symptomSchema } from "@maasuraksha/shared";

const router = Router();

router.use(authenticate);

router.post("/", validate(symptomSchema), createController);
router.get("/", listController);
router.get("/:id", getByIdController);

export default router;