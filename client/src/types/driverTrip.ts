import type { ShuttleBooking } from "./shuttle";
import type {
  Driver,
  SmartStop,
  TransportRoute,
  Vehicle,
} from "./transport";

export type TripStatus =
  | "CHECKLIST_PENDING"
  | "READY"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

export type TripIssueType =
  | "DELAY"
  | "BREAKDOWN"
  | "SOS"
  | "OTHER";

export interface TransportTrip {
  id: string;
  routeId: string;
  route?: TransportRoute;
  driverId: string;
  driver?: Driver;
  status: TripStatus;
  fuelChecked: boolean;
  tiresChecked: boolean;
  brakesChecked: boolean;
  lightsChecked: boolean;
  checklistSubmittedAt?: string | null;
  startedAt?: string | null;
  endedAt?: string | null;
  issueType?: TripIssueType | null;
  issueDescription?: string | null;
  issueLatitude?: number | null;
  issueLongitude?: number | null;
  issueReportedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface AssignedDriverRoute extends TransportRoute {
  trips?: TransportTrip[];
}

export interface DriverRouteManifest {
  route: TransportRoute;
  vehicle?: Vehicle | null;
  driver?: Driver | null;
  smartStops?: SmartStop[];
  bookings: ShuttleBooking[];
  trip?: TransportTrip | null;
}

export interface SafetyChecklistInput {
  fuelChecked: boolean;
  tiresChecked: boolean;
  brakesChecked: boolean;
  lightsChecked: boolean;
}

export interface ReportTripIssueInput {
  issueType: TripIssueType;
  issueDescription?: string;
  issueLatitude?: number;
  issueLongitude?: number;
}