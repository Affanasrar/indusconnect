import type { UserProfile } from "./frontend";

export type TravelType =
  | "INTER_CAMPUS"
  | "IN_CITY_EVENT"
  | "INTER_CITY"
  | "INTERNATIONAL";

export type TravelMode =
  | "COMPANY_VEHICLE"
  | "BUS"
  | "TRAIN"
  | "AIR"
  | "SELF";

export type TravelRequestStatus =
  | "PENDING"
  | "PENDING_MANAGER_APPROVAL"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED";

export interface TravelRequest {
  id: string;

  employeeId: string;
  employee?: UserProfile;

  travelType: TravelType;
  purpose: string;

  fromLocation: string;
  toLocation: string;

  departureDate: string;
  returnDate: string;

  travelMode: TravelMode;

  requiresAccommodation: boolean;
  isEmergency: boolean;

  notes?: string | null;

  status: TravelRequestStatus;

  managerRemarks?: string | null;

  approvedById?: string | null;
  approvedBy?: UserProfile | null;

  approvedAt?: string | null;
  rejectedAt?: string | null;

  eligibleTravelClass?: string | null;
  approvedTravelClass?: string | null;
  dailyAllowance?: number | null;
  policyRemarks?: string | null;
  policyCompliant?: boolean | null;

  createdAt?: string;
  updatedAt?: string;
}