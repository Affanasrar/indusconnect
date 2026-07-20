import { 
  ShuttleBookingStatus,
  NotificationPriority,
  NotificationType,
 } from "@prisma/client";
import { createNotification } from "../notifications/notification.service";
import prisma from "../../config/prisma";
import {
  AssignShuttleBookingInput,
  CancelShuttleBookingInput,
  CreateShuttleBookingInput,
} from "./shuttleBooking.validation";

interface AuthUser {
  userId: string;
  email: string;
  role: string;
}

const bookingInclude = {
  employee: {
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      status: true,
      role: {
        select: {
          name: true,
        },
      },
    },
  },
  route: {
    include: {
      vehicle: true,
      driver: {
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
            },
          },
        },
      },
      smartStops: {
        orderBy: {
          stopOrder: "asc" as const,
        },
      },
    },
  },
  pickupStop: true,
};

export async function createShuttleBooking(
  employeeId: string,
  data: CreateShuttleBookingInput
) {
  const employee = await prisma.user.findUnique({
    where: {
      id: employeeId,
    },
    include: {
      role: true,
    },
  });

  if (!employee) {
    throw new Error("Employee not found");
  }

  return prisma.shuttleBooking.create({
    data: {
      employeeId,
      bookingDate: new Date(data.bookingDate),
      shiftType: data.shiftType,
      pickupArea: data.pickupArea,
      pickupAddress: data.pickupAddress,
      remarks: data.remarks,
    },
    include: bookingInclude,
  });
}

