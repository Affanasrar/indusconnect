import { http } from "./http";
import type { ApiResponse } from "../types/frontend";
import type {
  TravelMode,
  TravelRequest,
  TravelType,
} from "../types/travel";

export interface CreateTravelRequestInput {
  travelType: TravelType;
  purpose: string;
  fromLocation: string;
  toLocation: string;
  departureDate: string;
  returnDate: string;
  travelMode: TravelMode;
  requiresAccommodation: boolean;
  isEmergency: boolean;
  notes?: string;
}

export interface TravelDecisionInput {
  managerRemarks?: string;
}

export interface CancelTravelRequestInput {
  remarks?: string;
}

type TravelRequestListPayload =
  | TravelRequest[]
  | {
      requests?: TravelRequest[];
      travelRequests?: TravelRequest[];
      items?: TravelRequest[];
    };

function extractTravelRequests(
  payload: TravelRequestListPayload | null | undefined
): TravelRequest[] {
  if (!payload) {
    return [];
  }

  if (Array.isArray(payload)) {
    return payload;
  }

  return (
    payload.requests ??
    payload.travelRequests ??
    payload.items ??
    []
  );
}

export async function createTravelRequest(
  data: CreateTravelRequestInput
) {
  const response = await http.post<ApiResponse<TravelRequest>>(
    "/travel-requests",
    data
  );

  return response.data.data;
}

export async function getMyTravelRequests() {
  const response = await http.get<
    ApiResponse<TravelRequestListPayload>
  >("/travel-requests/my");

  return extractTravelRequests(response.data.data);
}

export async function getAllTravelRequests() {
  const response = await http.get<
    ApiResponse<TravelRequestListPayload>
  >("/travel-requests");

  return extractTravelRequests(response.data.data);
}

export async function getPendingTravelRequests() {
  const response = await http.get<
    ApiResponse<TravelRequestListPayload>
  >("/travel-requests/pending");

  return extractTravelRequests(response.data.data);
}

export async function getTravelRequestById(id: string) {
  const response = await http.get<ApiResponse<TravelRequest>>(
    `/travel-requests/${id}`
  );

  return response.data.data;
}

export async function approveTravelRequest(
  id: string,
  data: TravelDecisionInput
) {
  const response = await http.patch<ApiResponse<TravelRequest>>(
    `/travel-requests/${id}/approve`,
    data
  );

  return response.data.data;
}

export async function rejectTravelRequest(
  id: string,
  data: TravelDecisionInput
) {
  const response = await http.patch<ApiResponse<TravelRequest>>(
    `/travel-requests/${id}/reject`,
    data
  );

  return response.data.data;
}

export async function cancelTravelRequest(
  id: string,
  data: CancelTravelRequestInput = {}
) {
  const response = await http.patch<ApiResponse<TravelRequest>>(
    `/travel-requests/${id}/cancel`,
    data
  );

  return response.data.data;
}