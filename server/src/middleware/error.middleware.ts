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
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error("Unhandled error:", error);

  return res.status(500).json({
    success: false,
    message: "Internal server error",
  });
}