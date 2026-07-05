import {
  NotificationPriority,
  NotificationStatus,
  NotificationType,
  RoleName,
} from "@prisma/client";
import prisma from "../../config/prisma";
import {
  CreateBulkNotificationInput,
  CreateNotificationInput,
} from "./notification.validation";

const notificationInclude = {
  recipient: {
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      role: {
        select: {
          name: true,
        },
      },
    },
  },
  createdBy: {
    select: {
      id: true,
      fullName: true,
      email: true,
      role: {
        select: {
          name: true,
        },
      },
    },
  },
};

export async function createNotification(
  createdById: string | undefined,
  data: CreateNotificationInput
) {
  const recipient = await prisma.user.findUnique({
    where: {
      id: data.recipientId,
    },
  });

  if (!recipient) {
    throw new Error("Recipient user not found");
  }

  return prisma.notification.create({
    data: {
      recipientId: data.recipientId,
      createdById,
      type: data.type,
      priority: data.priority ?? NotificationPriority.NORMAL,
      title: data.title,
      message: data.message,
      entityType: data.entityType,
      entityId: data.entityId,
    },
    include: notificationInclude,
  });
}

export async function createBulkNotifications(
  createdById: string | undefined,
  data: CreateBulkNotificationInput
) {
  const users = await prisma.user.findMany({
    where: {
      id: {
        in: data.recipientIds,
      },
    },
  });

  if (users.length !== data.recipientIds.length) {
    throw new Error("One or more recipient users were not found");
  }

  await prisma.notification.createMany({
    data: data.recipientIds.map((recipientId) => ({
      recipientId,
      createdById,
      type: data.type,
      priority: data.priority ?? NotificationPriority.NORMAL,
      title: data.title,
      message: data.message,
      entityType: data.entityType,
      entityId: data.entityId,
    })),
  });

  return prisma.notification.findMany({
    where: {
      recipientId: {
        in: data.recipientIds,
      },
      title: data.title,
      message: data.message,
    },
    include: notificationInclude,
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function createNotificationForRoles(params: {
  roleNames: RoleName[];
  type: NotificationType;
  priority?: NotificationPriority;
  title: string;
  message: string;
  entityType?: string;
  entityId?: string;
  createdById?: string;
}) {
  const users = await prisma.user.findMany({
    where: {
      role: {
        name: {
          in: params.roleNames,
        },
      },
    },
    select: {
      id: true,
    },
  });

  if (users.length === 0) {
    return [];
  }

  await prisma.notification.createMany({
    data: users.map((user) => ({
      recipientId: user.id,
      createdById: params.createdById,
      type: params.type,
      priority: params.priority ?? NotificationPriority.NORMAL,
      title: params.title,
      message: params.message,
      entityType: params.entityType,
      entityId: params.entityId,
    })),
  });

  return prisma.notification.findMany({
    where: {
      recipientId: {
        in: users.map((user) => user.id),
      },
      title: params.title,
      message: params.message,
    },
    include: notificationInclude,
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getMyNotifications(userId: string) {
  return prisma.notification.findMany({
    where: {
      recipientId: userId,
    },
    include: notificationInclude,
    orderBy: {
      createdAt: "desc",
    },
    take: 100,
  });
}

export async function getMyUnreadNotifications(userId: string) {
  return prisma.notification.findMany({
    where: {
      recipientId: userId,
      status: NotificationStatus.UNREAD,
    },
    include: notificationInclude,
    orderBy: {
      createdAt: "desc",
    },
    take: 100,
  });
}

export async function getAllNotifications() {
  return prisma.notification.findMany({
    include: notificationInclude,
    orderBy: {
      createdAt: "desc",
    },
    take: 300,
  });
}

export async function getNotificationById(id: string) {
  const notification = await prisma.notification.findUnique({
    where: {
      id,
    },
    include: notificationInclude,
  });

  if (!notification) {
    throw new Error("Notification not found");
  }

  return notification;
}

export async function markNotificationAsRead(id: string, userId: string) {
  const notification = await getNotificationById(id);

  if (notification.recipientId !== userId) {
    throw new Error("You can only mark your own notification as read");
  }

  return prisma.notification.update({
    where: {
      id,
    },
    data: {
      status: NotificationStatus.READ,
      readAt: new Date(),
    },
    include: notificationInclude,
  });
}

export async function markAllMyNotificationsAsRead(userId: string) {
  await prisma.notification.updateMany({
    where: {
      recipientId: userId,
      status: NotificationStatus.UNREAD,
    },
    data: {
      status: NotificationStatus.READ,
      readAt: new Date(),
    },
  });

  return prisma.notification.findMany({
    where: {
      recipientId: userId,
    },
    include: notificationInclude,
    orderBy: {
      createdAt: "desc",
    },
    take: 100,
  });
}

export async function getMyNotificationSummary(userId: string) {
  const [total, unread, urgent] = await Promise.all([
    prisma.notification.count({
      where: {
        recipientId: userId,
      },
    }),
    prisma.notification.count({
      where: {
        recipientId: userId,
        status: NotificationStatus.UNREAD,
      },
    }),
    prisma.notification.count({
      where: {
        recipientId: userId,
        status: NotificationStatus.UNREAD,
        priority: NotificationPriority.URGENT,
      },
    }),
  ]);

  return {
    total,
    unread,
    urgent,
  };
}