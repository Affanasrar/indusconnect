import { http } from "./http";
import type { ApiResponse } from "../types/frontend";
import type {
  FitnessStatus,
  OwnershipType,
  Vehicle,
  VehicleStatus,
  VehicleType,
} from "../types/transport";

export interface CreateVehicleInput {
  vehicleNumber: string;
  vehicleType: VehicleType;
  capacity: number;
  ownershipType: OwnershipType;
  vendorName?: string;
  fitnessStatus: FitnessStatus;
  notes?: string;
}

export interface UpdateVehicleInput {
  vehicleNumber?: string;
  vehicleType?: VehicleType;
  capacity?: number;
  ownershipType?: OwnershipType;
  vendorName?: string;
  status?: VehicleStatus;
  fitnessStatus?: FitnessStatus;
  notes?: string;
}

export async function getVehicles() {
  const response =
    await http.get<ApiResponse<Vehicle[]>>("/vehicles");

  return response.data.data;
}

export async function getVehicleById(id: string) {
  const response =
    await http.get<ApiResponse<Vehicle>>(`/vehicles/${id}`);

  return response.data.data;
}

export async function createVehicle(data: CreateVehicleInput) {
  const response =
    await http.post<ApiResponse<Vehicle>>("/vehicles", data);

  return response.data.data;
}

export async function updateVehicle(
  id: string,
  data: UpdateVehicleInput
) {
  const response =
    await http.patch<ApiResponse<Vehicle>>(`/vehicles/${id}`, data);

  return response.data.data;
}

export async function deactivateVehicle(id: string) {
  const response =
    await http.patch<ApiResponse<Vehicle>>(
      `/vehicles/${id}/deactivate`
    );

  return response.data.data;
}