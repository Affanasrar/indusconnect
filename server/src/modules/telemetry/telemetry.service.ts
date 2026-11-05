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
  route: {
    include: {
      smartStops: {
        orderBy: {
          stopOrder: "asc" as const,
        },
      },
    },
  },
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

  const isTripInProgress = activeTrip?.status === TripStatus.IN_PROGRESS;
  const isEmergencyStatus =
    data.status === TelemetryStatus.SOS ||
    data.status === TelemetryStatus.BREAKDOWN;

  const effectiveStatus = isEmergencyStatus
    ? data.status!
    : isTripInProgress
    ? data.status ?? TelemetryStatus.MOVING
    : TelemetryStatus.STOPPED;

  const effectiveSpeed = isTripInProgress ? data.speed ?? 0 : 0;

  const telemetry = await prisma.vehicleTelemetryLog.create({
    data: {
      driverId: driver.id,
      vehicleId,
      routeId: data.routeId,
      transportTripId: activeTrip?.id,
      latitude: data.latitude,
      longitude: data.longitude,
      speed: effectiveSpeed,
      heading: data.heading,
      status: effectiveStatus,
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

function mapTripIssueToTelemetryStatus(issueType?: TripIssueType | null): TelemetryStatus {
  if (issueType === TripIssueType.SOS) return TelemetryStatus.SOS;
  if (issueType === TripIssueType.BREAKDOWN) return TelemetryStatus.BREAKDOWN;
  if (issueType === TripIssueType.DELAY) return TelemetryStatus.DELAYED;
  return TelemetryStatus.STOPPED;
}

async function syncTripIssuesToTelemetry() {
  // Only sync issues from currently active (IN_PROGRESS or READY) trips
  const tripsWithIssues = await prisma.transportTrip.findMany({
    where: {
      status: {
        in: [TripStatus.READY, TripStatus.IN_PROGRESS],
      },
      issueType: {
        not: null,
      },
    },
    include: {
      route: {
        include: {
          smartStops: {
            orderBy: { stopOrder: "asc" },
          },
        },
      },
      driver: true,
    },
  });

  for (const trip of tripsWithIssues) {
    const targetStatus = mapTripIssueToTelemetryStatus(trip.issueType);
    const existingLog = await prisma.vehicleTelemetryLog.findFirst({
      where: {
        transportTripId: trip.id,
        status: targetStatus,
      },
    });

    if (!existingLog) {
      const fallbackStop = trip.route?.smartStops?.[0];
      const lat = trip.issueLatitude ?? fallbackStop?.latitude ?? 24.8607;
      const lng = trip.issueLongitude ?? fallbackStop?.longitude ?? 67.0011;

      await prisma.vehicleTelemetryLog.create({
        data: {
          driverId: trip.driverId,
          vehicleId: trip.route?.vehicleId ?? trip.driver?.vehicleId ?? undefined,
          routeId: trip.routeId,
          transportTripId: trip.id,
          latitude: lat,
          longitude: lng,
          speed: 0,
          status: targetStatus,
          source: TelemetrySource.MOBILE_GPS,
          remarks: trip.issueDescription ?? `Trip issue reported: ${trip.issueType}`,
          recordedAt: trip.issueReportedAt ?? trip.updatedAt,
        },
      });
    }
  }
}

export async function getLatestVehicleLocations() {
  await syncTripIssuesToTelemetry();

  const [recentLogs, activeVehicles, inProgressTrips] = await Promise.all([
    prisma.vehicleTelemetryLog.findMany({
      include: telemetryInclude,
      orderBy: {
        recordedAt: "desc",
      },
      take: 300,
    }),
    prisma.vehicle.findMany({
      where: {
        status: "ACTIVE",
      },
      include: {
        drivers: {
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
        transportRoutes: {
          where: {
            status: {
              in: ["ACTIVE", "DRAFT"],
            },
          },
          include: {
            smartStops: {
              orderBy: {
                stopOrder: "asc",
              },
            },
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
            trips: {
              orderBy: {
                createdAt: "desc",
              },
              take: 1,
            },
          },
        },
      },
    }),
    prisma.transportTrip.findMany({
      where: {
        status: TripStatus.IN_PROGRESS,
      },
      select: {
        id: true,
        routeId: true,
        driverId: true,
      },
    }),
  ]);

  const activeTripIds = new Set(inProgressTrips.map((t) => t.id));
  const activeDriverIds = new Set(inProgressTrips.map((t) => t.driverId));

  const latestByVehicleOrDriver = new Map<string, any>();

  for (const log of recentLogs) {
    const key = log.vehicleId ?? `driver-${log.driverId}`;

    if (!latestByVehicleOrDriver.has(key)) {
      const normalizedLog = { ...log };
      const hasActiveTrip =
        (normalizedLog.transportTripId &&
          activeTripIds.has(normalizedLog.transportTripId)) ||
        activeDriverIds.has(normalizedLog.driverId);

      // A vehicle can ONLY be MOVING (or in active trip emergency) if a driver currently has an IN_PROGRESS trip
      if (!hasActiveTrip) {
        normalizedLog.status = TelemetryStatus.STOPPED;
        normalizedLog.speed = 0;
        normalizedLog.remarks = "No active trip in progress — vehicle parked";
      }

      latestByVehicleOrDriver.set(key, normalizedLog);
    }
  }

  // Ensure every active vehicle in the database is represented with real route/driver data
  for (const vehicle of activeVehicles) {
    if (latestByVehicleOrDriver.has(vehicle.id)) {
      continue;
    }

    const assignedRoute = vehicle.transportRoutes[0] ?? null;
    const assignedDriver = assignedRoute?.driver ?? vehicle.drivers[0] ?? null;

    if (!assignedDriver) {
      continue;
    }

    const latestTrip = assignedRoute?.trips?.[0] ?? null;
    const firstStop = assignedRoute?.smartStops?.[0] ?? null;
    const isTripActive = latestTrip?.status === TripStatus.IN_PROGRESS;

    let derivedStatus: TelemetryStatus = isTripActive
      ? TelemetryStatus.MOVING
      : TelemetryStatus.STOPPED;

    if (isTripActive && latestTrip?.issueType) {
      derivedStatus = mapTripIssueToTelemetryStatus(latestTrip.issueType);
    }

    const { drivers: _drivers, transportRoutes: _routes, ...vehicleData } = vehicle;

    latestByVehicleOrDriver.set(vehicle.id, {
      id: `vehicle-state-${vehicle.id}`,
      driverId: assignedDriver.id,
      vehicleId: vehicle.id,
      routeId: assignedRoute?.id ?? null,
      transportTripId: latestTrip?.id ?? null,
      latitude:
        (isTripActive ? latestTrip?.issueLatitude : null) ??
        firstStop?.latitude ??
        24.8607,
      longitude:
        (isTripActive ? latestTrip?.issueLongitude : null) ??
        firstStop?.longitude ??
        67.0011,
      speed: 0,
      heading: 0,
      status: derivedStatus,
      source: TelemetrySource.MOBILE_GPS,
      batteryLevel: null,
      accuracy: null,
      remarks: isTripActive
        ? latestTrip?.issueDescription ?? "Trip in progress"
        : firstStop
        ? `Stationed at ${firstStop.stopName} (No active trip)`
        : "Stationed at depot (No active trip)",
      recordedAt:
        latestTrip?.updatedAt?.toISOString?.() ??
        vehicle.updatedAt.toISOString(),
      createdAt: vehicle.createdAt.toISOString(),
      driver: assignedDriver,
      vehicle: vehicleData,
      route: assignedRoute,
      transportTrip: latestTrip,
    });
  }

  return Array.from(latestByVehicleOrDriver.values());
}

export async function getEmergencyTelemetryEvents() {
  await syncTripIssuesToTelemetry();

  return prisma.vehicleTelemetryLog.findMany({
    where: {
      status: {
        in: [TelemetryStatus.SOS, TelemetryStatus.BREAKDOWN],
      },
      transportTrip: {
        status: {
          in: [TripStatus.READY, TripStatus.IN_PROGRESS],
        },
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

  // Restrict telemetry access to route booking assignment AND active IN_PROGRESS trip for employees
  if (currentUser && currentUser.role === "EMPLOYEE") {
    const [activeBooking, activeSubscription, activeTrip] = await Promise.all([
      prisma.shuttleBooking.findFirst({
        where: {
          employeeId: currentUser.userId,
          routeId,
          status: { not: "CANCELLED" },
        },
      }),
      prisma.shuttleSubscription.findFirst({
        where: {
          employeeId: currentUser.userId,
          routeId,
          isActive: true,
        },
      }),
      prisma.transportTrip.findFirst({
        where: {
          routeId,
          status: TripStatus.IN_PROGRESS,
        },
        orderBy: {
          startedAt: "desc",
        },
      }),
    ]);

    if (!activeBooking && !activeSubscription) {
      throw new Error("Forbidden: You do not have an approved shuttle booking on this route.");
    }

    // Employees only see active vehicle telemetry after the driver starts the trip (IN_PROGRESS)
    if (!activeTrip) {
      return [];
    }

    return prisma.vehicleTelemetryLog.findMany({
      where: {
        routeId,
        transportTripId: activeTrip.id,
      },
      include: telemetryInclude,
      orderBy: {
        recordedAt: "asc",
      },
    });
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

  const logs = await prisma.vehicleTelemetryLog.findMany({
    where: {
      driverId: driver.id,
    },
    include: telemetryInclude,
    orderBy: {
      recordedAt: "desc",
    },
    take: 100,
  });

  return logs.map((log) => {
    const isTripActive = log.transportTrip?.status === TripStatus.IN_PROGRESS;
    if (!isTripActive && log.status === TelemetryStatus.MOVING) {
      return {
        ...log,
        status: TelemetryStatus.STOPPED,
        speed: 0,
      };
    }
    return log;
  });
}