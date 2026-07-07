export type VehicleType = "BUS" | "VAN" | "CAR" | "COASTER" | "HIACE";

export type VehicleStatus = "ACTIVE" | "INACTIVE" | "MAINTENANCE";

export type OwnershipType = "OWNED" | "VENDOR";

export type FitnessStatus = "VALID" | "EXPIRED" | "PENDING";

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