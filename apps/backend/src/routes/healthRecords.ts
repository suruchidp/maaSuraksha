import { Router } from "express";
import { z } from "zod";
import { healthRecordSchema } from "@maasuraksha/shared";
import { authenticate, AuthRequest } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess, buildPaginationMeta } from "../utils/response";
import { parsePagination } from "../utils/pagination";
import { ApiError } from "../utils/ApiError";
import { HealthRecord } from "../models/HealthRecord";
import {
  recordPatient,
  recordListFilter,
  recordId,
  assertRecordAccess,
} from "../services/recordAccess";

const router = Router();
router.use(authenticate);
const query = z
  .object({
    userId: z.string().optional(),
    category: healthRecordSchema.shape.category.optional(),
    archived: z.enum(["true", "false"]).optional(),
    search: z.string().max(100).optional(),
  })
  .passthrough();
const patch = healthRecordSchema
  .partial()
  .extend({
    isArchived: z.boolean().optional(),
    updatedAt: z.string().datetime(),
  })
  .strict()
  .refine((v) => Object.keys(v).length > 1, "No changes provided");
const dto = (r: InstanceType<typeof HealthRecord>) => ({
  id: r._id,
  user: r.user,
  category: r.category,
  title: r.title,
  date: r.date,
  provider: r.provider,
  details: r.details,
  recordedBy: r.recordedBy,
  authorRole: r.authorRole,
  isArchived: r.isArchived,
  createdAt: r.createdAt,
  updatedAt: r.updatedAt,
});
router.post(
  "/",
  validate(healthRecordSchema),
  asyncHandler(async (req: AuthRequest, res) => {
    const q = query.safeParse(req.query);
    if (!q.success) throw ApiError.badRequest("Invalid record query");
    const user = await recordPatient(req.user!, q.data.userId);
    const r = await HealthRecord.create({
      ...req.body,
      date: new Date(`${req.body.date}T00:00:00Z`),
      user,
      recordedBy: req.user!.userId,
      authorRole: req.user!.role,
    });
    sendSuccess(res, dto(r), 201);
  }),
);
router.get(
  "/",
  asyncHandler(async (req: AuthRequest, res) => {
    const q = query.safeParse(req.query);
    if (!q.success) throw ApiError.badRequest("Invalid record query");
    const { page, limit } = parsePagination(req.query);
    const filter = await recordListFilter(req.user!, q.data.userId);
    filter.isArchived = q.data.archived === "true";
    if (q.data.category) filter.category = q.data.category;
    if (q.data.search?.trim())
      filter.title = {
        $regex: q.data.search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        $options: "i",
      };
    const total = await HealthRecord.countDocuments(filter);
    const items = await HealthRecord.find(filter)
      .sort({ date: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
    sendSuccess(
      res,
      items.map(dto),
      200,
      buildPaginationMeta(page, limit, total),
    );
  }),
);
router.get(
  "/:id",
  asyncHandler(async (req: AuthRequest, res) => {
    recordId(req.params.id as string);
    const r = await HealthRecord.findById(req.params.id);
    if (!r) throw ApiError.notFound("Health record not found");
    await assertRecordAccess(req.user!, r.user.toString());
    sendSuccess(res, dto(r));
  }),
);
router.patch(
  "/:id",
  validate(patch),
  asyncHandler(async (req: AuthRequest, res) => {
    recordId(req.params.id as string);
    const r = await HealthRecord.findById(req.params.id);
    if (!r) throw ApiError.notFound("Health record not found");
    await assertRecordAccess(req.user!, r.user.toString());
    if (r.recordedBy.toString() !== req.user!.userId)
      throw ApiError.forbidden(
        "Only the original author can edit or archive this record",
      );
    const { updatedAt, ...changes } = req.body;
    if (changes.date) changes.date = new Date(`${changes.date}T00:00:00Z`);
    const updated = await HealthRecord.findOneAndUpdate(
      { _id: r._id, updatedAt: new Date(updatedAt) },
      { $set: changes },
      { new: true, runValidators: true },
    );
    if (!updated)
      throw ApiError.conflict("Record changed; refresh and try again");
    sendSuccess(res, dto(updated));
  }),
);
export default router;
