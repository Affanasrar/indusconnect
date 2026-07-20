import { RouteStatus, DriverStatus } from "@prisma/client";
import prisma from "../../config/prisma";
import { geocodeAddress } from "../../utils/geocoder";
import { solveVRP, VRPNode } from "../../utils/vrpSolver";
import {
  AddSmartStopInput,
  CreateRouteInput,
  UpdateRouteInput,
  UpdateSmartStopInput,
} from "./route.validation";

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
};

export async function getAllRoutes() {
  return prisma.transportRoute.findMany({
    include: routeInclude,
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getRouteById(id: string) {
  const route = await prisma.transportRoute.findUnique({
    where: { id },
    include: routeInclude,
  });

  if (!route) {
    throw new Error("Route not found");
  }

  return route;
}

export async function createRoute(data: CreateRouteInput) {
  const existingRoute = await prisma.transportRoute.findUnique({
    where: {
      routeCode: data.routeCode,
    },
  });

  if (existingRoute) {
    throw new Error("Route with this code already exists");
  }

  if (data.vehicleId) {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: data.vehicleId },
    });

    if (!vehicle) {
      throw new Error("Vehicle not found");
    }
  }

  if (data.driverId) {
    const driver = await prisma.driver.findUnique({
      where: { id: data.driverId },
    });

    if (!driver) {
      throw new Error("Driver not found");
    }
  }

  const processedStops = [];
  if (data.smartStops) {
    for (const stop of data.smartStops) {
      let lat = stop.latitude;
      let lon = stop.longitude;
      if (lat === undefined || lon === undefined || lat === null || lon === null) {
        const coords = await geocodeAddress(stop.stopName);
        if (coords) {
          lat = coords.latitude;
          lon = coords.longitude;
        }
      }
      processedStops.push({
        stopName: stop.stopName,
        stopOrder: stop.stopOrder,
        latitude: lat,
        longitude: lon,
        estimatedTime: stop.estimatedTime,
      });
    }
  }

  return prisma.transportRoute.create({
    data: {
      routeName: data.routeName,
      routeCode: data.routeCode,
      shiftType: data.shiftType,
      routeDate: data.routeDate ? new Date(data.routeDate) : undefined,
      startTime: data.startTime,
      endTime: data.endTime,
      startLocation: data.startLocation,
      endLocation: data.endLocation,
      vehicleId: data.vehicleId,
      driverId: data.driverId,
      status: data.status,
      notes: data.notes,
      smartStops: processedStops.length > 0
        ? {
            create: processedStops,
          }
        : undefined,
    },
    include: routeInclude,
  });
}

export async function updateRoute(id: string, data: UpdateRouteInput) {
  await getRouteById(id);

  if (data.routeCode) {
    const existingRoute = await prisma.transportRoute.findUnique({
      where: {
        routeCode: data.routeCode,
      },
    });

    if (existingRoute && existingRoute.id !== id) {
      throw new Error("Route with this code already exists");
    }
  }

  if (data.vehicleId) {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: data.vehicleId },
    });

    if (!vehicle) {
      throw new Error("Vehicle not found");
    }
  }

  if (data.driverId) {
    const driver = await prisma.driver.findUnique({
      where: { id: data.driverId },
    });

    if (!driver) {
      throw new Error("Driver not found");
    }
  }

  return prisma.transportRoute.update({
    where: { id },
    data: {
      routeName: data.routeName,
      routeCode: data.routeCode,
      shiftType: data.shiftType,
      routeDate: data.routeDate ? new Date(data.routeDate) : undefined,
      startTime: data.startTime,
      endTime: data.endTime,
      startLocation: data.startLocation,
      endLocation: data.endLocation,
      vehicleId: data.vehicleId,
      driverId: data.driverId,
      status: data.status,
      notes: data.notes,
    },
    include: routeInclude,
  });
}

export async function cancelRoute(id: string) {
  await getRouteById(id);

  return prisma.transportRoute.update({
    where: { id },
    data: {
      status: RouteStatus.CANCELLED,
    },
    include: routeInclude,
  });
}

export async function addSmartStop(routeId: string, data: AddSmartStopInput) {
  await getRouteById(routeId);

  let lat = data.latitude;
  let lon = data.longitude;
  if (lat === undefined || lon === undefined || lat === null || lon === null) {
    const coords = await geocodeAddress(data.stopName);
    if (coords) {
      lat = coords.latitude;
      lon = coords.longitude;
    }
  }

  return prisma.smartStop.create({
    data: {
      routeId,
      stopName: data.stopName,
      stopOrder: data.stopOrder,
      latitude: lat,
      longitude: lon,
      estimatedTime: data.estimatedTime,
    },
  });
}

