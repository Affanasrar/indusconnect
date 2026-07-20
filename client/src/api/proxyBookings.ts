import { http } from "./http";
import type { ApiResponse } from "../types/frontend";
import type { TravelRequest } from "../types/travel";
import type { ShuttleBooking } from "../types/shuttle";
import type { ProxyBookingSummary, MyCreatedProxySummary } from "../types/proxyBooking";
import type { ShiftType } from "../types/transport";
import type { TravelType, TravelUrgency } from "../types/travel";

export interface ProxyTravelRequestInput {
  employeeId: string;
  travelType: TravelType;
  urgency?: TravelUrgency;
  purpose: string;
  fromLocation: string;
  toLocation: string;
  departureDate: string;
  returnDate?: string;
  accommodationRequired?: boolean;
  transportRequired?: boolean;
  estimatedBudget?: number;
  employeeRemarks?: string;
  proxyReason: string;
}

export interface ProxyShuttleBookingInput {
  employeeId: string;
  bookingDate: string;
  shiftType: ShiftType;
  pickupArea: string;
  pickupAddress?: string;
  remarks?: string;
  proxyReason: string;
}

export async function createProxyTravelRequest(data: ProxyTravelRequestInput) {
  const response = await http.post<ApiResponse<TravelRequest>>(
    "/proxy-bookings/travel-requests",
    data
  );
  return response.data.data;
}

export async function createProxyShuttleBooking(data: ProxyShuttleBookingInput) {
  const response = await http.post<ApiResponse<ShuttleBooking>>(
    "/proxy-bookings/shuttle-bookings",
    data
  );
  return response.data.data;
}

export async function getMyCreatedProxyRecords() {
  const response = await http.get<ApiResponse<MyCreatedProxySummary>>(
    "/proxy-bookings/my-created"
  );
  return response.data.data;
}

export async function getAllProxyRecords() {
  const response = await http.get<ApiResponse<ProxyBookingSummary>>(
    "/proxy-bookings/all"
  );
  return response.data.data;
}
