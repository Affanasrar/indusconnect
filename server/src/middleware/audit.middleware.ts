import { Request, Response, NextFunction } from "express";
import { AuditAction, AuditEntity } from "@prisma/client";
import prisma from "../config/prisma";

function maskSensitiveData(data: unknown): unknown {
  if (!data || typeof data !== "object") {
    return data;
  }

  const sensitiveKeys = [
    "password",
    "token",
    "authorization",
    "jwt",
    "jwtSecret",
    "secret",
  ];

  if (Array.isArray(data)) {
    return data.map(maskSensitiveData);
  }

  const masked: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    if (sensitiveKeys.includes(key.toLowerCase())) {
      masked[key] = "***MASKED***";
    } else if (typeof value === "object" && value !== null) {
      masked[key] = maskSensitiveData(value);
    } else {
      masked[key] = value;
    }
  }

  return masked;
}

function shouldAuditRequest(method: string, path: string) {
  const auditedMethods = ["POST", "PUT", "PATCH", "DELETE"];

  if (!auditedMethods.includes(method)) {
    return false;
  }

  if (path.startsWith("/uploads")) {
    return false;
  }

  return true;
}

function getAction(method: string, path: string): AuditAction {
  if (path.includes("/auth/login")) return AuditAction.LOGIN;
  if (path.includes("/approve")) return AuditAction.APPROVE;
  if (path.includes("/reject")) return AuditAction.REJECT;
  if (path.includes("/cancel")) return AuditAction.CANCEL;
  if (path.includes("/assign")) return AuditAction.ASSIGN;
  if (path.includes("/check-in")) return AuditAction.CHECK_IN;
  if (path.includes("/check-out")) return AuditAction.CHECK_OUT;
  if (path.includes("/export")) return AuditAction.EXPORT;
  if (path.includes("/flag")) return AuditAction.FLAG;
  if (path.includes("/start")) return AuditAction.START_TRIP;
  if (path.includes("/end")) return AuditAction.END_TRIP;
  if (path.includes("/report-issue")) return AuditAction.REPORT_ISSUE;

  if (method === "POST") return AuditAction.CREATE;
  if (method === "PATCH" || method === "PUT") return AuditAction.UPDATE;
  if (method === "DELETE") return AuditAction.DELETE;

  return AuditAction.SYSTEM;
}

function getEntity(path: string): AuditEntity {
  if (path.includes("/api/auth")) return AuditEntity.AUTH;
  if (path.includes("/api/users")) return AuditEntity.USER;
  if (path.includes("/api/vehicles")) return AuditEntity.VEHICLE;
  if (path.includes("/api/drivers")) return AuditEntity.DRIVER;
  if (path.includes("/api/telemetry")) return AuditEntity.TELEMETRY;

  if (path.includes("/api/routes") && path.includes("/stops")) {
    return AuditEntity.SMART_STOP;
  }

  if (path.includes("/api/routes")) return AuditEntity.ROUTE;
  if (path.includes("/api/shuttle-bookings")) return AuditEntity.SHUTTLE_BOOKING;
  if (path.includes("/api/travel-requests")) return AuditEntity.TRAVEL_REQUEST;

  if (path.includes("/api/accommodation/rooms")) return AuditEntity.ROOM;

  if (path.includes("/api/accommodation/reservations")) {
    return AuditEntity.ROOM_RESERVATION;
  }

  if (path.includes("/api/expenses")) return AuditEntity.EXPENSE_CLAIM;
  if (path.includes("/api/driver-trips")) return AuditEntity.TRANSPORT_TRIP;
  if (path.includes("/api/reports")) return AuditEntity.REPORT;

  return AuditEntity.SYSTEM;
}

function extractEntityId(path: string) {
  const uuidRegex =
    /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}/;

  const match = path.match(uuidRegex);

  return match ? match[0] : undefined;
}

export function auditMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!shouldAuditRequest(req.method, req.path)) {
    return next();
  }

  let responseMessage: string | undefined;

  const originalJson = res.json.bind(res);

  res.json = (body: any) => {
    if (body?.message) {
      responseMessage = body.message;
    }

    return originalJson(body);
  };

  res.on("finish", async () => {
    try {
      const currentUser = (req as any).user;

      await prisma.auditLog.create({
        data: {
          actorId: currentUser?.userId,
          actorEmail: currentUser?.email ?? req.body?.email,
          actorRole: currentUser?.role,

          action: getAction(req.method, req.path),
          entity: getEntity(req.path),
          entityId: extractEntityId(req.path),

          method: req.method,
          path: req.originalUrl,
          statusCode: res.statusCode,

          ipAddress: req.ip,
          userAgent: req.headers["user-agent"],

          requestBody: maskSensitiveData(req.body) as any,
          responseMessage,
          description: `${req.method} ${req.originalUrl} completed with status ${res.statusCode}`,
        },
      });
    } catch (error) {
      console.error("Audit log failed:", error);
    }
  });

  next();
}