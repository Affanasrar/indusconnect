import { http } from "./http";
import type { ApiResponse } from "../types/frontend";
import type {
  VehicleMaintenanceTask,
  HousekeepingTask,
  MaintenanceTaskType,
  MaintenancePriority,
  MaintenanceTaskStatus,
  HousekeepingTaskType,
  HousekeepingPriority,
  HousekeepingTaskStatus,
} from "../types/maintenance";

export interface CreateVehicleMaintenanceTaskInput {
  vehicleId: string;
  driverId?: string;
  transportTripId?: string;
  telemetryLogId?: string;
  assignedToId?: string;
  taskType: MaintenanceTaskType;
  priority?: MaintenancePriority;
  title: string;
  description?: string;
}

export interface UpdateVehicleMaintenanceTaskInput {
  assignedToId?: string;
  taskType?: MaintenanceTaskType;
  priority?: MaintenancePriority;
  status?: MaintenanceTaskStatus;
  title?: string;
  description?: string;
  resolutionNotes?: string;
}

export interface CreateHousekeepingTaskInput {
  roomId: string;
  reservationId?: string;
  assignedToId?: string;
  taskType?: HousekeepingTaskType;
  priority?: HousekeepingPriority;
  title: string;
  description?: string;
  dueDate?: string;
}

export interface UpdateHousekeepingTaskInput {
  assignedToId?: string;
  taskType?: HousekeepingTaskType;
  priority?: HousekeepingPriority;
  status?: HousekeepingTaskStatus;
  title?: string;
  description?: string;
  dueDate?: string;
  completionNotes?: string;
}

export async function createVehicleMaintenanceTask(data: CreateVehicleMaintenanceTaskInput) {
  const response = await http.post<ApiResponse<VehicleMaintenanceTask>>("/maintenance/vehicle-tasks", data);
  return response.data.data;
}

export async function getAllVehicleMaintenanceTasks() {
  const response = await http.get<ApiResponse<VehicleMaintenanceTask[]>>("/maintenance/vehicle-tasks");
  return response.data.data;
}

export async function getOpenVehicleMaintenanceTasks() {
  const response = await http.get<ApiResponse<VehicleMaintenanceTask[]>>("/maintenance/vehicle-tasks/open");
  return response.data.data;
}

export async function getVehicleMaintenanceTaskById(id: string) {
  const response = await http.get<ApiResponse<VehicleMaintenanceTask>>(`/maintenance/vehicle-tasks/${id}`);
  return response.data.data;
}

export async function updateVehicleMaintenanceTask(id: string, data: UpdateVehicleMaintenanceTaskInput) {
  const response = await http.patch<ApiResponse<VehicleMaintenanceTask>>(`/maintenance/vehicle-tasks/${id}`, data);
  return response.data.data;
}

export async function startVehicleMaintenanceTask(id: string) {
  const response = await http.patch<ApiResponse<VehicleMaintenanceTask>>(`/maintenance/vehicle-tasks/${id}/start`);
  return response.data.data;
}

export async function resolveVehicleMaintenanceTask(id: string, resolutionNotes?: string) {
  const response = await http.patch<ApiResponse<VehicleMaintenanceTask>>(`/maintenance/vehicle-tasks/${id}/resolve`, {
    resolutionNotes,
  });
  return response.data.data;
}

export async function cancelVehicleMaintenanceTask(id: string) {
  const response = await http.patch<ApiResponse<VehicleMaintenanceTask>>(`/maintenance/vehicle-tasks/${id}/cancel`);
  return response.data.data;
}

export async function createHousekeepingTask(data: CreateHousekeepingTaskInput) {
  const response = await http.post<ApiResponse<HousekeepingTask>>("/maintenance/housekeeping-tasks", data);
  return response.data.data;
}

export async function createHousekeepingTaskAfterCheckout(reservationId: string) {
  const response = await http.post<ApiResponse<HousekeepingTask>>(`/maintenance/housekeeping-tasks/from-checkout/${reservationId}`);
  return response.data.data;
}

export async function getAllHousekeepingTasks() {
  const response = await http.get<ApiResponse<HousekeepingTask[]>>("/maintenance/housekeeping-tasks");
  return response.data.data;
}

export async function getPendingHousekeepingTasks() {
  const response = await http.get<ApiResponse<HousekeepingTask[]>>("/maintenance/housekeeping-tasks/pending");
  return response.data.data;
}

export async function getHousekeepingTaskById(id: string) {
  const response = await http.get<ApiResponse<HousekeepingTask>>(`/maintenance/housekeeping-tasks/${id}`);
  return response.data.data;
}

export async function updateHousekeepingTask(id: string, data: UpdateHousekeepingTaskInput) {
  const response = await http.patch<ApiResponse<HousekeepingTask>>(`/maintenance/housekeeping-tasks/${id}`, data);
  return response.data.data;
}

export async function startHousekeepingTask(id: string) {
  const response = await http.patch<ApiResponse<HousekeepingTask>>(`/maintenance/housekeeping-tasks/${id}/start`);
  return response.data.data;
}

export async function completeHousekeepingTask(id: string, completionNotes?: string) {
  const response = await http.patch<ApiResponse<HousekeepingTask>>(`/maintenance/housekeeping-tasks/${id}/complete`, {
    completionNotes,
  });
  return response.data.data;
}

export async function cancelHousekeepingTask(id: string) {
  const response = await http.patch<ApiResponse<HousekeepingTask>>(`/maintenance/housekeeping-tasks/${id}/cancel`);
  return response.data.data;
}
