import { Router } from "express";
import {
  createMaternalRiskController,
  listMaternalRiskController,
  latestMaternalRiskController,
  createGDMController,
  listGDMController,
  latestGDMController,
  createPPDController,
  listPPDController,
  latestPPDController,
} from "../controllers/assessmentController";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import {
  maternalRiskAssessmentSchema,
  gdmAssessmentSchema,
  ppdAssessmentSchema,
} from "@maasuraksha/shared";

const router = Router();

router.use(authenticate);

router.post(
  "/maternal-risk",
  validate(maternalRiskAssessmentSchema),
  createMaternalRiskController
);
router.get("/maternal-risk", listMaternalRiskController);
router.get("/maternal-risk/latest/:userId", latestMaternalRiskController);

router.post("/gdm", validate(gdmAssessmentSchema), createGDMController);
router.get("/gdm", listGDMController);
router.get("/gdm/latest/:userId", latestGDMController);

router.post("/ppd", validate(ppdAssessmentSchema), createPPDController);
router.get("/ppd", listPPDController);
router.get("/ppd/latest/:userId", latestPPDController);

export default router;