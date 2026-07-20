import { http } from "./http";
import type { ApiResponse } from "../types/frontend";
import type {
  VehicleTelemetryLog,
  TelemetryStatus,
  TelemetrySource,
} from "../types/telemetry";

export interface CreateTelemetryInput {
  routeId?: string;
  transportTripId?: string;
  vehicleId?: string;
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
  status?: TelemetryStatus;
  source?: TelemetrySource;
  batteryLevel?: number;
  accuracy?: number;
  remarks?: string;
}

export async function createTelemetryLog(data: CreateTelemetryInput) {
  const response = await http.post<ApiResponse<VehicleTelemetryLog>>(
    "/telemetry/update",
    data
  );
  return response.data.data;
}

export async function getMyTelemetryLogs() {
  const response = await http.get<ApiResponse<VehicleTelemetryLog[]>>(
    "/telemetry/my"
  );
  return response.data.data;
}

export async function getLiveLocations() {
  const response = await http.get<ApiResponse<VehicleTelemetryLog[]>>(
    "/telemetry/live"
  );
  return response.data.data;
}

export async function getEmergencyTelemetryEvents() {
  const response = await http.get<ApiResponse<VehicleTelemetryLog[]>>(
    "/telemetry/emergency"
  );
  return response.data.data;
}

export async function getTelemetryByRoute(routeId: string) {
  const response = await http.get<ApiResponse<VehicleTelemetryLog[]>>(
    `/telemetry/routes/${routeId}`
  );
  return response.data.data;
}

export async function getTelemetryByDriver(driverId: string) {
  const response = await http.get<ApiResponse<VehicleTelemetryLog[]>>(
    `/telemetry/drivers/${driverId}`
  );
  return response.data.data;
}
