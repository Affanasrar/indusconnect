import {
  RouteStatus,
  ShuttleBookingStatus,
  TripStatus,
} from "@prisma/client";
import prisma from "../../config/prisma";
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
  const { driver } = await getAssignedRouteForDriver(userId, routeId);

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

  return prisma.transportTrip.update({
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
  const { driver } = await getAssignedRouteForDriver(userId, routeId);

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

  return prisma.transportTrip.update({
    where: {
      id: trip.id,
    },
    data: {
      issueType: data.issueType,
      issueDescription: data.issueDescription,
      issueLatitude: data.issueLatitude,
      issueLongitude: data.issueLongitude,
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
}

export async function endTrip(userId: string, routeId: string) {
  const { driver } = await getAssignedRouteForDriver(userId, routeId);

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

  await prisma.transportRoute.update({
    where: {
      id: routeId,
    },
    data: {
      status: RouteStatus.COMPLETED,
    },
  });

  return updatedTrip;
}