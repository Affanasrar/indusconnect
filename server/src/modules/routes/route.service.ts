import { RouteStatus } from "@prisma/client";
import prisma from "../../config/prisma";
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
      smartStops: data.smartStops
        ? {
            create: data.smartStops,
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

  return prisma.smartStop.create({
    data: {
      routeId,
      stopName: data.stopName,
      stopOrder: data.stopOrder,
      latitude: data.latitude,
      longitude: data.longitude,
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

  return prisma.smartStop.update({
    where: { id },
    data,
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