import { Router } from "express";
import { z } from 'zod';
import { ApiError } from '../utils/ApiError';
import { chatCapabilities } from '../services/chatProvider';
import { sendSuccess } from '../utils/response';
import {
  createConversationController,
  listConversationsController,
  getConversationController,
  sendMessageController,
  listMessagesController,
} from "../controllers/chatController";
import { authenticate, authorize } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { chatMessageSchema } from "@maasuraksha/shared";
import { UserRole } from "@maasuraksha/shared";

const router = Router();
const pageInteger = z.string().regex(/^[1-9]\d*$/).refine(v=>Number.isSafeInteger(Number(v)) && Number(v)<=1000000);

router.use(authenticate, authorize(UserRole.PATIENT, UserRole.ADMIN));
router.use((req, _res, next) => {
 const result = z.object({page:pageInteger.optional(),limit:pageInteger.optional()}).strict().safeParse(req.query);
 if (!result.success) return next(ApiError.badRequest('Invalid chat query parameters'));
 next();
});

router.post("/", validate(z.object({title:z.string().trim().min(1).max(200).optional()}).strict()), createConversationController);
router.get("/", listConversationsController);
router.get('/capabilities', (_req,res)=>sendSuccess(res,chatCapabilities()));
router.get("/:id", getConversationController);
router.post("/:id/messages", validate(chatMessageSchema), sendMessageController);
router.get("/:id/messages", listMessagesController);

export default router;
