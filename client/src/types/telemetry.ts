import type { Driver, Vehicle, TransportRoute } from "./transport";
import type { TransportTrip } from "./driverTrip";

export type TelemetryStatus =
  | "MOVING"
  | "STOPPED"
  | "DELAYED"
  | "BREAKDOWN"
  | "SOS"
  | "OFFLINE";

export type TelemetrySource = "MOBILE_GPS" | "MOCK_GPS";

export interface VehicleTelemetryLog {
  id: string;
  driverId: string;
  driver?: Driver;
  vehicleId?: string | null;
  vehicle?: Vehicle | null;
  routeId?: string | null;
  route?: TransportRoute | null;
  transportTripId?: string | null;
  transportTrip?: TransportTrip | null;
  latitude: number;
  longitude: number;
  speed?: number | null;
  heading?: number | null;
  status: TelemetryStatus;
  source: TelemetrySource;
  batteryLevel?: number | null;
  accuracy?: number | null;
  remarks?: string | null;
  recordedAt: string;
  createdAt?: string;
}

export interface LiveTelemetrySummary {
  logs: VehicleTelemetryLog[];
  activeTripsCount: number;
  emergencyCount: number;
}
