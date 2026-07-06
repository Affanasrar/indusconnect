import {
  HousekeepingPriority,
  HousekeepingTaskStatus,
  HousekeepingTaskType,
  MaintenancePriority,
  MaintenanceTaskStatus,
  MaintenanceTaskType,
  NotificationPriority,
  NotificationType,
  RoleName,
  RoomStatus,
} from "@prisma/client";
import prisma from "../../config/prisma";
import { createNotificationForRoles } from "../notifications/notification.service";
import {
  CreateHousekeepingTaskInput,
  CreateVehicleMaintenanceTaskInput,
  UpdateHousekeepingTaskInput,
  UpdateVehicleMaintenanceTaskInput,
} from "./maintenance.validation";

const userSelect = {
  id: true,
  fullName: true,
  email: true,
  phone: true,
  role: {
    select: {
      name: true,
    },
  },
};

const vehicleMaintenanceInclude = {
  vehicle: true,
  driver: {
    include: {
      user: {
        select: userSelect,
      },
    },
  },
  transportTrip: true,
  telemetryLog: true,
  reportedBy: {
    select: userSelect,
  },
  assignedTo: {
    select: userSelect,
  },
};

const housekeepingInclude = {
  room: true,
  reservation: {
    include: {
      employee: {
        select: userSelect,
      },
      travelRequest: true,
    },
  },
  createdBy: {
    select: userSelect,
  },
  assignedTo: {
    select: userSelect,
  },
};

async function validateUser(userId?: string) {
  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  return user;
}

export async function createVehicleMaintenanceTask(
  reportedById: string | undefined,
  data: CreateVehicleMaintenanceTaskInput
) {
  const vehicle = await prisma.vehicle.findUnique({
    where: {
      id: data.vehicleId,
    },
  });

  if (!vehicle) {
    throw new Error("Vehicle not found");
  }

  if (data.driverId) {
    const driver = await prisma.driver.findUnique({
      where: {
        id: data.driverId,
      },
    });

    if (!driver) {
      throw new Error("Driver not found");
    }
  }

  if (data.transportTripId) {
    const trip = await prisma.transportTrip.findUnique({
      where: {
        id: data.transportTripId,
      },
    });

    if (!trip) {
      throw new Error("Transport trip not found");
    }
  }

  if (data.telemetryLogId) {
    const telemetry = await prisma.vehicleTelemetryLog.findUnique({
      where: {
        id: data.telemetryLogId,
      },
    });

    if (!telemetry) {
      throw new Error("Telemetry log not found");
    }
  }

  await validateUser(data.assignedToId);

  const task = await prisma.vehicleMaintenanceTask.create({
    data: {
      vehicleId: data.vehicleId,
      driverId: data.driverId,
      transportTripId: data.transportTripId,
      telemetryLogId: data.telemetryLogId,
      reportedById,
      assignedToId: data.assignedToId,
      taskType: data.taskType,
      priority: data.priority ?? MaintenancePriority.NORMAL,
      title: data.title,
      description: data.description,
    },
    include: vehicleMaintenanceInclude,
  });

  await createNotificationForRoles({
    roleNames: [RoleName.SUPER_ADMIN, RoleName.TRANSPORT_ADMIN],
    type: NotificationType.TELEMETRY,
    priority:
      task.priority === MaintenancePriority.URGENT
        ? NotificationPriority.URGENT
        : NotificationPriority.HIGH,
    title: "Vehicle Maintenance Task Created",
    message: `${task.title} for vehicle ${task.vehicle.vehicleNumber}.`,
    entityType: "VehicleMaintenanceTask",
    entityId: task.id,
    createdById: reportedById,
  });

  return task;
}

