import {
  HousekeepingPriority,
  HousekeepingTaskStatus,
  HousekeepingTaskType,
  MaintenancePriority,
  MaintenanceTaskStatus,
  MaintenanceTaskType,
} from "@prisma/client";
import { z } from "zod";

export const createVehicleMaintenanceTaskSchema = z.object({
  vehicleId: z.string().uuid("Valid vehicleId is required"),
  driverId: z.string().uuid("Valid driverId is required").optional(),
  transportTripId: z.string().uuid("Valid transportTripId is required").optional(),
  telemetryLogId: z.string().uuid("Valid telemetryLogId is required").optional(),
  assignedToId: z.string().uuid("Valid assignedToId is required").optional(),

  taskType: z.nativeEnum(MaintenanceTaskType),
  priority: z.nativeEnum(MaintenancePriority).optional(),

  title: z.string().min(2, "Title is required"),
  description: z.string().optional(),
});

export const updateVehicleMaintenanceTaskSchema = z.object({
  assignedToId: z.string().uuid("Valid assignedToId is required").optional(),
  taskType: z.nativeEnum(MaintenanceTaskType).optional(),
  priority: z.nativeEnum(MaintenancePriority).optional(),
  status: z.nativeEnum(MaintenanceTaskStatus).optional(),
  title: z.string().min(2, "Title is required").optional(),
  description: z.string().optional(),
  resolutionNotes: z.string().optional(),
});

export const createHousekeepingTaskSchema = z.object({
  roomId: z.string().uuid("Valid roomId is required"),
  reservationId: z.string().uuid("Valid reservationId is required").optional(),
  assignedToId: z.string().uuid("Valid assignedToId is required").optional(),

  taskType: z.nativeEnum(HousekeepingTaskType).optional(),
  priority: z.nativeEnum(HousekeepingPriority).optional(),

  title: z.string().min(2, "Title is required"),
  description: z.string().optional(),
  dueDate: z.string().optional(),
});

export const updateHousekeepingTaskSchema = z.object({
  assignedToId: z.string().uuid("Valid assignedToId is required").optional(),
  taskType: z.nativeEnum(HousekeepingTaskType).optional(),
  priority: z.nativeEnum(HousekeepingPriority).optional(),
  status: z.nativeEnum(HousekeepingTaskStatus).optional(),
  title: z.string().min(2, "Title is required").optional(),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  completionNotes: z.string().optional(),
});

export const resolveTaskSchema = z.object({
  resolutionNotes: z.string().optional(),
});

export const completeHousekeepingTaskSchema = z.object({
  completionNotes: z.string().optional(),
});

export type CreateVehicleMaintenanceTaskInput = z.infer<
  typeof createVehicleMaintenanceTaskSchema
>;

export type UpdateVehicleMaintenanceTaskInput = z.infer<
  typeof updateVehicleMaintenanceTaskSchema
>;

export type CreateHousekeepingTaskInput = z.infer<
  typeof createHousekeepingTaskSchema
>;

export type UpdateHousekeepingTaskInput = z.infer<
  typeof updateHousekeepingTaskSchema
>;