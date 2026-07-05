import { Request, Response } from "express";
import {
  createBulkNotificationSchema,
  createNotificationSchema,
} from "./notification.validation";
import {
  createBulkNotifications,
  createNotification,
  getAllNotifications,
  getMyNotificationSummary,
  getMyNotifications,
  getMyUnreadNotifications,
  getNotificationById,
  markAllMyNotificationsAsRead,
  markNotificationAsRead,
} from "./notification.service";

export async function createNotificationController(
  req: Request,
  res: Response
) {
  try {
    const currentUser = (req as any).user;
    const validatedData = createNotificationSchema.parse(req.body);

    const notification = await createNotification(
      currentUser.userId,
      validatedData
    );

    return res.status(201).json({
      success: true,
      message: "Notification created successfully",
      data: notification,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to create notification",
    });
  }
}

export async function createBulkNotificationController(
  req: Request,
  res: Response
) {
  try {
    const currentUser = (req as any).user;
    const validatedData = createBulkNotificationSchema.parse(req.body);

    const notifications = await createBulkNotifications(
      currentUser.userId,
      validatedData
    );

    return res.status(201).json({
      success: true,
      message: "Bulk notifications created successfully",
      data: notifications,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to create bulk notifications",
    });
  }
}

export async function getMyNotificationsController(
  req: Request,
  res: Response
) {
  try {
    const currentUser = (req as any).user;

    const notifications = await getMyNotifications(currentUser.userId);

    return res.status(200).json({
      success: true,
      message: "My notifications fetched successfully",
      data: notifications,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch my notifications",
    });
  }
}

export async function getMyUnreadNotificationsController(
  req: Request,
  res: Response
) {
  try {
    const currentUser = (req as any).user;

    const notifications = await getMyUnreadNotifications(currentUser.userId);

    return res.status(200).json({
      success: true,
      message: "Unread notifications fetched successfully",
      data: notifications,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch unread notifications",
    });
  }
}

export async function getMyNotificationSummaryController(
  req: Request,
  res: Response
) {
  try {
    const currentUser = (req as any).user;

    const summary = await getMyNotificationSummary(currentUser.userId);

    return res.status(200).json({
      success: true,
      message: "Notification summary fetched successfully",
      data: summary,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch notification summary",
    });
  }
}

export async function getAllNotificationsController(
  _req: Request,
  res: Response
) {
  try {
    const notifications = await getAllNotifications();

    return res.status(200).json({
      success: true,
      message: "Notifications fetched successfully",
      data: notifications,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to fetch notifications",
    });
  }
}

export async function getNotificationByIdController(
  req: Request,
  res: Response
) {
  try {
    const notification = await getNotificationById(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Notification fetched successfully",
      data: notification,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Notification not found",
    });
  }
}

export async function markNotificationAsReadController(
  req: Request,
  res: Response
) {
  try {
    const currentUser = (req as any).user;

    const notification = await markNotificationAsRead(
      req.params.id,
      currentUser.userId
    );

    return res.status(200).json({
      success: true,
      message: "Notification marked as read successfully",
      data: notification,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to mark notification as read",
    });
  }
}

export async function markAllMyNotificationsAsReadController(
  req: Request,
  res: Response
) {
  try {
    const currentUser = (req as any).user;

    const notifications = await markAllMyNotificationsAsRead(
      currentUser.userId
    );

    return res.status(200).json({
      success: true,
      message: "All notifications marked as read successfully",
      data: notifications,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to mark all notifications as read",
    });
  }
}