export async function createVehicleMaintenanceTaskFromTelemetry(
  telemetryLogId: string
) {
  const telemetry = await prisma.vehicleTelemetryLog.findUnique({
    where: {
      id: telemetryLogId,
    },
    include: {
      vehicle: true,
      driver: {
        include: {
          user: true,
        },
      },
      route: true,
      transportTrip: true,
    },
  });

  if (!telemetry) {
    throw new Error("Telemetry log not found");
  }

  if (!telemetry.vehicleId) {
    return null;
  }

  const existingTask = await prisma.vehicleMaintenanceTask.findUnique({
    where: {
      telemetryLogId,
    },
  });

  if (existingTask) {
    return existingTask;
  }

  return createVehicleMaintenanceTask(undefined, {
    vehicleId: telemetry.vehicleId,
    driverId: telemetry.driverId,
    transportTripId: telemetry.transportTripId ?? undefined,
    telemetryLogId: telemetry.id,
    taskType: MaintenanceTaskType.BREAKDOWN,
    priority: MaintenancePriority.URGENT,
    title: "Vehicle Breakdown Reported",
    description:
      telemetry.remarks ??
      `Breakdown reported by ${telemetry.driver.user.fullName}.`,
  });
}

export async function getAllVehicleMaintenanceTasks() {
  return prisma.vehicleMaintenanceTask.findMany({
    include: vehicleMaintenanceInclude,
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getOpenVehicleMaintenanceTasks() {
  return prisma.vehicleMaintenanceTask.findMany({
    where: {
      status: {
        in: [MaintenanceTaskStatus.OPEN, MaintenanceTaskStatus.IN_PROGRESS],
      },
    },
    include: vehicleMaintenanceInclude,
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getVehicleMaintenanceTaskById(id: string) {
  const task = await prisma.vehicleMaintenanceTask.findUnique({
    where: {
      id,
    },
    include: vehicleMaintenanceInclude,
  });

  if (!task) {
    throw new Error("Vehicle maintenance task not found");
  }

  return task;
}

export async function updateVehicleMaintenanceTask(
  id: string,
  data: UpdateVehicleMaintenanceTaskInput
) {
  await getVehicleMaintenanceTaskById(id);
  await validateUser(data.assignedToId);

  return prisma.vehicleMaintenanceTask.update({
    where: {
      id,
    },
    data,
    include: vehicleMaintenanceInclude,
  });
}

export async function startVehicleMaintenanceTask(id: string) {
  await getVehicleMaintenanceTaskById(id);

  return prisma.vehicleMaintenanceTask.update({
    where: {
      id,
    },
    data: {
      status: MaintenanceTaskStatus.IN_PROGRESS,
      startedAt: new Date(),
    },
    include: vehicleMaintenanceInclude,
  });
}

export async function resolveVehicleMaintenanceTask(
  id: string,
  resolutionNotes?: string
) {
  await getVehicleMaintenanceTaskById(id);

  return prisma.vehicleMaintenanceTask.update({
    where: {
      id,
    },
    data: {
      status: MaintenanceTaskStatus.RESOLVED,
      resolvedAt: new Date(),
      resolutionNotes,
    },
    include: vehicleMaintenanceInclude,
  });
}

export async function cancelVehicleMaintenanceTask(id: string) {
  await getVehicleMaintenanceTaskById(id);

  return prisma.vehicleMaintenanceTask.update({
    where: {
      id,
    },
    data: {
      status: MaintenanceTaskStatus.CANCELLED,
    },
    include: vehicleMaintenanceInclude,
  });
}

export async function createHousekeepingTask(
  createdById: string | undefined,
  data: CreateHousekeepingTaskInput
) {
  const room = await prisma.room.findUnique({
    where: {
      id: data.roomId,
    },
  });

  if (!room) {
    throw new Error("Room not found");
  }

  if (data.reservationId) {
    const reservation = await prisma.roomReservation.findUnique({
      where: {
        id: data.reservationId,
      },
    });

    if (!reservation) {
      throw new Error("Room reservation not found");
    }
  }

  await validateUser(data.assignedToId);

  const task = await prisma.housekeepingTask.create({
    data: {
      roomId: data.roomId,
      reservationId: data.reservationId,
      createdById,
      assignedToId: data.assignedToId,
      taskType: data.taskType ?? HousekeepingTaskType.ROOM_CLEANING,
      priority: data.priority ?? HousekeepingPriority.NORMAL,
      title: data.title,
      description: data.description,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
    },
    include: housekeepingInclude,
  });

  await prisma.room.update({
    where: {
      id: data.roomId,
    },
    data: {
      status: RoomStatus.MAINTENANCE,
    },
  });

  await createNotificationForRoles({
    roleNames: [RoleName.SUPER_ADMIN, RoleName.ACCOMMODATION_ADMIN],
    type: NotificationType.ACCOMMODATION,
    priority: NotificationPriority.HIGH,
    title: "Housekeeping Task Created",
    message: `${task.title} for room ${task.room.roomNumber}.`,
    entityType: "HousekeepingTask",
    entityId: task.id,
    createdById,
  });

  return task;
}

export async function createHousekeepingTaskAfterCheckout(
  reservationId: string,
  createdById?: string
) {
  const reservation = await prisma.roomReservation.findUnique({
    where: {
      id: reservationId,
    },
    include: {
      room: true,
      employee: true,
    },
  });

  if (!reservation) {
    throw new Error("Room reservation not found");
  }

  if (!reservation.roomId) {
    throw new Error("Reservation is not linked with an internal room");
  }

  const existingTask = await prisma.housekeepingTask.findFirst({
    where: {
      reservationId,
      status: {
        in: [
          HousekeepingTaskStatus.PENDING,
          HousekeepingTaskStatus.IN_PROGRESS,
        ],
      },
    },
  });

  if (existingTask) {
    return existingTask;
  }

  return createHousekeepingTask(createdById, {
    roomId: reservation.roomId,
    reservationId: reservation.id,
    taskType: HousekeepingTaskType.ROOM_CLEANING,
    priority: HousekeepingPriority.HIGH,
    title: "Room Cleaning After Checkout",
    description: `Room ${reservation.room?.roomNumber} requires cleaning after checkout of ${reservation.employee.fullName}.`,
  });
}

export async function getAllHousekeepingTasks() {
  return prisma.housekeepingTask.findMany({
    include: housekeepingInclude,
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getPendingHousekeepingTasks() {
  return prisma.housekeepingTask.findMany({
    where: {
      status: {
        in: [HousekeepingTaskStatus.PENDING, HousekeepingTaskStatus.IN_PROGRESS],
      },
    },
    include: housekeepingInclude,
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getHousekeepingTaskById(id: string) {
  const task = await prisma.housekeepingTask.findUnique({
    where: {
      id,
    },
    include: housekeepingInclude,
  });

  if (!task) {
    throw new Error("Housekeeping task not found");
  }

  return task;
}

export async function updateHousekeepingTask(
  id: string,
  data: UpdateHousekeepingTaskInput
) {
  await getHousekeepingTaskById(id);
  await validateUser(data.assignedToId);

  return prisma.housekeepingTask.update({
    where: {
      id,
    },
    data: {
      ...data,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
    },
    include: housekeepingInclude,
  });
}

export async function startHousekeepingTask(id: string) {
  await getHousekeepingTaskById(id);

  return prisma.housekeepingTask.update({
    where: {
      id,
    },
    data: {
      status: HousekeepingTaskStatus.IN_PROGRESS,
      startedAt: new Date(),
    },
    include: housekeepingInclude,
  });
}

export async function completeHousekeepingTask(
  id: string,
  completionNotes?: string
) {
  const task = await getHousekeepingTaskById(id);

  const updatedTask = await prisma.housekeepingTask.update({
    where: {
      id,
    },
    data: {
      status: HousekeepingTaskStatus.COMPLETED,
      completedAt: new Date(),
      completionNotes,
    },
    include: housekeepingInclude,
  });

  await prisma.room.update({
    where: {
      id: task.roomId,
    },
    data: {
      status: RoomStatus.AVAILABLE,
    },
  });

  return updatedTask;
}

export async function cancelHousekeepingTask(id: string) {
  await getHousekeepingTaskById(id);

  return prisma.housekeepingTask.update({
    where: {
      id,
    },
    data: {
      status: HousekeepingTaskStatus.CANCELLED,
    },
    include: housekeepingInclude,
  });
}