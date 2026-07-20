import { 
  ShuttleBookingStatus,
  NotificationPriority,
  NotificationType,
 } from "@prisma/client";
import { createNotification } from "../notifications/notification.service";
import prisma from "../../config/prisma";
import { geocodeAddress, calculateHaversineDistance } from "../../utils/geocoder";
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
  data: CreateShuttleBookingInput & { latitude?: number; longitude?: number }
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

  const bookingDate = new Date(data.bookingDate);
  const startOfDay = new Date(new Date(data.bookingDate).setHours(0, 0, 0, 0));
  const endOfDay = new Date(new Date(data.bookingDate).setHours(23, 59, 59, 999));

  // Determine user coordinates (from Leaflet Map pin or geocoded pickup name)
  let userLat = data.latitude;
  let userLon = data.longitude;
  if (userLat === undefined || userLon === undefined || userLat === null || userLon === null) {
    const coords = await geocodeAddress(data.pickupArea);
    if (coords) {
      userLat = coords.latitude;
      userLon = coords.longitude;
    }
  }

  let assignedRouteId: string | null = null;
  let assignedStopId: string | null = null;
  let assignedSeatNumber: string | null = null;
  let bookingStatus: ShuttleBookingStatus = ShuttleBookingStatus.PENDING;
  let autoRouteRemarks: string | null = data.remarks || null;

  // Auto-routing logic
  if (userLat !== undefined && userLon !== undefined && userLat !== null && userLon !== null) {
    const activeRoutes = await prisma.transportRoute.findMany({
      where: {
        shiftType: data.shiftType,
        status: { not: "CANCELLED" },
      },
      include: {
        smartStops: true,
        vehicle: true,
      },
    });

    let closestStop: any = null;
    let closestRoute: any = null;
    let minDistance = Infinity;

    for (const route of activeRoutes) {
      for (const stop of route.smartStops) {
        if (stop.latitude !== null && stop.longitude !== null) {
          const dist = calculateHaversineDistance(
            userLat,
            userLon,
            stop.latitude,
            stop.longitude
          );
          if (dist < minDistance) {
            minDistance = dist;
            closestStop = stop;
            closestRoute = route;
          }
        }
      }
    }

    // Distance match constraint: 2.5 kilometers
    if (closestStop && closestRoute && minDistance <= 2.5) {
      const bookingsOnRoute = await prisma.shuttleBooking.findMany({
        where: {
          routeId: closestRoute.id,
          bookingDate: {
            gte: startOfDay,
            lte: endOfDay,
          },
          status: { not: "CANCELLED" },
        },
      });

      const maxCapacity = closestRoute.vehicle?.capacity || 20;

      if (bookingsOnRoute.length < maxCapacity) {
        assignedRouteId = closestRoute.id;
        assignedStopId = closestStop.id;
        bookingStatus = ShuttleBookingStatus.ASSIGNED;

        // Allocate seat number sequentially
        const bookedSeats = bookingsOnRoute
          .map((b) => b.seatNumber)
          .filter((s): s is string => !!s);
        
        let seatNum = 1;
        while (bookedSeats.includes(`Seat-${seatNum.toString().padStart(2, "0")}`)) {
          seatNum++;
        }
        assignedSeatNumber = `Seat-${seatNum.toString().padStart(2, "0")}`;

        autoRouteRemarks = `Auto-approved by Engine (Closest Stop: ${
          closestStop.stopName
        }, Distance: ${minDistance.toFixed(2)} km)${data.remarks ? " - " + data.remarks : ""}`;
      } else {
        autoRouteRemarks = `Proximity matched to Route ${
          closestRoute.routeName
        } but vehicle is at maximum capacity.${data.remarks ? " - " + data.remarks : ""}`;
      }
    }
  }

  const booking = await prisma.shuttleBooking.create({
    data: {
      employeeId,
      routeId: assignedRouteId,
      pickupStopId: assignedStopId,
      bookingDate,
      shiftType: data.shiftType,
      pickupArea: data.pickupArea,
      pickupAddress: data.pickupAddress,
      seatNumber: assignedSeatNumber,
      status: bookingStatus,
      remarks: autoRouteRemarks,
    },
    include: bookingInclude,
  });

  // Dispatch notification for auto-approvals
  if (bookingStatus === ShuttleBookingStatus.ASSIGNED) {
    await createNotification(undefined, {
      recipientId: employeeId,
      type: NotificationType.SHUTTLE,
      priority: NotificationPriority.HIGH,
      title: "Shuttle Ride Auto-Approved",
      message: `Your shuttle ride is confirmed on Route: ${
        booking.route?.routeName ?? "N/A"
      }. Assigned seat: ${assignedSeatNumber ?? "N/A"}.`,
      entityType: "ShuttleBooking",
      entityId: booking.id,
    });
  }

  return booking;
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

      const bookingsOnRoute = await prisma.shuttleBooking.findMany({
        where: {
          routeId: data.routeId,
          bookingDate: {
            gte: startOfTomorrow,
            lte: endOfTomorrow,
          },
          status: { not: "CANCELLED" },
        },
      });

      const route = await prisma.transportRoute.findUnique({
        where: { id: data.routeId },
        include: { vehicle: true },
      });

      const maxCapacity = route?.vehicle?.capacity || 20;

      let status: ShuttleBookingStatus = ShuttleBookingStatus.PENDING;
      let seatNumber: string | null = null;
      let remarks = "Auto-generated from active commute subscription";

      if (bookingsOnRoute.length < maxCapacity) {
        status = ShuttleBookingStatus.ASSIGNED;
        const bookedSeats = bookingsOnRoute
          .map((b) => b.seatNumber)
          .filter((s): s is string => !!s);
        
        let seatNum = 1;
        while (bookedSeats.includes(`Seat-${seatNum.toString().padStart(2, "0")}`)) {
          seatNum++;
        }
        seatNumber = `Seat-${seatNum.toString().padStart(2, "0")}`;
        remarks = `Auto-approved from subscription (Seat: ${seatNumber})`;
      }

      await prisma.shuttleBooking.create({
        data: {
          employeeId,
          routeId: data.routeId,
          pickupStopId: data.pickupStopId,
          bookingDate: startOfTomorrow,
          shiftType: data.shiftType,
          pickupArea: stop?.stopName ?? "Stop",
          pickupAddress: stop?.stopName ?? "Stop",
          seatNumber,
          remarks,
          isProxyBooking: data.isProxyBooking ?? false,
          proxyCreatedById: data.proxyCreatedById,
          proxyReason: data.proxyReason,
          status,
        },
      });

      // Dispatch alert for auto-approved subscriptions
      if (status === ShuttleBookingStatus.ASSIGNED) {
        await createNotification(undefined, {
          recipientId: employeeId,
          type: NotificationType.SHUTTLE,
          priority: NotificationPriority.HIGH,
          title: "Subscription Shuttle Seat Reserved",
          message: `Your standing subscription has auto-booked your seat (${seatNumber}) on Route: ${
            route?.routeName ?? "N/A"
          } for tomorrow.`,
          entityType: "ShuttleBooking",
          entityId: "StandingSubscription",
        });
      }
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

        const bookingsOnRoute = await prisma.shuttleBooking.findMany({
          where: {
            routeId: sub.routeId,
            bookingDate: {
              gte: startOfTarget,
              lte: endOfTarget,
            },
            status: { not: "CANCELLED" },
          },
        });

        const route = await prisma.transportRoute.findUnique({
          where: { id: sub.routeId },
          include: { vehicle: true },
        });

        const maxCapacity = route?.vehicle?.capacity || 20;

        let status: ShuttleBookingStatus = ShuttleBookingStatus.PENDING;
        let seatNumber: string | null = null;
        let remarks = "Auto-generated from active commute subscription";

        if (bookingsOnRoute.length < maxCapacity) {
          status = ShuttleBookingStatus.ASSIGNED;
          const bookedSeats = bookingsOnRoute
            .map((b) => b.seatNumber)
            .filter((s): s is string => !!s);
          
          let seatNum = 1;
          while (bookedSeats.includes(`Seat-${seatNum.toString().padStart(2, "0")}`)) {
            seatNum++;
          }
          seatNumber = `Seat-${seatNum.toString().padStart(2, "0")}`;
          remarks = `Auto-approved from subscription (Seat: ${seatNumber})`;
        }

        const newBooking = await prisma.shuttleBooking.create({
          data: {
            employeeId: sub.employeeId,
            routeId: sub.routeId,
            pickupStopId: sub.pickupStopId,
            bookingDate: startOfTarget,
            shiftType: sub.shiftType,
            pickupArea: stop?.stopName ?? "Stop",
            pickupAddress: stop?.stopName ?? "Stop",
            seatNumber,
            remarks,
            isProxyBooking: sub.isProxyBooking,
            proxyCreatedById: sub.proxyCreatedById,
            proxyReason: sub.proxyReason,
            status,
          },
        });

        // Dispatch alert for auto-approved daily subscription booking
        if (status === ShuttleBookingStatus.ASSIGNED) {
          await createNotification(undefined, {
            recipientId: sub.employeeId,
            type: NotificationType.SHUTTLE,
            priority: NotificationPriority.HIGH,
            title: "Daily Commute Seat Reserved",
            message: `Your standing subscription has auto-confirmed seat: ${seatNumber} on Route: ${
              route?.routeName ?? "N/A"
            } for today.`,
            entityType: "ShuttleBooking",
            entityId: newBooking.id,
          });
        }

        createdCount++;
      }
    }
  }

  return createdCount;
}