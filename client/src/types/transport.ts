import type { UserProfile } from "./frontend";

export type VehicleType = "BUS" | "VAN" | "CAR" | "COASTER" | "HIACE";

export type VehicleStatus = "ACTIVE" | "INACTIVE" | "MAINTENANCE";

export type OwnershipType = "OWNED" | "VENDOR";

export type FitnessStatus = "VALID" | "EXPIRED" | "PENDING";

export type DriverStatus = "AVAILABLE" | "ASSIGNED" | "INACTIVE";

export type RouteStatus = "DRAFT" | "ACTIVE" | "COMPLETED" | "CANCELLED";

export type ShiftType =
  | "MORNING"
  | "AFTERNOON"
  | "EVENING"
  | "NIGHT"
  | "GENERAL";

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

export interface Vendor {
  id: string;
  vendorName: string;
  contactPerson?: string | null;
  phone?: string | null;
  email?: string | null;
  status?: string;
}

export interface SmartStop {
  id: string;
  routeId: string;
  stopName: string;
  stopOrder: number;
  latitude?: number | null;
  longitude?: number | null;
  estimatedTime?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface TransportRoute {
  id: string;
  routeName: string;
  routeCode: string;
  shiftType: ShiftType;
  routeDate?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  startLocation?: string | null;
  endLocation?: string | null;
  vehicleId?: string | null;
  vehicle?: Vehicle | null;
  driverId?: string | null;
  driver?: Driver | null;
  vendorId?: string | null;
  vendor?: Vendor | null;
  status: RouteStatus;
  notes?: string | null;
  smartStops: SmartStop[];
  createdAt?: string;
  updatedAt?: string;
}

export interface TransportDropdowns {
  driverUsers: UserProfile[];
  vehicles: Vehicle[];
  drivers: Driver[];
  routes: TransportRoute[];
  vendors: Vendor[];
}