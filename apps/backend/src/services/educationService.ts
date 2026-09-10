import { isValidObjectId } from "mongoose";
import { EducationalContent } from "../models/EducationalContent";
import { ApiError } from "../utils/ApiError";
import { EDUCATIONAL_CATEGORIES, Language } from "@maasuraksha/shared";

export interface EducationalContentInput {
  title: Record<Language, string>;
  body: Record<Language, string>;
  category: string;
  tags?: string[];
  isActive?: boolean;
}

export async function createContent(
  createdBy: string,
  input: EducationalContentInput
) {
  if (!EDUCATIONAL_CATEGORIES.includes(input.category as (typeof EDUCATIONAL_CATEGORIES)[number])) {
    throw ApiError.badRequest("Invalid education category");
  }

  const content = new EducationalContent({
    title: input.title,
    body: input.body,
    category: input.category,
    tags: input.tags ?? [],
    isActive: input.isActive ?? true,
    createdBy,
  });
  await content.save();

  return toDto(content, Language.EN);
}

export async function listContent(
  page: number,
  limit: number,
  category?: string,
  lang?: Language
) {
  const filter: Record<string, unknown> = { isActive: true };
  if (category) filter.category = category;

  const total = await EducationalContent.countDocuments(filter);
  const items = await EducationalContent.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  const normalizedLang = normalizeLang(lang);
  return {
    items: items.map((item) => toDto(item, normalizedLang)),
    total,
  };
}

export async function getContent(contentId: string, lang?: Language) {
  validateId(contentId);
  const content = await EducationalContent.findById(contentId);
  if (!content || !content.isActive) {
    throw ApiError.notFound("Educational content not found");
  }
  return toDto(content, normalizeLang(lang));
}

export async function adminListContent(
  role: string,
  page: number,
  limit: number
) {
  if (role !== "ADMIN") throw ApiError.forbidden();
  const total = await EducationalContent.countDocuments();
  const items = await EducationalContent.find()
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);
  return { items: items.map((i) => toDto(i, Language.EN)), total };
}

export async function updateContent(
  role: string,
  contentId: string,
  input: Partial<EducationalContentInput>
) {
  if (role !== "ADMIN") throw ApiError.forbidden();
  validateId(contentId);
  const content = await EducationalContent.findById(contentId);
  if (!content) throw ApiError.notFound("Educational content not found");

  if (input.title) content.title = input.title;
  if (input.body) content.body = input.body;
  if (input.category) content.category = input.category;
  if (input.tags) content.tags = input.tags;
  if (input.isActive !== undefined) content.isActive = input.isActive;
  await content.save();
  return toDto(content, Language.EN);
}

function normalizeLang(lang?: Language): Language {
  return lang && (lang === Language.EN || lang === Language.HI || lang === Language.KN)
    ? lang
    : Language.EN;
}

function validateId(id: string): void {
  if (!isValidObjectId(id)) throw ApiError.badRequest("Invalid id format");
}

function toDto(content: InstanceType<typeof EducationalContent>, lang: Language) {
  return {
    id: content._id,
    title: content.title[lang] ?? content.title[Language.EN],
    body: content.body[lang] ?? content.body[Language.EN],
    availableLanguages: Object.keys(content.title),
    category: content.category,
    tags: content.tags,
    isActive: content.isActive,
    createdAt: content.createdAt,
    updatedAt: content.updatedAt,
  };
}