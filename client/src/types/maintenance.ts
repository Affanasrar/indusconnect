import type { UserProfile } from "./frontend";
import type { Vehicle, Driver } from "./transport";
import type { AccommodationRoom, RoomReservation } from "./accommodation";
import type { VehicleTelemetryLog } from "./telemetry";
import type { TransportTrip } from "./driverTrip";

export type MaintenanceTaskType =
  | "ROUTINE_SERVICE"
  | "REPAIR"
  | "BREAKDOWN"
  | "INSPECTION"
  | "FITNESS_RENEWAL"
  | "OTHER";

export type MaintenancePriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";

export type MaintenanceTaskStatus =
  | "OPEN"
  | "IN_PROGRESS"
  | "RESOLVED"
  | "CANCELLED";

export interface VehicleMaintenanceTask {
  id: string;
  vehicleId: string;
  vehicle?: Vehicle;
  driverId?: string | null;
  driver?: Driver | null;
  transportTripId?: string | null;
  transportTrip?: TransportTrip | null;
  telemetryLogId?: string | null;
  telemetryLog?: VehicleTelemetryLog | null;
  reportedById?: string | null;
  reportedBy?: UserProfile | null;
  assignedToId?: string | null;
  assignedTo?: UserProfile | null;
  taskType: MaintenanceTaskType;
  priority: MaintenancePriority;
  status: MaintenanceTaskStatus;
  title: string;
  description?: string | null;
  resolutionNotes?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type HousekeepingTaskType =
  | "ROOM_CLEANING"
  | "LINEN_CHANGE"
  | "SANITIZATION"
  | "INSPECTION"
  | "MAINTENANCE_REQUIRED"
  | "OTHER";

export type HousekeepingPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";

export type HousekeepingTaskStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

export interface HousekeepingTask {
  id: string;
  roomId: string;
  room?: AccommodationRoom;
  reservationId?: string | null;
  reservation?: RoomReservation | null;
  createdById?: string | null;
  createdBy?: UserProfile | null;
  assignedToId?: string | null;
  assignedTo?: UserProfile | null;
  taskType: HousekeepingTaskType;
  priority: HousekeepingPriority;
  status: HousekeepingTaskStatus;
  title: string;
  description?: string | null;
  completionNotes?: string | null;
  dueDate?: string | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}