export async function getMyShuttleBookings(employeeId: string) {
  return prisma.shuttleBooking.findMany({
    where: {
      employeeId,
    },
    include: bookingInclude,
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getAllShuttleBookings() {
  return prisma.shuttleBooking.findMany({
    include: bookingInclude,
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getShuttleBookingById(id: string) {
  const booking = await prisma.shuttleBooking.findUnique({
    where: {
      id,
    },
    include: bookingInclude,
  });

  if (!booking) {
    throw new Error("Shuttle booking not found");
  }

  return booking;
}

export async function assignShuttleBooking(
  id: string,
  data: AssignShuttleBookingInput
) {
  await getShuttleBookingById(id);

  const route = await prisma.transportRoute.findUnique({
    where: {
      id: data.routeId,
    },
    include: {
      smartStops: true,
    },
  });

  if (!route) {
    throw new Error("Route not found");
  }

  if (data.pickupStopId) {
    const stop = await prisma.smartStop.findUnique({
      where: {
        id: data.pickupStopId,
      },
    });

    if (!stop) {
      throw new Error("Smart stop not found");
    }

    if (stop.routeId !== data.routeId) {
      throw new Error("Selected smart stop does not belong to this route");
    }
  }

  const updatedBooking = await prisma.shuttleBooking.update({
  where: {
    id,
  },
  data: {
    routeId: data.routeId,
    pickupStopId: data.pickupStopId,
    seatNumber: data.seatNumber,
    status: data.status ?? ShuttleBookingStatus.ASSIGNED,
    remarks: data.remarks,
  },
  include: bookingInclude,
});

await createNotification(undefined, {
  recipientId: updatedBooking.employeeId,
  type: NotificationType.SHUTTLE,
  priority: NotificationPriority.HIGH,
  title: "Shuttle Booking Assigned",
  message: `Your shuttle booking has been assigned. Seat: ${
    updatedBooking.seatNumber ?? "Not assigned"
  }.`,
  entityType: "ShuttleBooking",
  entityId: updatedBooking.id,
});

return updatedBooking;
}

export async function cancelShuttleBooking(
  id: string,
  currentUser: AuthUser,
  data: CancelShuttleBookingInput
) {
  const booking = await getShuttleBookingById(id);

  const isAdmin =
    currentUser.role === "SUPER_ADMIN" ||
    currentUser.role === "TRANSPORT_ADMIN";

  const isOwner = booking.employeeId === currentUser.userId;

  if (!isAdmin && !isOwner) {
    throw new Error("You can only cancel your own shuttle booking");
  }

  if (booking.status === ShuttleBookingStatus.COMPLETED) {
    throw new Error("Completed booking cannot be cancelled");
  }

  return prisma.shuttleBooking.update({
    where: {
      id,
    },
    data: {
      status: ShuttleBookingStatus.CANCELLED,
      remarks: data.remarks,
    },
    include: bookingInclude,
  });
}

// =========================================================================
// SHUTTLE RECURRING SUBSCRIPTION SERVICES
// =========================================================================

const subscriptionInclude = {
  employee: {
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
    },
  },
  route: true,
  pickupStop: true,
};

import { CreateShuttleSubscriptionInput } from "./shuttleBooking.validation";

export async function createShuttleSubscription(
  employeeId: string,
  data: CreateShuttleSubscriptionInput
) {
  const employee = await prisma.user.findUnique({
    where: { id: employeeId },
  });

  if (!employee) {
    throw new Error("Employee not found");
  }

  // Deactivate any active subscriptions first to prevent overlapping schedules
  await prisma.shuttleSubscription.updateMany({
    where: {
      employeeId,
      isActive: true,
    },
    data: {
      isActive: false,
    },
  });

  // Create new standing subscription
  const subscription = await prisma.shuttleSubscription.create({
    data: {
      employeeId,
      routeId: data.routeId,
      pickupStopId: data.pickupStopId,
      shiftType: data.shiftType,
      activeDays: data.activeDays,
      isProxyBooking: data.isProxyBooking ?? false,
      proxyCreatedById: data.proxyCreatedById,
      proxyReason: data.proxyReason,
    },
    include: subscriptionInclude,
  });

  // If tomorrow is one of the active days, pre-generate tomorrow's booking instantly
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowDayNum = tomorrow.getDay() === 0 ? 7 : tomorrow.getDay();

  if (data.activeDays.includes(tomorrowDayNum)) {
    const startOfTomorrow = new Date(tomorrow.setHours(0, 0, 0, 0));
    const endOfTomorrow = new Date(tomorrow.setHours(23, 59, 59, 999));

    const existing = await prisma.shuttleBooking.findFirst({
      where: {
        employeeId,
        bookingDate: {
          gte: startOfTomorrow,
          lte: endOfTomorrow,
        },
      },
    });

    if (!existing) {
      const stop = await prisma.smartStop.findUnique({
        where: { id: data.pickupStopId },
      });

      await prisma.shuttleBooking.create({
        data: {
          employeeId,
          routeId: data.routeId,
          pickupStopId: data.pickupStopId,
          bookingDate: startOfTomorrow,
          shiftType: data.shiftType,
          pickupArea: stop?.stopName ?? "Stop",
          pickupAddress: stop?.stopName ?? "Stop",
          remarks: "Auto-generated from active commute subscription",
          isProxyBooking: data.isProxyBooking ?? false,
          proxyCreatedById: data.proxyCreatedById,
          proxyReason: data.proxyReason,
          status: ShuttleBookingStatus.PENDING,
        },
      });
    }
  }

  return subscription;
}

export async function getMyShuttleSubscriptions(employeeId: string) {
  return prisma.shuttleSubscription.findMany({
    where: {
      employeeId,
      isActive: true,
    },
    include: subscriptionInclude,
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function deactivateShuttleSubscription(
  id: string,
  currentUser: AuthUser
) {
  const subscription = await prisma.shuttleSubscription.findUnique({
    where: { id },
  });

  if (!subscription) {
    throw new Error("Shuttle subscription not found");
  }

  const isAdmin =
    currentUser.role === "SUPER_ADMIN" ||
    currentUser.role === "TRANSPORT_ADMIN";

  const isOwner = subscription.employeeId === currentUser.userId;

  if (!isAdmin && !isOwner) {
    throw new Error("You can only cancel your own commute subscription");
  }

  // Deactivate subscription
  const updatedSub = await prisma.shuttleSubscription.update({
    where: { id },
    data: {
      isActive: false,
    },
    include: subscriptionInclude,
  });

  // Cancel tomorrow's generated booking if tomorrow is active
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const startOfTomorrow = new Date(tomorrow.setHours(0, 0, 0, 0));
  const endOfTomorrow = new Date(tomorrow.setHours(23, 59, 59, 999));

  await prisma.shuttleBooking.updateMany({
    where: {
      employeeId: subscription.employeeId,
      bookingDate: {
        gte: startOfTomorrow,
        lte: endOfTomorrow,
      },
      status: {
        in: [ShuttleBookingStatus.PENDING, ShuttleBookingStatus.ASSIGNED],
      },
    },
    data: {
      status: ShuttleBookingStatus.CANCELLED,
      remarks: "Commute pass subscription dropped by employee",
    },
  });

  return updatedSub;
}

// Nightly scheduler runner to trigger daily auto-bookings
export async function generateDailyBookingsFromSubscriptions(targetDate: Date = new Date()) {
  const targetDayNum = targetDate.getDay() === 0 ? 7 : targetDate.getDay();
  const startOfTarget = new Date(targetDate.setHours(0, 0, 0, 0));
  const endOfTarget = new Date(targetDate.setHours(23, 59, 59, 999));

  const activeSubs = await prisma.shuttleSubscription.findMany({
    where: {
      isActive: true,
    },
  });

  let createdCount = 0;

  for (const sub of activeSubs) {
    if (sub.activeDays.includes(targetDayNum)) {
      // Check if duplicate booking exists
      const existing = await prisma.shuttleBooking.findFirst({
        where: {
          employeeId: sub.employeeId,
          bookingDate: {
            gte: startOfTarget,
            lte: endOfTarget,
          },
        },
      });

      if (!existing) {
        const stop = await prisma.smartStop.findUnique({
          where: { id: sub.pickupStopId },
        });

        await prisma.shuttleBooking.create({
          data: {
            employeeId: sub.employeeId,
            routeId: sub.routeId,
            pickupStopId: sub.pickupStopId,
            bookingDate: startOfTarget,
            shiftType: sub.shiftType,
            pickupArea: stop?.stopName ?? "Stop",
            pickupAddress: stop?.stopName ?? "Stop",
            remarks: "Auto-generated from active commute subscription",
            isProxyBooking: sub.isProxyBooking,
            proxyCreatedById: sub.proxyCreatedById,
            proxyReason: sub.proxyReason,
            status: ShuttleBookingStatus.PENDING,
          },
        });

        createdCount++;
      }
    }
  }

  return createdCount;
}