import { http } from "./http";
import type { ApiResponse } from "../types/frontend";
import type {
  AssignedDriverRoute,
  DriverRouteManifest,
  ReportTripIssueInput,
  SafetyChecklistInput,
  TransportTrip,
} from "../types/driverTrip";
import type { ShuttleBooking } from "../types/shuttle";

export async function getMyAssignedDriverRoutes() {
  const response = await http.get<
    ApiResponse<AssignedDriverRoute[]>
  >("/driver-trips/routes");

  return response.data.data;
}

export async function getDriverRouteManifest(routeId: string) {
  const response = await http.get<
    ApiResponse<DriverRouteManifest>
  >(`/driver-trips/manifest/${routeId}`);

  return response.data.data;
}

export async function submitDriverSafetyChecklist(
  routeId: string,
  data: SafetyChecklistInput
) {
  const response = await http.post<ApiResponse<TransportTrip>>(
    `/driver-trips/${routeId}/checklist`,
    data
  );

  return response.data.data;
}

export async function startDriverTrip(routeId: string) {
  const response = await http.post<ApiResponse<TransportTrip>>(
    `/driver-trips/${routeId}/start`
  );

  return response.data.data;
}

export async function markPassengerBoarded(
  routeId: string,
  bookingId: string
) {
  const response = await http.patch<ApiResponse<ShuttleBooking>>(
    `/driver-trips/${routeId}/passengers/${bookingId}/board`
  );

  return response.data.data;
}

export async function markPassengerNoShow(
  routeId: string,
  bookingId: string
) {
  const response = await http.patch<ApiResponse<ShuttleBooking>>(
    `/driver-trips/${routeId}/passengers/${bookingId}/no-show`
  );

  return response.data.data;
}

export async function reportDriverTripIssue(
  routeId: string,
  data: ReportTripIssueInput
) {
  const response = await http.post<ApiResponse<TransportTrip>>(
    `/driver-trips/${routeId}/report-issue`,
    data
  );

  return response.data.data;
}

export async function endDriverTrip(routeId: string) {
  const response = await http.post<ApiResponse<TransportTrip>>(
    `/driver-trips/${routeId}/end`
  );

  return response.data.data;
}