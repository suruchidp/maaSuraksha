export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(
    statusCode: number,
    message: string,
    code: string,
    details?: unknown
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = "Bad request", details?: unknown): ApiError {
    return new ApiError(400, message, "BAD_REQUEST", details);
  }

  static unauthorized(message = "Authentication required"): ApiError {
    return new ApiError(401, message, "UNAUTHORIZED");
  }

  static forbidden(message = "Insufficient permissions"): ApiError {
    return new ApiError(403, message, "FORBIDDEN");
  }

  static notFound(message = "Resource not found"): ApiError {
    return new ApiError(404, message, "NOT_FOUND");
  }

  static conflict(message = "Resource already exists"): ApiError {
    return new ApiError(409, message, "CONFLICT");
  }

  static tooManyRequests(message = "Too many requests"): ApiError {
    return new ApiError(429, message, "TOO_MANY_REQUESTS");
  }

  static internal(message = "Internal server error"): ApiError {
    return new ApiError(500, message, "INTERNAL_ERROR");
  }
}