import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess, buildPaginationMeta } from "../utils/response";
import { parsePagination } from "../utils/pagination";
import {
  createConversation,
  listConversations,
  getConversation,
  sendMessage,
  listMessages,
} from "../services/chatService";

export const createConversationController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const conversation = await createConversation(req.user!, req.body.title);
    sendSuccess(res, conversation, 201);
  }
);

export const listConversationsController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { page, limit } = parsePagination(req.query);
    const result = await listConversations(req.user!, page, limit);
    sendSuccess(res, result.items, 200, buildPaginationMeta(page, limit, result.total));
  }
);

export const getConversationController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const conversation = await getConversation(req.user!, req.params.id as string);
    sendSuccess(res, conversation);
  }
);

export const sendMessageController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const result = await sendMessage(req.user!, req.params.id as string, req.body.message);
    sendSuccess(res, result, 201);
  }
);

export const listMessagesController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { page, limit } = parsePagination(req.query);
    const result = await listMessages(req.user!, req.params.id as string, page, limit);
    sendSuccess(res, result.items, 200, buildPaginationMeta(page, limit, result.total));
  }
);