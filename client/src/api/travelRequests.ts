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
  accommodationRequired?: boolean;
  isEmergency: boolean;
  notes?: string;
}

export interface TravelDecisionInput {
  managerRemarks?: string;
  decisionRemarks?: string;
}

export interface CancelTravelRequestInput {
  remarks?: string;
  employeeRemarks?: string;
}

type TravelRequestListPayload =
  | TravelRequest[]
  | {
      requests?: TravelRequest[];
      travelRequests?: TravelRequest[];
      items?: TravelRequest[];
    };

function normalizeTravelRequest(req: any): TravelRequest {
  if (!req || typeof req !== "object") return req;
  const isAccom = Boolean(req.accommodationRequired ?? req.requiresAccommodation);
  return {
    ...req,
    accommodationRequired: isAccom,
    requiresAccommodation: isAccom,
  };
}

function extractTravelRequests(
  payload: TravelRequestListPayload | null | undefined
): TravelRequest[] {
  if (!payload) {
    return [];
  }

  let list: TravelRequest[] = [];
  if (Array.isArray(payload)) {
    list = payload;
  } else {
    list =
      payload.requests ??
      payload.travelRequests ??
      payload.items ??
      [];
  }

  return list.map(normalizeTravelRequest);
}

export async function createTravelRequest(
  data: CreateTravelRequestInput
) {
  const isAccom = Boolean(data.requiresAccommodation ?? data.accommodationRequired);
  const payload = {
    ...data,
    accommodationRequired: isAccom,
    requiresAccommodation: isAccom,
  };

  const response = await http.post<ApiResponse<TravelRequest>>(
    "/travel-requests",
    payload
  );

  return normalizeTravelRequest(response.data.data);
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