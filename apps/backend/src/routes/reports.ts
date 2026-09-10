import { Router } from "express";
import {
  createController,
  listController,
  getByIdController,
} from "../controllers/reportController";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { reportSchema } from "@maasuraksha/shared";

const router = Router();

router.use(authenticate);

router.post("/", validate(reportSchema), createController);
router.get("/", listController);
router.get("/:id", getByIdController);

export default router;