import { NextFunction, Request, Response } from "express";

export function notFoundMiddleware(
  req: Request,
  res: Response,
  _next: NextFunction
) {
  return res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}

export function globalErrorMiddleware(
  error: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error("Unhandled error:", error);

  const statusCode =
    typeof error.statusCode === "number"
      ? error.statusCode
      : typeof error.status === "number"
      ? error.status
      : 500;

  const message =
    error.expose && error.message
      ? error.message
      : error.name === "ZodError"
      ? "Validation failed"
      : error.message || "Internal server error";

  return res.status(statusCode).json({
    success: false,
    message,
    ...(error.errors && { errors: error.errors }),
  });
}