import { http } from "./http";
import type { ApiResponse } from "../types/frontend";
import type { PayrollExport, PayrollExportFormat } from "../types/erpExport";

export interface CreatePayrollExportInput {
  format?: PayrollExportFormat;
  notes?: string;
  expenseClaimIds?: string[];
  vendorBillIds?: string[];
  travelRequestIds?: string[];
}

export interface MarkExportFailedInput {
  failureReason: string;
}

export async function createExpenseClaimsExport(data: CreatePayrollExportInput) {
  const response = await http.post<ApiResponse<PayrollExport>>("/erp-exports/expense-claims", data);
  return response.data.data;
}

export async function createVendorBillsExport(data: CreatePayrollExportInput) {
  const response = await http.post<ApiResponse<PayrollExport>>("/erp-exports/vendor-bills", data);
  return response.data.data;
}

export async function createTravelAllowancesExport(data: CreatePayrollExportInput) {
  const response = await http.post<ApiResponse<PayrollExport>>("/erp-exports/travel-allowances", data);
  return response.data.data;
}

export async function createCombinedPayrollExport(data: CreatePayrollExportInput) {
  const response = await http.post<ApiResponse<PayrollExport>>("/erp-exports/combined", data);
  return response.data.data;
}

export async function getAllPayrollExports() {
  const response = await http.get<ApiResponse<PayrollExport[]>>("/erp-exports");
  return response.data.data;
}

export async function getPayrollExportById(id: string) {
  const response = await http.get<ApiResponse<PayrollExport>>(`/erp-exports/${id}`);
  return response.data.data;
}

export async function markPayrollExportAsSynced(id: string) {
  const response = await http.patch<ApiResponse<PayrollExport>>(`/erp-exports/${id}/synced`);
  return response.data.data;
}

export async function markPayrollExportAsFailed(id: string, data: MarkExportFailedInput) {
  const response = await http.patch<ApiResponse<PayrollExport>>(`/erp-exports/${id}/failed`, data);
  return response.data.data;
}
