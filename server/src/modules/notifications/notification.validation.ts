import {
  NotificationPriority,
  NotificationType,
} from "@prisma/client";
import { z } from "zod";

export const createNotificationSchema = z.object({
  recipientId: z.string().uuid("Valid recipientId is required"),
  type: z.nativeEnum(NotificationType),
  priority: z.nativeEnum(NotificationPriority).optional(),
  title: z.string().min(2, "Title is required"),
  message: z.string().min(2, "Message is required"),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
});

export const createBulkNotificationSchema = z.object({
  recipientIds: z
    .array(z.string().uuid("Valid recipientId is required"))
    .min(1, "At least one recipient is required"),
  type: z.nativeEnum(NotificationType),
  priority: z.nativeEnum(NotificationPriority).optional(),
  title: z.string().min(2, "Title is required"),
  message: z.string().min(2, "Message is required"),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
});

export type CreateNotificationInput = z.infer<
  typeof createNotificationSchema
>;

export type CreateBulkNotificationInput = z.infer<
  typeof createBulkNotificationSchema
>;