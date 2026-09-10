import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError";

export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

function handleZodError(error: ZodError): ApiError {
  const details = error.errors.map((e) => ({
    field: e.path.join("."),
    message: e.message,
  }));
  return ApiError.badRequest("Validation failed", details);
}

function handleMongooseError(error: mongoose.Error): ApiError {
  if (error instanceof mongoose.Error.ValidationError) {
    const details = Object.values(error.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return ApiError.badRequest("Validation failed", details);
  }
  return ApiError.internal();
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof ApiError) {
    const body: Record<string, unknown> = {
      success: false,
      error: {
        code: err.code,
        message: err.message,
      },
    };
    if (err.details !== undefined) {
      (body.error as Record<string, unknown>).details = err.details;
    }
    res.status(err.statusCode).json(body);
    return;
  }

  if (err instanceof ZodError) {
    const apiError = handleZodError(err);
    res.status(apiError.statusCode).json({
      success: false,
      error: { code: apiError.code, message: apiError.message, details: apiError.details },
    });
    return;
  }

  if (err instanceof mongoose.Error) {
    const apiError = handleMongooseError(err);
    res.status(apiError.statusCode).json({
      success: false,
      error: { code: apiError.code, message: apiError.message, details: apiError.details },
    });
    return;
  }

  if (
    err instanceof Error &&
    "code" in err &&
    (err as { code?: string | number }).code === 11000
  ) {
    const e = ApiError.conflict("Resource already exists");
    res.status(e.statusCode).json({
      success: false,
      error: { code: e.code, message: e.message },
    });
    return;
  }

  if (process.env.NODE_ENV === "development") {
    console.error("Unhandled error:", err);
  }

  res.status(500).json({
    success: false,
    error: { code: "INTERNAL_ERROR", message: "Internal server error" },
  });
}