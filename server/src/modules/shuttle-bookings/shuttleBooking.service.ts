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