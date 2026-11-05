import {
  NotificationPriority,
  NotificationType,
  RoleName,
  RouteStatus,
  ShuttleBookingStatus,
  TelemetrySource,
  TelemetryStatus,
  TripIssueType,
  TripStatus,
} from "@prisma/client";
import prisma from "../../config/prisma";
import {
  createNotification,
  createNotificationForRoles,
} from "../notifications/notification.service";
import { createVehicleMaintenanceTaskFromTelemetry } from "../maintenance/maintenance.service";
import {
  ReportIssueInput,
  SafetyChecklistInput,
} from "./driverTrip.validation";

const routeInclude = {
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
  shuttleBookings: {
    include: {
      employee: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
        },
      },
      pickupStop: true,
    },
    orderBy: {
      createdAt: "asc" as const,
    },
  },
  trips: {
    orderBy: {
      createdAt: "desc" as const,
    },
  },
};

async function getCurrentDriver(userId: string) {
  let driver = await prisma.driver.findUnique({
    where: {
      userId,
    },
    include: {
      user: true,
      vehicle: true,
    },
  });

  if (!driver) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (user && (user.role.name === "SUPER_ADMIN" || user.role.name === "TRANSPORT_ADMIN")) {
      driver = await prisma.driver.findFirst({
        include: {
          user: true,
          vehicle: true,
        },
      });
    }
  }

  if (!driver) {
    throw new Error("Driver profile not found for this user");
  }

  return driver;
}

async function getAssignedRouteForDriver(userId: string, routeId: string) {
  const driver = await getCurrentDriver(userId);

  const route = await prisma.transportRoute.findUnique({
    where: {
      id: routeId,
    },
    include: routeInclude,
  });

  if (!route) {
    throw new Error("Route not found");
  }

  if (route.driverId !== driver.id) {
    throw new Error("This route is not assigned to the current driver");
  }

  return { driver, route };
}

