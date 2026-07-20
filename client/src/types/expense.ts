import type { UserProfile } from "./frontend";
import type { TravelRequest } from "./travel";

export type ExpenseCategory =
  | "TRAVEL"
  | "ACCOMMODATION"
  | "MEAL"
  | "FUEL"
  | "TOLL"
  | "LOCAL_TRANSPORT"
  | "MEDICAL"
  | "OTHER";

export type ExpenseClaimStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "PENDING_MANAGER_REVIEW"
  | "MANAGER_APPROVED"
  | "MANAGER_REJECTED"
  | "PENDING_FINANCE_REVIEW"
  | "FINANCE_APPROVED"
  | "FINANCE_REJECTED"
  | "PAID"
  | "CANCELLED";

export interface ExpenseClaim {
  id: string;

  employeeId: string;
  employee?: UserProfile | null;

  travelRequestId?: string | null;
  travelRequest?: TravelRequest | null;

  category: ExpenseCategory;
  expenseDate: string;

  amount: number | string;
  currency?: string | null;

  description: string;
  receiptUrl?: string | null;

  status: ExpenseClaimStatus;

  managerRemarks?: string | null;
  financeRemarks?: string | null;

  managerReviewedById?: string | null;
  managerReviewedBy?: UserProfile | null;
  managerReviewedAt?: string | null;

  financeReviewedById?: string | null;
  financeReviewedBy?: UserProfile | null;
  financeReviewedAt?: string | null;

  paymentReference?: string | null;
  paidAt?: string | null;

  payrollSyncStatus?: string;
  exportedAt?: string | null;
  payrollExportId?: string | null;

  createdAt?: string;
  updatedAt?: string;
}