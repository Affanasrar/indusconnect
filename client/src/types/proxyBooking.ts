import type { TravelRequest } from "./travel";
import type { ShuttleBooking } from "./shuttle";

export interface ProxyBookingSummary {
  counts: {
    travelRequests: number;
    shuttleBookings: number;
    total: number;
  };
  travelRequests: TravelRequest[];
  shuttleBookings: ShuttleBooking[];
}

export interface MyCreatedProxySummary {
  travelRequests: TravelRequest[];
  shuttleBookings: ShuttleBooking[];
}
