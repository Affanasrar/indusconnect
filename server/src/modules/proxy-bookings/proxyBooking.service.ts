import {
  NotificationPriority,
  NotificationType,
  RoleName,
} from "@prisma/client";
import prisma from "../../config/prisma";
import {
  ProxyShuttleBookingInput,
  ProxyTravelRequestInput,
} from "./proxyBooking.validation";
import { createNotification } from "../notifications/notification.service";

const travelRequestInclude = {
  employee: {
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
  approvedBy: {
    select: {
      id: true,
      fullName: true,
      email: true,
    },
  },
  proxyCreatedBy: {
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

const shuttleBookingInclude = {
  employee: {
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
      smartStops: true,
    },
  },
  pickupStop: true,
  proxyCreatedBy: {
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

async function validateEmployee(employeeId: string) {
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

  if (employee.role.name !== RoleName.EMPLOYEE) {
    throw new Error("Proxy booking can only be created for EMPLOYEE users");
  }

  return employee;
}

export async function createProxyTravelRequest(
  createdById: string,
  data: ProxyTravelRequestInput
) {
  const employee = await validateEmployee(data.employeeId);

  const travelRequest = await prisma.travelRequest.create({
    data: {
      employeeId: data.employeeId,
      travelType: data.travelType,
      urgency: data.urgency,
      purpose: data.purpose,
      fromLocation: data.fromLocation,
      toLocation: data.toLocation,
      departureDate: new Date(data.departureDate),
      returnDate: data.returnDate ? new Date(data.returnDate) : undefined,
      accommodationRequired: data.accommodationRequired,
      transportRequired: data.transportRequired,
      estimatedBudget: data.estimatedBudget,
      employeeRemarks: data.employeeRemarks,
      isProxyRequest: true,
      proxyCreatedById: createdById,
      proxyReason: data.proxyReason,
    },
    include: travelRequestInclude,
  });

  await createNotification(createdById, {
    recipientId: employee.id,
    type: NotificationType.TRAVEL_REQUEST,
    priority: NotificationPriority.HIGH,
    title: "Travel Request Created on Your Behalf",
    message: `A travel request from ${travelRequest.fromLocation} to ${travelRequest.toLocation} has been created on your behalf.`,
    entityType: "TravelRequest",
    entityId: travelRequest.id,
  });

  return travelRequest;
}

export async function createProxyShuttleBooking(
  createdById: string,
  data: ProxyShuttleBookingInput
) {
  const employee = await validateEmployee(data.employeeId);

  const booking = await prisma.shuttleBooking.create({
    data: {
      employeeId: data.employeeId,
      bookingDate: new Date(data.bookingDate),
      shiftType: data.shiftType,
      pickupArea: data.pickupArea,
      pickupAddress: data.pickupAddress,
      remarks: data.remarks,
      isProxyBooking: true,
      proxyCreatedById: createdById,
      proxyReason: data.proxyReason,
    },
    include: shuttleBookingInclude,
  });

  await createNotification(createdById, {
    recipientId: employee.id,
    type: NotificationType.SHUTTLE,
    priority: NotificationPriority.HIGH,
    title: "Shuttle Booking Created on Your Behalf",
    message: `A shuttle booking for ${booking.pickupArea} has been created on your behalf.`,
    entityType: "ShuttleBooking",
    entityId: booking.id,
  });

  return booking;
}

export async function getMyCreatedProxyRecords(createdById: string) {
  const [travelRequests, shuttleBookings] = await Promise.all([
    prisma.travelRequest.findMany({
      where: {
        proxyCreatedById: createdById,
        isProxyRequest: true,
      },
      include: travelRequestInclude,
      orderBy: {
        createdAt: "desc",
      },
    }),

    prisma.shuttleBooking.findMany({
      where: {
        proxyCreatedById: createdById,
        isProxyBooking: true,
      },
      include: shuttleBookingInclude,
      orderBy: {
        createdAt: "desc",
      },
    }),
  ]);

  return {
    travelRequests,
    shuttleBookings,
  };
}

export async function getAllProxyRecords() {
  const [travelRequests, shuttleBookings] = await Promise.all([
    prisma.travelRequest.findMany({
      where: {
        isProxyRequest: true,
      },
      include: travelRequestInclude,
      orderBy: {
        createdAt: "desc",
      },
    }),

    prisma.shuttleBooking.findMany({
      where: {
        isProxyBooking: true,
      },
      include: shuttleBookingInclude,
      orderBy: {
        createdAt: "desc",
      },
    }),
  ]);

  return {
    counts: {
      travelRequests: travelRequests.length,
      shuttleBookings: shuttleBookings.length,
      total: travelRequests.length + shuttleBookings.length,
    },
    travelRequests,
    shuttleBookings,
  };
}