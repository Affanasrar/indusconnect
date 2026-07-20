import type { UserProfile } from "./frontend";
import type { ExpenseClaim } from "./expense";
import type { TravelRequest } from "./travel";
import type { VendorBill } from "./vendor";

export type PayrollExportType =
  | "EXPENSE_CLAIMS"
  | "VENDOR_BILLS"
  | "TRAVEL_ALLOWANCES"
  | "COMBINED";

export type PayrollExportFormat = "JSON" | "CSV";

export type PayrollExportStatus =
  | "GENERATED"
  | "DOWNLOADED"
  | "SYNCED"
  | "FAILED";

export type PayrollSyncStatus =
  | "NOT_READY"
  | "READY_FOR_EXPORT"
  | "EXPORTED";

export interface PayrollExport {
  id: string;
  exportNumber: string;
  exportType: PayrollExportType;
  format: PayrollExportFormat;
  status: PayrollExportStatus;
  generatedById?: string | null;
  generatedBy?: UserProfile | null;
  totalRecords: number;
  totalAmount: number;
  currency: string;
  payload: any;
  csvContent?: string | null;
  syncedAt?: string | null;
  failureReason?: string | null;
  notes?: string | null;
  expenseClaims?: ExpenseClaim[];
  vendorBills?: VendorBill[];
  travelRequests?: TravelRequest[];
  createdAt: string;
  updatedAt: string;
}
