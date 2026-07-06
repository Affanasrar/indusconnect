import {
  HRGrade,
  PolicyRuleStatus,
  PolicyRuleType,
} from "@prisma/client";
import { z } from "zod";

export const createPolicyRuleSchema = z.object({
  ruleName: z.string().min(2, "Rule name is required"),
  ruleCode: z.string().min(2, "Rule code is required"),
  ruleType: z.nativeEnum(PolicyRuleType),
  status: z.nativeEnum(PolicyRuleStatus).optional(),

  department: z.string().optional(),
  hrGrade: z.nativeEnum(HRGrade).optional(),

  maxAmount: z.number().nonnegative().optional(),

  requiresManagerApproval: z.boolean().optional(),
  requiresFinanceApproval: z.boolean().optional(),
  requiresTransportApproval: z.boolean().optional(),
  requiresAccommodationApproval: z.boolean().optional(),

  allowEmergencyOverride: z.boolean().optional(),

  cutoffHoursBeforeShift: z.number().int().nonnegative().optional(),
  internalFirstRequired: z.boolean().optional(),

  description: z.string().optional(),
});

export const updatePolicyRuleSchema = z.object({
  ruleName: z.string().min(2, "Rule name is required").optional(),
  ruleCode: z.string().min(2, "Rule code is required").optional(),
  ruleType: z.nativeEnum(PolicyRuleType).optional(),
  status: z.nativeEnum(PolicyRuleStatus).optional(),

  department: z.string().optional(),
  hrGrade: z.nativeEnum(HRGrade).optional(),

  maxAmount: z.number().nonnegative().optional(),

  requiresManagerApproval: z.boolean().optional(),
  requiresFinanceApproval: z.boolean().optional(),
  requiresTransportApproval: z.boolean().optional(),
  requiresAccommodationApproval: z.boolean().optional(),

  allowEmergencyOverride: z.boolean().optional(),

  cutoffHoursBeforeShift: z.number().int().nonnegative().optional(),
  internalFirstRequired: z.boolean().optional(),

  description: z.string().optional(),
});

export type CreatePolicyRuleInput = z.infer<typeof createPolicyRuleSchema>;
export type UpdatePolicyRuleInput = z.infer<typeof updatePolicyRuleSchema>;