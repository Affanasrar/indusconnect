import type { UserProfile } from "./frontend";

export type AuditAction =
  | "LOGIN"
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "APPROVE"
  | "REJECT"
  | "CANCEL"
  | "ASSIGN"
  | "CHECK_IN"
  | "CHECK_OUT"
  | "EXPORT"
  | "FLAG"
  | "START_TRIP"
  | "END_TRIP"
  | "REPORT_ISSUE"
  | "SYSTEM";

export type AuditEntity =
  | "AUTH"
  | "USER"
  | "VEHICLE"
  | "DRIVER"
  | "ROUTE"
  | "SMART_STOP"
  | "SHUTTLE_BOOKING"
  | "TRAVEL_REQUEST"
  | "ROOM"
  | "ROOM_RESERVATION"
  | "EXPENSE_CLAIM"
  | "TRANSPORT_TRIP"
  | "REPORT"
  | "VENDOR"
  | "TELEMETRY"
  | "NOTIFICATION"
  | "PROXY_BOOKING"
  | "POLICY_RULE"
  | "MAINTENANCE_TASK"
  | "HOUSEKEEPING_TASK"
  | "ERP_EXPORT"
  | "SYSTEM";

export interface AuditLog {
  id: string;
  actorId?: string | null;
  actor?: UserProfile | null;
  actorEmail?: string | null;
  actorRole?: string | null;
  action: AuditAction;
  entity: AuditEntity;
  entityId?: string | null;
  method?: string | null;
  path?: string | null;
  statusCode?: number | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  requestBody?: any;
  responseMessage?: string | null;
  description?: string | null;
  createdAt: string;
}
