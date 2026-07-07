import type { UserProfile } from "./frontend";

export type VehicleType = "BUS" | "VAN" | "CAR" | "COASTER" | "HIACE";

export type VehicleStatus = "ACTIVE" | "INACTIVE" | "MAINTENANCE";

export type OwnershipType = "OWNED" | "VENDOR";

export type FitnessStatus = "VALID" | "EXPIRED" | "PENDING";

export type DriverStatus = "AVAILABLE" | "ASSIGNED" | "INACTIVE";

export interface Vehicle {
  id: string;
  vehicleNumber: string;
  vehicleType: VehicleType;
  capacity: number;
  ownershipType: OwnershipType;
  vendorName?: string | null;
  status: VehicleStatus;
  fitnessStatus: FitnessStatus;
  notes?: string | null;
  vendorId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Driver {
  id: string;
  userId: string;
  user: UserProfile;
  licenseNumber: string;
  cnic?: string | null;
  address?: string | null;
  status: DriverStatus;
  vehicleId?: string | null;
  vehicle?: Vehicle | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface TransportDropdowns {
  driverUsers: UserProfile[];
  vehicles: Vehicle[];
  drivers: Driver[];
  routes: unknown[];
  vendors: unknown[];
}