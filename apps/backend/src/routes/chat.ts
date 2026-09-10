import { Router } from "express";
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

router.use(authenticate, authorize(UserRole.PATIENT, UserRole.ADMIN));

router.post("/", createConversationController);
router.get("/", listConversationsController);
router.get("/:id", getConversationController);
router.post("/:id/messages", validate(chatMessageSchema), sendMessageController);
router.get("/:id/messages", listMessagesController);

export default router;