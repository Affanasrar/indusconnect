import type { UserProfile } from "./frontend";
import type {
  ShiftType,
  SmartStop,
  TransportRoute,
} from "./transport";

export type ShuttleBookingStatus =
  | "PENDING"
  | "ASSIGNED"
  | "CANCELLED"
  | "COMPLETED"
  | "NO_SHOW";

export interface ShuttleBooking {
  id: string;
  employeeId: string;
  employee?: UserProfile;
  routeId?: string | null;
  route?: TransportRoute | null;
  pickupStopId?: string | null;
  pickupStop?: SmartStop | null;
  bookingDate: string;
  shiftType: ShiftType;
  pickupArea: string;
  pickupAddress?: string | null;
  seatNumber?: string | null;
  status: ShuttleBookingStatus;
  remarks?: string | null;
  isProxyBooking?: boolean;
  proxyCreatedById?: string | null;
  proxyReason?: string | null;
  createdAt?: string;
  updatedAt?: string;
}