import { http } from "./http";
import type { ApiResponse } from "../types/frontend";
import type {
  RouteStatus,
  ShiftType,
  SmartStop,
  TransportRoute,
} from "../types/transport";

export interface CreateRouteInput {
  routeName: string;
  routeCode: string;
  shiftType: ShiftType;
  routeDate?: string;
  startTime?: string;
  endTime?: string;
  startLocation?: string;
  endLocation?: string;
  vehicleId?: string;
  driverId?: string;
  vendorId?: string;
  notes?: string;
}

export interface UpdateRouteInput {
  routeName?: string;
  routeCode?: string;
  shiftType?: ShiftType;
  routeDate?: string;
  startTime?: string;
  endTime?: string;
  startLocation?: string;
  endLocation?: string;
  vehicleId?: string;
  driverId?: string;
  vendorId?: string;
  status?: RouteStatus;
  notes?: string;
}

export interface SmartStopInput {
  stopName: string;
  stopOrder: number;
  latitude?: number;
  longitude?: number;
  estimatedTime?: string;
}

export async function getRoutes() {
  const response =
    await http.get<ApiResponse<TransportRoute[]>>("/routes");

  return response.data.data;
}

export async function getRouteById(id: string) {
  const response =
    await http.get<ApiResponse<TransportRoute>>(`/routes/${id}`);

  return response.data.data;
}

export async function createRoute(data: CreateRouteInput) {
  const response =
    await http.post<ApiResponse<TransportRoute>>("/routes", data);

  return response.data.data;
}

export async function updateRoute(
  id: string,
  data: UpdateRouteInput
) {
  const response =
    await http.patch<ApiResponse<TransportRoute>>(`/routes/${id}`, data);

  return response.data.data;
}

export async function cancelRoute(id: string) {
  const response =
    await http.patch<ApiResponse<TransportRoute>>(`/routes/${id}/cancel`);

  return response.data.data;
}

export async function addSmartStop(
  routeId: string,
  data: SmartStopInput
) {
  const response =
    await http.post<ApiResponse<SmartStop>>(
      `/routes/${routeId}/stops`,
      data
    );

  return response.data.data;
}

export async function updateSmartStop(
  stopId: string,
  data: SmartStopInput
) {
  const response =
    await http.patch<ApiResponse<SmartStop>>(
      `/routes/stops/${stopId}`,
      data
    );

  return response.data.data;
}

export async function deleteSmartStop(stopId: string) {
  const response =
    await http.delete<ApiResponse<SmartStop>>(
      `/routes/stops/${stopId}`
    );

  return response.data.data;
}