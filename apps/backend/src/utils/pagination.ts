import { ApiError } from "./ApiError";

export interface PaginationOptions {
  page: number;
  limit: number;
  skip: number;
}

export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;

export function parsePagination(query: Record<string, unknown>): PaginationOptions {
  const rawPage = typeof query.page === "string" ? query.page : undefined;
  const rawLimit = typeof query.limit === "string" ? query.limit : undefined;

  const page = rawPage ? parseInt(rawPage, 10) : DEFAULT_PAGE;
  const limit = rawLimit ? parseInt(rawLimit, 10) : DEFAULT_LIMIT;

  if (Number.isNaN(page) || page < 1) {
    throw ApiError.badRequest("page must be a positive integer", {
      field: "page",
    });
  }
  if (Number.isNaN(limit) || limit < 1) {
    throw ApiError.badRequest("limit must be a positive integer", {
      field: "limit",
    });
  }

  const cappedLimit = Math.min(limit, MAX_LIMIT);
  return { page, limit: cappedLimit, skip: (page - 1) * cappedLimit };
}