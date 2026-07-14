import type { TravelRequest } from "./travel";
import type { UserProfile } from "./frontend";

export type RoomType =
  | "SINGLE"
  | "DOUBLE"
  | "TWIN"
  | "SUITE"
  | "DORMITORY";

export type RoomStatus =
  | "AVAILABLE"
  | "OCCUPIED"
  | "MAINTENANCE"
  | "INACTIVE";

export type ReservationStatus =
  | "RESERVED"
  | "CHECKED_IN"
  | "CHECKED_OUT"
  | "CANCELLED";

export type AccommodationSource =
  | "INTERNAL"
  | "EXTERNAL";

export interface AccommodationRoom {
  id: string;
  roomNumber: string;
  roomType: RoomType;
  capacity: number;

  facilityName: string;
  city: string;
  location?: string | null;

  dailyRate: number;
  status: RoomStatus;

  notes?: string | null;

  createdAt?: string;
  updatedAt?: string;
}

export interface RoomReservation {
  id: string;

  travelRequestId: string;
  travelRequest?: TravelRequest;

  employeeId?: string | null;
  employee?: UserProfile | null;

  roomId?: string | null;
  room?: AccommodationRoom | null;

  accommodationSource: AccommodationSource;

  checkInDate: string;
  checkOutDate: string;

  numberOfNights?: number | null;
  estimatedCost?: number | null;

  externalProviderName?: string | null;
  externalAddress?: string | null;
  externalDailyRate?: number | null;

  status: ReservationStatus;

  notes?: string | null;

  checkedInAt?: string | null;
  checkedOutAt?: string | null;

  createdAt?: string;
  updatedAt?: string;
}

export interface AccommodationDashboardData {
  rooms: AccommodationRoom[];
  reservations: RoomReservation[];
  approvedTravelRequests: TravelRequest[];
}