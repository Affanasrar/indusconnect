import { http } from "./http";
import type { ApiResponse } from "../types/frontend";
import type {
  AccommodationDashboardData,
  AccommodationRoom,
  AccommodationSource,
  ReservationStatus,
  RoomReservation,
  RoomStatus,
  RoomType,
} from "../types/accommodation";
import type { TravelRequest } from "../types/travel";

export interface CreateRoomInput {
  roomNumber: string;
  roomType: RoomType;
  capacity: number;
  facilityName: string;
  city: string;
  location?: string;
  dailyRate: number;
  notes?: string;
}

export interface UpdateRoomInput {
  roomNumber?: string;
  roomType?: RoomType;
  capacity?: number;
  facilityName?: string;
  city?: string;
  location?: string;
  dailyRate?: number;
  status?: RoomStatus;
  notes?: string;
}

export interface CreateReservationInput {
  travelRequestId: string;
  accommodationSource: AccommodationSource;

  roomId?: string;

  checkInDate: string;
  checkOutDate: string;

  externalProviderName?: string;
  externalAddress?: string;
  externalDailyRate?: number;

  notes?: string;
}

export interface UpdateReservationInput {
  roomId?: string;
  accommodationSource?: AccommodationSource;

  checkInDate?: string;
  checkOutDate?: string;

  externalProviderName?: string;
  externalAddress?: string;
  externalDailyRate?: number;

  status?: ReservationStatus;
  notes?: string;
}

type ListPayload<T> =
  | T[]
  | {
      items?: T[];
      rooms?: T[];
      reservations?: T[];
      requests?: T[];
      travelRequests?: T[];
    };

function extractList<T>(
  payload: ListPayload<T> | null | undefined
): T[] {
  if (!payload) {
    return [];
  }

  if (Array.isArray(payload)) {
    return payload;
  }

  return (
    payload.items ??
    payload.rooms ??
    payload.reservations ??
    payload.requests ??
    payload.travelRequests ??
    []
  );
}

export async function getAccommodationRooms() {
  const response = await http.get<
    ApiResponse<ListPayload<AccommodationRoom>>
  >("/accommodation/rooms");

  return extractList(response.data.data);
}

export async function createAccommodationRoom(
  data: CreateRoomInput
) {
  const response = await http.post<
    ApiResponse<AccommodationRoom>
  >("/accommodation/rooms", data);

  return response.data.data;
}

export async function updateAccommodationRoom(
  id: string,
  data: UpdateRoomInput
) {
  const response = await http.patch<
    ApiResponse<AccommodationRoom>
  >(`/accommodation/rooms/${id}`, data);

  return response.data.data;
}

export async function deactivateAccommodationRoom(
  id: string
) {
  const response = await http.patch<
    ApiResponse<AccommodationRoom>
  >(`/accommodation/rooms/${id}/deactivate`);

  return response.data.data;
}

export async function getAccommodationReservations() {
  const response = await http.get<
    ApiResponse<ListPayload<RoomReservation>>
  >("/accommodation/reservations");

  return extractList(response.data.data);
}

export async function getApprovedAccommodationRequests() {
  const response = await http.get<
    ApiResponse<ListPayload<TravelRequest>>
  >("/accommodation/approved-travel-requests");

  return extractList(response.data.data);
}

export async function createRoomReservation(
  data: CreateReservationInput
) {
  const response = await http.post<
    ApiResponse<RoomReservation>
  >("/accommodation/reservations", data);

  return response.data.data;
}

export async function updateRoomReservation(
  id: string,
  data: UpdateReservationInput
) {
  const response = await http.patch<
    ApiResponse<RoomReservation>
  >(`/accommodation/reservations/${id}`, data);

  return response.data.data;
}

export async function checkInReservation(id: string) {
  const response = await http.patch<
    ApiResponse<RoomReservation>
  >(`/accommodation/reservations/${id}/check-in`);

  return response.data.data;
}

export async function checkOutReservation(id: string) {
  const response = await http.patch<
    ApiResponse<RoomReservation>
  >(`/accommodation/reservations/${id}/check-out`);

  return response.data.data;
}

export async function cancelReservation(id: string) {
  const response = await http.patch<
    ApiResponse<RoomReservation>
  >(`/accommodation/reservations/${id}/cancel`);

  return response.data.data;
}

export async function getAccommodationDashboard(): Promise<AccommodationDashboardData> {
  const [rooms, reservations, approvedTravelRequests] =
    await Promise.all([
      getAccommodationRooms(),
      getAccommodationReservations(),
      getApprovedAccommodationRequests(),
    ]);

  return {
    rooms,
    reservations,
    approvedTravelRequests,
  };
}