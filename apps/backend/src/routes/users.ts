import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { listDoctorsController } from "../controllers/userController";

const router = Router();

router.use(authenticate);

router.get("/doctors", listDoctorsController);

export default router;