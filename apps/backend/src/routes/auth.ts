import { Router } from "express";
import { registerController, loginController, meController } from "../controllers/authController";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { registerSchema, loginSchema } from "@maasuraksha/shared";

const router = Router();

router.post("/register", validate(registerSchema), registerController);
router.post("/login", validate(loginSchema), loginController);
router.get("/me", authenticate, meController);
router.get("/profile", authenticate, meController);

export default router;