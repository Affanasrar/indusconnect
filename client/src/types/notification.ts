import type { UserProfile } from "./frontend";

export type NotificationType =
  | "SYSTEM"
  | "SHUTTLE"
  | "TRAVEL_REQUEST"
  | "ACCOMMODATION"
  | "EXPENSE"
  | "TELEMETRY"
  | "SOS"
  | "VENDOR";

export type NotificationPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";

export type NotificationStatus = "UNREAD" | "READ";

export interface Notification {
  id: string;
  recipientId: string;
  recipient?: UserProfile;
  createdById?: string | null;
  createdBy?: UserProfile | null;
  type: NotificationType;
  priority: NotificationPriority;
  status: NotificationStatus;
  title: string;
  message: string;
  entityType?: string | null;
  entityId?: string | null;
  readAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationSummary {
  total: number;
  unread: number;
  urgent: number;
}
