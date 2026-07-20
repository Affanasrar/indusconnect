import { http } from "./http";
import type { ApiResponse } from "../types/frontend";
import type {
  ReportDashboardSummary,
  ReportPendingApprovalsSummary,
  ReportTransportSummary,
  ReportTravelSummary,
  ReportAccommodationSummary,
  ReportExpenseSummary,
} from "../types/report";

export async function getDashboardSummary() {
  const response = await http.get<ApiResponse<ReportDashboardSummary>>("/reports/dashboard");
  return response.data.data;
}

export async function getMyDashboardSummary() {
  const response = await http.get<ApiResponse<any>>("/reports/my");
  return response.data.data;
}

export async function getPendingApprovalsSummary() {
  const response = await http.get<ApiResponse<ReportPendingApprovalsSummary>>("/reports/pending-approvals");
  return response.data.data;
}

export async function getTransportSummary() {
  const response = await http.get<ApiResponse<ReportTransportSummary>>("/reports/transport");
  return response.data.data;
}

export async function getTravelSummary() {
  const response = await http.get<ApiResponse<ReportTravelSummary>>("/reports/travel");
  return response.data.data;
}

export async function getAccommodationSummary() {
  const response = await http.get<ApiResponse<ReportAccommodationSummary>>("/reports/accommodation");
  return response.data.data;
}

export async function getExpenseSummary() {
  const response = await http.get<ApiResponse<ReportExpenseSummary>>("/reports/expenses");
  return response.data.data;
}