export async function updateSmartStop(id: string, data: UpdateSmartStopInput) {
  const stop = await prisma.smartStop.findUnique({
    where: { id },
  });

  if (!stop) {
    throw new Error("Smart stop not found");
  }

  let lat = data.latitude;
  let lon = data.longitude;
  if (data.stopName && (lat === undefined || lon === undefined || lat === null || lon === null)) {
    const coords = await geocodeAddress(data.stopName);
    if (coords) {
      lat = coords.latitude;
      lon = coords.longitude;
    }
  }

  return prisma.smartStop.update({
    where: { id },
    data: {
      ...data,
      latitude: lat !== undefined ? lat : undefined,
      longitude: lon !== undefined ? lon : undefined,
    },
  });
}

export async function deleteSmartStop(id: string) {
  const stop = await prisma.smartStop.findUnique({
    where: { id },
  });

  if (!stop) {
    throw new Error("Smart stop not found");
  }

  return prisma.smartStop.delete({
    where: { id },
  });
}

export async function runVRPOptimization(shiftType: string, dateStr: string) {
  const targetDate = new Date(dateStr);
  const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
  const endOfDay = new Date(new Date(dateStr).setHours(23, 59, 59, 999));

  // 1. Fetch all bookings for this shift & date that are currently PENDING
  const pendingBookings = await prisma.shuttleBooking.findMany({
    where: {
      shiftType: shiftType as any,
      bookingDate: {
        gte: startOfDay,
        lte: endOfDay,
      },
      status: "PENDING",
    },
  });

  if (pendingBookings.length === 0) {
    return { success: true, message: "No pending shuttle bookings found for optimization.", routesCreated: 0 };
  }

  // 2. Fetch all active vehicles (vans) and drivers
  const vehicles = await prisma.vehicle.findMany({
    where: { status: "ACTIVE" },
  });

  const drivers = await prisma.driver.findMany({
    where: {
      status: {
        in: [DriverStatus.AVAILABLE, DriverStatus.ASSIGNED],
      },
    },
  });

  if (vehicles.length === 0 || drivers.length === 0) {
    throw new Error("Cannot run VRP optimization: No active vehicles or drivers registered in the fleet.");
  }

  // 3. Define company head office depot coordinates (Karachi center core)
  const depotLat = 24.8607;
  const depotLng = 67.0104;

  // 4. Map bookings to VRP nodes by geocoding pickup areas
  const vrpNodes: VRPNode[] = [];
  for (const b of pendingBookings) {
    const coords = await geocodeAddress(b.pickupArea);
    if (coords) {
      vrpNodes.push({
        bookingId: b.id,
        latitude: coords.latitude,
        longitude: coords.longitude,
        pickupArea: b.pickupArea,
      });
    } else {
      vrpNodes.push({
        bookingId: b.id,
        latitude: depotLat,
        longitude: depotLng,
        pickupArea: b.pickupArea,
      });
    }
  }

  // Match start times based on shift type
  let shiftStartTime = "08:00";
  if (shiftType === "AFTERNOON") shiftStartTime = "13:30";
  else if (shiftType === "EVENING") shiftStartTime = "17:30";
  else if (shiftType === "NIGHT") shiftStartTime = "21:30";

  // 5. Solve Capacitated VRP
  const optimizedRoutes = solveVRP(
    depotLat,
    depotLng,
    vrpNodes,
    vehicles.map((v) => ({ id: v.id, capacity: v.capacity })),
    drivers.map((d) => ({ id: d.id })),
    shiftStartTime
  );

  let routesCreatedCount = 0;

  // 6. Persist routes & stops, and link the bookings to them
  for (const optRoute of optimizedRoutes) {
    if (optRoute.stops.length === 0) continue;

    const codeSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const routeCode = `VRP-${shiftType.substring(0, 3)}-${codeSuffix}`;

    // Create route in database
    const newRoute = await prisma.transportRoute.create({
      data: {
        routeName: `VRP Optimized - ${shiftType} Shift`,
        routeCode,
        shiftType: shiftType as any,
        routeDate: startOfDay,
        startTime: shiftStartTime,
        endTime: "23:00",
        startLocation: "Company Head Office",
        endLocation: optRoute.stops[optRoute.stops.length - 1].stopName,
        vehicleId: optRoute.vehicleId,
        driverId: optRoute.driverId,
        status: "ACTIVE",
      },
    });

    routesCreatedCount++;

    // Create stops sequentially and assign seats to bookings
    for (const optStop of optRoute.stops) {
      const dbStop = await prisma.smartStop.create({
        data: {
          routeId: newRoute.id,
          stopName: optStop.stopName,
          stopOrder: optStop.stopOrder,
          latitude: optStop.latitude,
          longitude: optStop.longitude,
          estimatedTime: optStop.estimatedTime,
        },
      });

      // Update the booking to link it to the newly created route/stop, and assign seat number
      await prisma.shuttleBooking.update({
        where: { id: optStop.bookingId },
        data: {
          routeId: newRoute.id,
          pickupStopId: dbStop.id,
          seatNumber: `Seat-${String(optStop.stopOrder).padStart(2, "0")}`,
          status: "ASSIGNED",
        },
      });
    }
  }

  return {
    success: true,
    message: `VRP Optimization completed successfully. Created ${routesCreatedCount} optimized routes.`,
    routesCreated: routesCreatedCount,
  };
}