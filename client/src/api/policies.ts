import { http } from "./http";
import type { ApiResponse } from "../types/frontend";
import type {
  PolicyRule,
  PolicyDecisionLog,
  PolicyRuleType,
  PolicyRuleStatus,
} from "../types/policy";
import type { HRGrade } from "../types/frontend";

export interface CreatePolicyRuleInput {
  ruleName: string;
  ruleCode: string;
  ruleType: PolicyRuleType;
  status?: PolicyRuleStatus;
  department?: string;
  hrGrade?: HRGrade;
  maxAmount?: number;
  requiresManagerApproval?: boolean;
  requiresFinanceApproval?: boolean;
  requiresTransportApproval?: boolean;
  requiresAccommodationApproval?: boolean;
  allowEmergencyOverride?: boolean;
  cutoffHoursBeforeShift?: number;
  internalFirstRequired?: boolean;
  description?: string;
}

export interface UpdatePolicyRuleInput {
  ruleName?: string;
  ruleCode?: string;
  ruleType?: PolicyRuleType;
  status?: PolicyRuleStatus;
  department?: string;
  hrGrade?: HRGrade;
  maxAmount?: number;
  requiresManagerApproval?: boolean;
  requiresFinanceApproval?: boolean;
  requiresTransportApproval?: boolean;
  requiresAccommodationApproval?: boolean;
  allowEmergencyOverride?: boolean;
  cutoffHoursBeforeShift?: number;
  internalFirstRequired?: boolean;
  description?: string;
}

export async function getPolicyRules() {
  const response = await http.get<ApiResponse<PolicyRule[]>>("/policies");
  return response.data.data;
}

export async function getActivePolicyRules() {
  const response = await http.get<ApiResponse<PolicyRule[]>>("/policies/active");
  return response.data.data;
}

export async function getPolicyRuleById(id: string) {
  const response = await http.get<ApiResponse<PolicyRule>>(`/policies/${id}`);
  return response.data.data;
}

export async function createPolicyRule(data: CreatePolicyRuleInput) {
  const response = await http.post<ApiResponse<PolicyRule>>("/policies", data);
  return response.data.data;
}

export async function updatePolicyRule(id: string, data: UpdatePolicyRuleInput) {
  const response = await http.patch<ApiResponse<PolicyRule>>(`/policies/${id}`, data);
  return response.data.data;
}

export async function deactivatePolicyRule(id: string) {
  const response = await http.patch<ApiResponse<PolicyRule>>(`/policies/${id}/deactivate`);
  return response.data.data;
}

export async function getPolicyDecisionLogs() {
  const response = await http.get<ApiResponse<PolicyDecisionLog[]>>("/policies/decision-logs");
  return response.data.data;
}

export async function evaluateTravelRequestPolicy(id: string) {
  const response = await http.post<ApiResponse<any>>(`/policies/evaluate/travel-requests/${id}`);
  return response.data.data;
}

export async function evaluateExpenseClaimPolicy(id: string) {
  const response = await http.post<ApiResponse<any>>(`/policies/evaluate/expense-claims/${id}`);
  return response.data.data;
}

export async function evaluateShuttleBookingPolicy(id: string) {
  const response = await http.post<ApiResponse<any>>(`/policies/evaluate/shuttle-bookings/${id}`);
  return response.data.data;
}

export async function evaluateAccommodationPolicy(travelRequestId: string) {
  const response = await http.post<ApiResponse<any>>(`/policies/evaluate/accommodation/${travelRequestId}`);
  return response.data.data;
}
