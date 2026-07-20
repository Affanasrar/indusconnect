import {
  TelemetrySource,
  TelemetryStatus,
  TripIssueType,
  TripStatus,
  NotificationPriority,
  NotificationType,
  RoleName,
} from "@prisma/client";
import { createNotificationForRoles } from "../notifications/notification.service";
import prisma from "../../config/prisma";
import { CreateTelemetryInput } from "./telemetry.validation";
import { createVehicleMaintenanceTaskFromTelemetry } from "../maintenance/maintenance.service";

const telemetryInclude = {
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
  vehicle: true,
  route: true,
  transportTrip: true,
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

async function validateRouteAssignment(driverId: string, routeId?: string) {
  if (!routeId) return null;

  const route = await prisma.transportRoute.findUnique({
    where: {
      id: routeId,
    },
    include: {
      vehicle: true,
      driver: true,
    },
  });

  if (!route) {
    throw new Error("Route not found");
  }

  if (route.driverId !== driverId) {
    throw new Error("This route is not assigned to the current driver");
  }

  return route;
}

async function findActiveTrip(driverId: string, routeId?: string) {
  if (!routeId) return null;

  return prisma.transportTrip.findFirst({
    where: {
      driverId,
      routeId,
      status: {
        in: [TripStatus.READY, TripStatus.IN_PROGRESS],
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

function mapTelemetryStatusToIssue(status?: TelemetryStatus) {
  if (status === TelemetryStatus.SOS) return TripIssueType.SOS;
  if (status === TelemetryStatus.BREAKDOWN) return TripIssueType.BREAKDOWN;
  if (status === TelemetryStatus.DELAYED) return TripIssueType.DELAY;
  return null;
}

export async function createTelemetryLog(
  userId: string,
  data: CreateTelemetryInput
) {
  const driver = await getCurrentDriver(userId);
  const route = await validateRouteAssignment(driver.id, data.routeId);

  const activeTrip = data.transportTripId
    ? await prisma.transportTrip.findUnique({
        where: {
          id: data.transportTripId,
        },
      })
    : await findActiveTrip(driver.id, data.routeId);

  if (data.transportTripId && !activeTrip) {
    throw new Error("Transport trip not found");
  }

  if (activeTrip && activeTrip.driverId !== driver.id) {
    throw new Error("This trip is not assigned to the current driver");
  }

  const vehicleId =
    data.vehicleId ?? route?.vehicleId ?? driver.vehicleId ?? undefined;

  if (vehicleId) {
    const vehicle = await prisma.vehicle.findUnique({
      where: {
        id: vehicleId,
      },
    });

    if (!vehicle) {
      throw new Error("Vehicle not found");
    }
  }

  const telemetry = await prisma.vehicleTelemetryLog.create({
    data: {
      driverId: driver.id,
      vehicleId,
      routeId: data.routeId,
      transportTripId: activeTrip?.id,
      latitude: data.latitude,
      longitude: data.longitude,
      speed: data.speed,
      heading: data.heading,
      status: data.status ?? TelemetryStatus.MOVING,
      source: data.source ?? TelemetrySource.MOBILE_GPS,
      batteryLevel: data.batteryLevel,
      accuracy: data.accuracy,
      remarks: data.remarks,
    },
    include: telemetryInclude,
  });

  const issueType = mapTelemetryStatusToIssue(data.status);

  if (issueType && activeTrip) {
    await prisma.transportTrip.update({
      where: {
        id: activeTrip.id,
      },
      data: {
        issueType,
        issueDescription:
          data.remarks ?? `Telemetry status reported: ${data.status}`,
        issueLatitude: data.latitude,
        issueLongitude: data.longitude,
        issueReportedAt: new Date(),
      },
    });
  }
  if (
  data.status === TelemetryStatus.SOS ||
  data.status === TelemetryStatus.BREAKDOWN
) {
  await createNotificationForRoles({
    roleNames: [
      RoleName.SUPER_ADMIN,
      RoleName.TRANSPORT_ADMIN,
      RoleName.SECURITY_OFFICER,
    ],
    type:
      data.status === TelemetryStatus.SOS
        ? NotificationType.SOS
        : NotificationType.TELEMETRY,
    priority: NotificationPriority.URGENT,
    title:
      data.status === TelemetryStatus.SOS
        ? "Emergency SOS Alert"
        : "Vehicle Breakdown Alert",
    message: `${
      driver.user.fullName
    } reported ${data.status} at latitude ${data.latitude}, longitude ${
      data.longitude
    }. ${data.remarks ?? ""}`,
    entityType: "VehicleTelemetryLog",
    entityId: telemetry.id,
  });
}
  if (data.status === TelemetryStatus.BREAKDOWN) {
  await createVehicleMaintenanceTaskFromTelemetry(telemetry.id);
}

  return telemetry;
}

export async function getLatestVehicleLocations() {
  const recentLogs = await prisma.vehicleTelemetryLog.findMany({
    include: telemetryInclude,
    orderBy: {
      recordedAt: "desc",
    },
    take: 300,
  });

  const latestByVehicleOrDriver = new Map<string, (typeof recentLogs)[number]>();

  for (const log of recentLogs) {
    const key = log.vehicleId ?? `driver-${log.driverId}`;

    if (!latestByVehicleOrDriver.has(key)) {
      latestByVehicleOrDriver.set(key, log);
    }
  }

  return Array.from(latestByVehicleOrDriver.values());
}

export async function getEmergencyTelemetryEvents() {
  return prisma.vehicleTelemetryLog.findMany({
    where: {
      status: {
        in: [TelemetryStatus.SOS, TelemetryStatus.BREAKDOWN],
      },
    },
    include: telemetryInclude,
    orderBy: {
      recordedAt: "desc",
    },
    take: 100,
  });
}

export async function getTelemetryByRoute(
  routeId: string,
  currentUser?: { userId: string; role: string }
) {
  const route = await prisma.transportRoute.findUnique({
    where: {
      id: routeId,
    },
  });

  if (!route) {
    throw new Error("Route not found");
  }

  // Restrict telemetry access to route booking assignment
  if (currentUser && currentUser.role === "EMPLOYEE") {
    const today = new Date();
    const startOfToday = new Date(today.setHours(0, 0, 0, 0));
    const endOfTomorrow = new Date(new Date().setDate(today.getDate() + 1));
    endOfTomorrow.setHours(23, 59, 59, 999);

    const activeBooking = await prisma.shuttleBooking.findFirst({
      where: {
        employeeId: currentUser.userId,
        routeId,
        bookingDate: {
          gte: startOfToday,
          lte: endOfTomorrow,
        },
        status: { in: ["ASSIGNED", "COMPLETED"] },
      },
    });

    if (!activeBooking) {
      throw new Error("Forbidden: You do not have an approved shuttle booking on this route.");
    }
  }

  return prisma.vehicleTelemetryLog.findMany({
    where: {
      routeId,
    },
    include: telemetryInclude,
    orderBy: {
      recordedAt: "asc",
    },
  });
}

export async function getTelemetryByDriver(driverId: string) {
  const driver = await prisma.driver.findUnique({
    where: {
      id: driverId,
    },
  });

  if (!driver) {
    throw new Error("Driver not found");
  }

  return prisma.vehicleTelemetryLog.findMany({
    where: {
      driverId,
    },
    include: telemetryInclude,
    orderBy: {
      recordedAt: "desc",
    },
    take: 100,
  });
}

export async function getMyTelemetryLogs(userId: string) {
  const driver = await getCurrentDriver(userId);

  return prisma.vehicleTelemetryLog.findMany({
    where: {
      driverId: driver.id,
    },
    include: telemetryInclude,
    orderBy: {
      recordedAt: "desc",
    },
    take: 100,
  });
}