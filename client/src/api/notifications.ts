import { http } from "./http";
import type { ApiResponse } from "../types/frontend";
import type {
  Notification,
  NotificationPriority,
  NotificationSummary,
  NotificationType,
} from "../types/notification";

export interface CreateNotificationInput {
  recipientId: string;
  type: NotificationType;
  priority?: NotificationPriority;
  title: string;
  message: string;
  entityType?: string;
  entityId?: string;
}

export interface CreateBulkNotificationInput {
  recipientIds: string[];
  type: NotificationType;
  priority?: NotificationPriority;
  title: string;
  message: string;
  entityType?: string;
  entityId?: string;
}

export async function getMyNotifications() {
  const response = await http.get<ApiResponse<Notification[]>>("/notifications/my");
  return response.data.data;
}

export async function getMyUnreadNotifications() {
  const response = await http.get<ApiResponse<Notification[]>>("/notifications/my/unread");
  return response.data.data;
}

export async function getMyNotificationSummary() {
  const response = await http.get<ApiResponse<NotificationSummary>>("/notifications/my/summary");
  return response.data.data;
}

export async function markAllMyNotificationsAsRead() {
  const patchResponse = await http.patch<ApiResponse<Notification[]>>("/notifications/my/read-all");
  return patchResponse.data.data;
}

export async function markNotificationAsRead(id: string) {
  const response = await http.patch<ApiResponse<Notification>>(`/notifications/${id}/read`);
  return response.data.data;
}

export async function createNotification(data: CreateNotificationInput) {
  const response = await http.post<ApiResponse<Notification>>("/notifications", data);
  return response.data.data;
}

export async function createBulkNotification(data: CreateBulkNotificationInput) {
  const response = await http.post<ApiResponse<Notification[]>>("/notifications/bulk", data);
  return response.data.data;
}

export async function getAllNotifications() {
  const response = await http.get<ApiResponse<Notification[]>>("/notifications");
  return response.data.data;
}

export async function getNotificationById(id: string) {
  const response = await http.get<ApiResponse<Notification>>(`/notifications/${id}`);
  return response.data.data;
}
