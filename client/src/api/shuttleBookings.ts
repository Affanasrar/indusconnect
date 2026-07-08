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

export async function getShuttleBookingById(id: string) {
  const response = await http.get<ApiResponse<ShuttleBooking>>(
    `/shuttle-bookings/${id}`
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