export async function getMyAssignedRoutes(userId: string) {
  const driver = await getCurrentDriver(userId);

  return prisma.transportRoute.findMany({
    where: {
      driverId: driver.id,
      status: {
        in: [RouteStatus.ACTIVE, RouteStatus.DRAFT],
      },
    },
    include: routeInclude,
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getMyRouteManifest(userId: string, routeId: string) {
  const { route } = await getAssignedRouteForDriver(userId, routeId);

  return route;
}

export async function submitSafetyChecklist(
  userId: string,
  routeId: string,
  data: SafetyChecklistInput
) {
  const { driver } = await getAssignedRouteForDriver(userId, routeId);

  if (
    !data.fuelChecked ||
    !data.tiresChecked ||
    !data.brakesChecked ||
    !data.lightsChecked
  ) {
    throw new Error("All safety checklist items must be checked before starting the trip");
  }

  const existingTrip = await prisma.transportTrip.findFirst({
    where: {
      routeId,
      driverId: driver.id,
      status: {
        not: TripStatus.COMPLETED,
      },
    },
  });

  if (existingTrip) {
    return prisma.transportTrip.update({
      where: {
        id: existingTrip.id,
      },
      data: {
        fuelChecked: data.fuelChecked,
        tiresChecked: data.tiresChecked,
        brakesChecked: data.brakesChecked,
        lightsChecked: data.lightsChecked,
        checklistSubmittedAt: new Date(),
        status: TripStatus.READY,
      },
      include: {
        route: true,
        driver: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  return prisma.transportTrip.create({
    data: {
      routeId,
      driverId: driver.id,
      fuelChecked: data.fuelChecked,
      tiresChecked: data.tiresChecked,
      brakesChecked: data.brakesChecked,
      lightsChecked: data.lightsChecked,
      checklistSubmittedAt: new Date(),
      status: TripStatus.READY,
    },
    include: {
      route: true,
      driver: {
        include: {
          user: true,
        },
      },
    },
  });
}

export async function startTrip(userId: string, routeId: string) {
  const { driver, route } = await getAssignedRouteForDriver(userId, routeId);

  const trip = await prisma.transportTrip.findFirst({
    where: {
      routeId,
      driverId: driver.id,
      status: TripStatus.READY,
    },
  });

  if (!trip) {
    throw new Error("Safety checklist must be completed before starting the trip");
  }

  const updatedTrip = await prisma.transportTrip.update({
    where: {
      id: trip.id,
    },
    data: {
      status: TripStatus.IN_PROGRESS,
      startedAt: new Date(),
    },
    include: {
      route: true,
      driver: {
        include: {
          user: true,
        },
      },
    },
  });

  const firstStop = route.smartStops?.[0];
  await prisma.vehicleTelemetryLog.create({
    data: {
      driverId: driver.id,
      vehicleId: route.vehicleId ?? driver.vehicleId ?? undefined,
      routeId: route.id,
      transportTripId: updatedTrip.id,
      latitude: firstStop?.latitude ?? 24.8607,
      longitude: firstStop?.longitude ?? 67.0011,
      speed: 25,
      heading: 0,
      status: TelemetryStatus.MOVING,
      source: TelemetrySource.MOBILE_GPS,
      remarks: firstStop
        ? `Trip started from ${firstStop.stopName}`
        : `Trip started on route ${route.routeName}`,
    },
  });

  // Notify all assigned passengers on this route that the driver has started the trip and live tracking is now active
  const assignedPassengers = (route.shuttleBookings ?? []).filter(
    (b) => b.status === ShuttleBookingStatus.ASSIGNED
  );
  const notifiedEmployeeIds = new Set<string>();

  for (const booking of assignedPassengers) {
    if (booking.employeeId && !notifiedEmployeeIds.has(booking.employeeId)) {
      notifiedEmployeeIds.add(booking.employeeId);
      await createNotification(userId, {
        recipientId: booking.employeeId,
        type: NotificationType.SHUTTLE,
        priority: NotificationPriority.HIGH,
        title: "Driver Started Your Trip — Live Tracking Active",
        message: `Captain ${driver.user.fullName} has started the trip on ${
          route.routeName
        } (${route.vehicle?.vehicleNumber ?? "Shuttle"}). Your vehicle is now active and live tracking is available in Book Shuttle Bus → My Rides.`,
        entityType: "TransportTrip",
        entityId: updatedTrip.id,
      });
    }
  }

  return updatedTrip;
}

export async function markPassengerBoarded(
  userId: string,
  routeId: string,
  bookingId: string
) {
  await getAssignedRouteForDriver(userId, routeId);

  const booking = await prisma.shuttleBooking.findUnique({
    where: {
      id: bookingId,
    },
  });

  if (!booking) {
    throw new Error("Shuttle booking not found");
  }

  if (booking.routeId !== routeId) {
    throw new Error("This passenger does not belong to the selected route");
  }

  return prisma.shuttleBooking.update({
    where: {
      id: bookingId,
    },
    data: {
      status: ShuttleBookingStatus.COMPLETED,
      remarks: "Passenger boarded successfully",
    },
  });
}

export async function markPassengerNoShow(
  userId: string,
  routeId: string,
  bookingId: string
) {
  await getAssignedRouteForDriver(userId, routeId);

  const booking = await prisma.shuttleBooking.findUnique({
    where: {
      id: bookingId,
    },
  });

  if (!booking) {
    throw new Error("Shuttle booking not found");
  }

  if (booking.routeId !== routeId) {
    throw new Error("This passenger does not belong to the selected route");
  }

  return prisma.shuttleBooking.update({
    where: {
      id: bookingId,
    },
    data: {
      status: ShuttleBookingStatus.NO_SHOW,
      remarks: "Passenger marked as no-show by driver",
    },
  });
}

export async function reportTripIssue(
  userId: string,
  routeId: string,
  data: ReportIssueInput
) {
  const { driver, route } = await getAssignedRouteForDriver(userId, routeId);

  const trip = await prisma.transportTrip.findFirst({
    where: {
      routeId,
      driverId: driver.id,
      status: {
        in: [TripStatus.READY, TripStatus.IN_PROGRESS],
      },
    },
  });

  if (!trip) {
    throw new Error("Trip must be ready or in progress before reporting an issue");
  }

  const lastLog = await prisma.vehicleTelemetryLog.findFirst({
    where: {
      driverId: driver.id,
      routeId,
    },
    orderBy: {
      recordedAt: "desc",
    },
  });

  const fallbackStop = route.smartStops?.[0];
  const issueLat =
    data.issueLatitude ?? lastLog?.latitude ?? fallbackStop?.latitude ?? 24.8607;
  const issueLng =
    data.issueLongitude ?? lastLog?.longitude ?? fallbackStop?.longitude ?? 67.0011;

  const updatedTrip = await prisma.transportTrip.update({
    where: {
      id: trip.id,
    },
    data: {
      issueType: data.issueType,
      issueDescription: data.issueDescription,
      issueLatitude: issueLat,
      issueLongitude: issueLng,
      issueReportedAt: new Date(),
    },
    include: {
      route: true,
      driver: {
        include: {
          user: true,
        },
      },
    },
  });

  const telemetryStatus =
    data.issueType === TripIssueType.SOS
      ? TelemetryStatus.SOS
      : data.issueType === TripIssueType.BREAKDOWN
      ? TelemetryStatus.BREAKDOWN
      : TelemetryStatus.DELAYED;

  const telemetryLog = await prisma.vehicleTelemetryLog.create({
    data: {
      driverId: driver.id,
      vehicleId: route.vehicleId ?? driver.vehicleId ?? undefined,
      routeId: route.id,
      transportTripId: trip.id,
      latitude: issueLat,
      longitude: issueLng,
      speed: telemetryStatus === TelemetryStatus.DELAYED ? 10 : 0,
      status: telemetryStatus,
      source: TelemetrySource.MOBILE_GPS,
      remarks: data.issueDescription,
    },
  });

  if (
    telemetryStatus === TelemetryStatus.SOS ||
    telemetryStatus === TelemetryStatus.BREAKDOWN
  ) {
    await createNotificationForRoles({
      roleNames: [
        RoleName.SUPER_ADMIN,
        RoleName.TRANSPORT_ADMIN,
        RoleName.SECURITY_OFFICER,
      ],
      type:
        telemetryStatus === TelemetryStatus.SOS
          ? NotificationType.SOS
          : NotificationType.TELEMETRY,
      priority: NotificationPriority.URGENT,
      title:
        telemetryStatus === TelemetryStatus.SOS
          ? "Emergency SOS Alert"
          : "Vehicle Breakdown Alert",
      message: `${driver.user.fullName} reported ${telemetryStatus} on route ${route.routeName}: ${data.issueDescription}`,
      entityType: "VehicleTelemetryLog",
      entityId: telemetryLog.id,
    });
  }

  if (telemetryStatus === TelemetryStatus.BREAKDOWN) {
    await createVehicleMaintenanceTaskFromTelemetry(telemetryLog.id);
  }

  return updatedTrip;
}

export async function endTrip(userId: string, routeId: string) {
  const { driver, route } = await getAssignedRouteForDriver(userId, routeId);

  const trip = await prisma.transportTrip.findFirst({
    where: {
      routeId,
      driverId: driver.id,
      status: TripStatus.IN_PROGRESS,
    },
  });

  if (!trip) {
    throw new Error("Trip is not currently in progress");
  }

  const updatedTrip = await prisma.transportTrip.update({
    where: {
      id: trip.id,
    },
    data: {
      status: TripStatus.COMPLETED,
      endedAt: new Date(),
    },
    include: {
      route: true,
      driver: {
        include: {
          user: true,
        },
      },
    },
  });

  const lastStop =
    route.smartStops && route.smartStops.length > 0
      ? route.smartStops[route.smartStops.length - 1]
      : null;

  await prisma.vehicleTelemetryLog.create({
    data: {
      driverId: driver.id,
      vehicleId: route.vehicleId ?? driver.vehicleId ?? undefined,
      routeId: route.id,
      transportTripId: updatedTrip.id,
      latitude: lastStop?.latitude ?? 24.8607,
      longitude: lastStop?.longitude ?? 67.0011,
      speed: 0,
      heading: 0,
      status: TelemetryStatus.STOPPED,
      source: TelemetrySource.MOBILE_GPS,
      remarks: lastStop
        ? `Trip completed at ${lastStop.stopName}`
        : `Trip completed on route ${route.routeName}`,
    },
  });

  // Parent TransportRoute template status remains ACTIVE to allow future daily trip runs without recreation.

  return updatedTrip;
}

export async function getMyDriverTrips(userId: string) {
  const driver = await getCurrentDriver(userId);

  return prisma.transportTrip.findMany({
    where: {
      driverId: driver.id,
    },
    include: {
      route: {
        include: {
          vehicle: true,
          smartStops: {
            orderBy: { stopOrder: "asc" },
          },
        },
      },
      driver: {
        include: {
          user: true,
        },
      },
    },
    orderBy: {
      startedAt: "desc",
    },
  });
}