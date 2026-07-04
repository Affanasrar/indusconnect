import { ExpenseCategory } from "@prisma/client";
import { z } from "zod";

export const createExpenseClaimSchema = z.object({
  travelRequestId: z
    .string()
    .uuid("Valid travelRequestId is required")
    .optional(),

  category: z.nativeEnum(ExpenseCategory),

  claimDate: z.string().min(1, "Claim date is required"),

  vendorName: z.string().optional(),

  amount: z.preprocess(
    (value) => Number(value),
    z.number().positive("Amount must be greater than 0")
  ),

  currency: z.string().optional(),

  description: z.string().optional(),
});

export const financeDecisionSchema = z.object({
  financeRemarks: z.string().optional(),
});

export const flagExpenseClaimSchema = z.object({
  anomalyReason: z.string().min(3, "Anomaly reason is required"),
  financeRemarks: z.string().optional(),
});

export const cancelExpenseClaimSchema = z.object({
  remarks: z.string().optional(),
});

export type CreateExpenseClaimInput = z.infer<
  typeof createExpenseClaimSchema
>;

export type FinanceDecisionInput = z.infer<typeof financeDecisionSchema>;

export type FlagExpenseClaimInput = z.infer<typeof flagExpenseClaimSchema>;

export type CancelExpenseClaimInput = z.infer<typeof cancelExpenseClaimSchema>;