import type { Vehicle, TransportRoute } from "./transport";

export type VendorStatus = "ACTIVE" | "INACTIVE" | "BLACKLISTED";

export type VendorContractType =
  | "MONTHLY"
  | "PER_TRIP"
  | "PER_KM"
  | "ON_DEMAND";

export type VendorBillStatus = "PENDING" | "APPROVED" | "REJECTED" | "PAID";

export type PayrollSyncStatus =
  | "NOT_READY"
  | "READY_FOR_EXPORT"
  | "EXPORTED";

export interface Vendor {
  id: string;
  vendorName: string;
  contactPerson?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  contractType: VendorContractType;
  status: VendorStatus;
  contractStartDate?: string | null;
  contractEndDate?: string | null;
  notes?: string | null;
  vehicles?: Vehicle[];
  routes?: TransportRoute[];
  bills?: VendorBill[];
  createdAt?: string;
  updatedAt?: string;
}

export interface VendorBill {
  id: string;
  vendorId: string;
  vendor?: Vendor;
  routeId?: string | null;
  route?: TransportRoute | null;
  billNumber: string;
  billDate: string;
  amount: number;
  currency: string;
  description?: string | null;
  status: VendorBillStatus;
  financeRemarks?: string | null;
  approvedAt?: string | null;
  paidAt?: string | null;
  payrollSyncStatus: PayrollSyncStatus;
  exportedAt?: string | null;
  payrollExportId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}
