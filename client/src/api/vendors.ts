import { http } from "./http";
import type { ApiResponse } from "../types/frontend";
import type {
  Vendor,
  VendorBill,
  VendorContractType,
  VendorStatus,
} from "../types/vendor";

export interface CreateVendorInput {
  vendorName: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  contractType?: VendorContractType;
  status?: VendorStatus;
  contractStartDate?: string;
  contractEndDate?: string;
  notes?: string;
}

export interface UpdateVendorInput {
  vendorName?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  contractType?: VendorContractType;
  status?: VendorStatus;
  contractStartDate?: string;
  contractEndDate?: string;
  notes?: string;
}

export interface CreateVendorBillInput {
  vendorId: string;
  routeId?: string;
  billNumber: string;
  billDate: string;
  amount: number;
  currency?: string;
  description?: string;
}

export interface UpdateBillStatusInput {
  financeRemarks?: string;
}

export async function getVendors() {
  const response = await http.get<ApiResponse<Vendor[]>>("/vendors");
  return response.data.data;
}

export async function getActiveVendors() {
  const response = await http.get<ApiResponse<Vendor[]>>("/vendors/active");
  return response.data.data;
}

export async function getVendorById(id: string) {
  const response = await http.get<ApiResponse<Vendor>>(`/vendors/${id}`);
  return response.data.data;
}

export async function createVendor(data: CreateVendorInput) {
  const response = await http.post<ApiResponse<Vendor>>("/vendors", data);
  return response.data.data;
}

export async function updateVendor(id: string, data: UpdateVendorInput) {
  const response = await http.patch<ApiResponse<Vendor>>(`/vendors/${id}`, data);
  return response.data.data;
}

export async function deactivateVendor(id: string) {
  const response = await http.patch<ApiResponse<Vendor>>(`/vendors/${id}/deactivate`);
  return response.data.data;
}

export async function assignVendorToVehicle(vehicleId: string, vendorId: string) {
  const response = await http.patch<ApiResponse<any>>(
    `/vendors/vehicles/${vehicleId}/assign`,
    { vendorId }
  );
  return response.data.data;
}

export async function assignVendorToRoute(routeId: string, vendorId: string) {
  const response = await http.patch<ApiResponse<any>>(
    `/vendors/routes/${routeId}/assign`,
    { vendorId }
  );
  return response.data.data;
}

export async function createVendorBill(data: CreateVendorBillInput) {
  const response = await http.post<ApiResponse<VendorBill>>("/vendors/bills", data);
  return response.data.data;
}

export async function getVendorBills() {
  const response = await http.get<ApiResponse<VendorBill[]>>("/vendors/bills/all");
  return response.data.data;
}

export async function getPendingVendorBills() {
  const response = await http.get<ApiResponse<VendorBill[]>>("/vendors/bills/pending");
  return response.data.data;
}

export async function getVendorBillById(id: string) {
  const response = await http.get<ApiResponse<VendorBill>>(`/vendors/bills/${id}`);
  return response.data.data;
}

export async function approveVendorBill(id: string, data: UpdateBillStatusInput) {
  const response = await http.patch<ApiResponse<VendorBill>>(
    `/vendors/bills/${id}/approve`,
    data
  );
  return response.data.data;
}

export async function rejectVendorBill(id: string, data: UpdateBillStatusInput) {
  const response = await http.patch<ApiResponse<VendorBill>>(
    `/vendors/bills/${id}/reject`,
    data
  );
  return response.data.data;
}

export async function payVendorBill(id: string) {
  const response = await http.patch<ApiResponse<VendorBill>>(`/vendors/bills/${id}/pay`);
  return response.data.data;
}
