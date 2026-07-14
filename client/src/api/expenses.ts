import { http } from "./http";
import type { ApiResponse } from "../types/frontend";
import type {
  ExpenseCategory,
  ExpenseClaim,
} from "../types/expense";

export interface CreateExpenseClaimInput {
  travelRequestId?: string;
  category: ExpenseCategory;
  expenseDate: string;
  amount: number;
  currency?: string;
  description: string;
  receiptUrl?: string;
}

export interface ExpenseReviewInput {
  remarks?: string;
}

export interface MarkExpensePaidInput {
  paymentReference: string;
  remarks?: string;
}

type ExpenseListPayload =
  | ExpenseClaim[]
  | {
      claims?: ExpenseClaim[];
      expenses?: ExpenseClaim[];
      items?: ExpenseClaim[];
    };

function extractExpenseClaims(
  payload: ExpenseListPayload | null | undefined
): ExpenseClaim[] {
  if (!payload) {
    return [];
  }

  if (Array.isArray(payload)) {
    return payload;
  }

  return (
    payload.claims ??
    payload.expenses ??
    payload.items ??
    []
  );
}

export async function createExpenseClaim(
  data: CreateExpenseClaimInput
) {
  const response = await http.post<ApiResponse<ExpenseClaim>>(
    "/expenses",
    data
  );

  return response.data.data;
}

export async function getMyExpenseClaims() {
  const response = await http.get<
    ApiResponse<ExpenseListPayload>
  >("/expenses/my");

  return extractExpenseClaims(response.data.data);
}

export async function getAllExpenseClaims() {
  const response = await http.get<
    ApiResponse<ExpenseListPayload>
  >("/expenses");

  return extractExpenseClaims(response.data.data);
}

export async function submitExpenseClaim(id: string) {
  const response = await http.patch<ApiResponse<ExpenseClaim>>(
    `/expenses/${id}/submit`
  );

  return response.data.data;
}

export async function cancelExpenseClaim(
  id: string,
  remarks?: string
) {
  const response = await http.patch<ApiResponse<ExpenseClaim>>(
    `/expenses/${id}/cancel`,
    {
      remarks,
    }
  );

  return response.data.data;
}

export async function managerApproveExpenseClaim(
  id: string,
  data: ExpenseReviewInput
) {
  const response = await http.patch<ApiResponse<ExpenseClaim>>(
    `/expenses/${id}/manager-approve`,
    data
  );

  return response.data.data;
}

export async function managerRejectExpenseClaim(
  id: string,
  data: ExpenseReviewInput
) {
  const response = await http.patch<ApiResponse<ExpenseClaim>>(
    `/expenses/${id}/manager-reject`,
    data
  );

  return response.data.data;
}

export async function financeApproveExpenseClaim(
  id: string,
  data: ExpenseReviewInput
) {
  const response = await http.patch<ApiResponse<ExpenseClaim>>(
    `/expenses/${id}/finance-approve`,
    data
  );

  return response.data.data;
}

export async function financeRejectExpenseClaim(
  id: string,
  data: ExpenseReviewInput
) {
  const response = await http.patch<ApiResponse<ExpenseClaim>>(
    `/expenses/${id}/finance-reject`,
    data
  );

  return response.data.data;
}

export async function markExpenseClaimPaid(
  id: string,
  data: MarkExpensePaidInput
) {
  const response = await http.patch<ApiResponse<ExpenseClaim>>(
    `/expenses/${id}/mark-paid`,
    data
  );

  return response.data.data;
}