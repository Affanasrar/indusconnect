import { http } from "./http";
import type { ApiResponse } from "../types/frontend";
import type {
  Driver,
  DriverStatus,
  TransportDropdowns,
} from "../types/transport";

export interface CreateDriverInput {
  userId: string;
  licenseNumber: string;
  cnic?: string;
  address?: string;
  vehicleId?: string;
}

export interface UpdateDriverInput {
  licenseNumber?: string;
  cnic?: string;
  address?: string;
  status?: DriverStatus;
  vehicleId?: string;
}

export async function getDrivers() {
  const response =
    await http.get<ApiResponse<Driver[]>>("/drivers");

  return response.data.data;
}

export async function getDriverById(id: string) {
  const response =
    await http.get<ApiResponse<Driver>>(`/drivers/${id}`);

  return response.data.data;
}

export async function createDriver(data: CreateDriverInput) {
  const response =
    await http.post<ApiResponse<Driver>>("/drivers", data);

  return response.data.data;
}

export async function updateDriver(
  id: string,
  data: UpdateDriverInput
) {
  const response =
    await http.patch<ApiResponse<Driver>>(`/drivers/${id}`, data);

  return response.data.data;
}

export async function deactivateDriver(id: string) {
  const response =
    await http.patch<ApiResponse<Driver>>(
      `/drivers/${id}/deactivate`
    );

  return response.data.data;
}

export async function getTransportDropdowns() {
  const response =
    await http.get<ApiResponse<TransportDropdowns>>(
      "/frontend/dropdowns/transport"
    );

  return response.data.data;
}