import { http } from "./http";
import type { ApiResponse } from "../types/frontend";
import type { ShiftType } from "../types/transport";
import type { ShuttleBooking } from "../types/shuttle";

export interface CreateShuttleBookingInput {
  bookingDate: string;
  shiftType: ShiftType;
  pickupArea: string;
  pickupAddress?: string;
  remarks?: string;
}

export interface AssignShuttleBookingInput {
  routeId: string;
  pickupStopId: string;
  seatNumber: string;
  remarks?: string;
}

export interface CancelShuttleBookingInput {
  remarks?: string;
}

export async function createShuttleBooking(
  data: CreateShuttleBookingInput
) {
  const response = await http.post<ApiResponse<ShuttleBooking>>(
    "/shuttle-bookings",
    data
  );

  return response.data.data;
}

export async function getMyShuttleBookings() {
  const response = await http.get<ApiResponse<ShuttleBooking[]>>(
    "/shuttle-bookings/my"
  );

  return response.data.data;
}

export async function getAllShuttleBookings() {
  const response = await http.get<ApiResponse<ShuttleBooking[]>>(
    "/shuttle-bookings"
  );

  return response.data.data;
}

export async function getShuttleBookingById(id: string) {
  const response = await http.get<ApiResponse<ShuttleBooking>>(
    `/shuttle-bookings/${id}`
  );

  return response.data.data;
}

export async function assignShuttleBooking(
  id: string,
  data: AssignShuttleBookingInput
) {
  const response = await http.patch<ApiResponse<ShuttleBooking>>(
    `/shuttle-bookings/${id}/assign`,
    data
  );

  return response.data.data;
}

export async function cancelShuttleBooking(
  id: string,
  data: CancelShuttleBookingInput = {}
) {
  const response = await http.patch<ApiResponse<ShuttleBooking>>(
    `/shuttle-bookings/${id}/cancel`,
    data
  );

  return response.data.data;
}

export interface CreateShuttleSubscriptionInput {
  routeId: string;
  pickupStopId: string;
  shiftType: ShiftType;
  activeDays: number[];
  isProxyBooking?: boolean;
  proxyCreatedById?: string;
  proxyReason?: string;
}

import type { ShuttleSubscription } from "../types/shuttle";

export async function createShuttleSubscription(data: CreateShuttleSubscriptionInput) {
  const response = await http.post<ApiResponse<ShuttleSubscription>>(
    "/shuttle-bookings/subscriptions",
    data
  );
  return response.data.data;
}

export async function getMyShuttleSubscriptions() {
  const response = await http.get<ApiResponse<ShuttleSubscription[]>>(
    "/shuttle-bookings/subscriptions/my"
  );
  return response.data.data;
}

export async function deactivateShuttleSubscription(id: string) {
  const response = await http.patch<ApiResponse<ShuttleSubscription>>(
    `/shuttle-bookings/subscriptions/${id}/deactivate`
  );
  return response.data.data;
}