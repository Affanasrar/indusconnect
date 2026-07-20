import type { HRGrade } from "./frontend";

export type PolicyRuleType =
  | "TRAVEL_APPROVAL"
  | "EXPENSE_LIMIT"
  | "ACCOMMODATION_FALLBACK"
  | "TRANSPORT_CUTOFF";

export type PolicyRuleStatus = "ACTIVE" | "INACTIVE";

export type PolicyDecisionStatus =
  | "PASSED"
  | "WARNING"
  | "REVIEW_REQUIRED"
  | "BLOCKED";

export interface PolicyDecisionLog {
  id: string;
  policyRuleId?: string | null;
  policyRule?: PolicyRule | null;
  userId?: string | null;
  user?: {
    id: string;
    fullName: string;
    email: string;
  } | null;
  entityType: string;
  entityId: string;
  decision: PolicyDecisionStatus;
  message: string;
  createdAt: string;
}

export interface PolicyRule {
  id: string;
  ruleName: string;
  ruleCode: string;
  ruleType: PolicyRuleType;
  status: PolicyRuleStatus;
  department?: string | null;
  hrGrade?: HRGrade | null;
  maxAmount?: number | null;
  requiresManagerApproval: boolean;
  requiresFinanceApproval: boolean;
  requiresTransportApproval: boolean;
  requiresAccommodationApproval: boolean;
  allowEmergencyOverride: boolean;
  cutoffHoursBeforeShift?: number | null;
  internalFirstRequired: boolean;
  description?: string | null;
  decisionLogs?: PolicyDecisionLog[];
  createdAt?: string;
  updatedAt?: string;
}
