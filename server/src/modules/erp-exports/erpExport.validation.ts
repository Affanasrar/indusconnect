import { PayrollExportFormat } from "@prisma/client";
import { z } from "zod";

export const createPayrollExportSchema = z.object({
  format: z.nativeEnum(PayrollExportFormat).optional(),
  notes: z.string().optional(),

  expenseClaimIds: z.array(z.string().uuid()).optional(),
  vendorBillIds: z.array(z.string().uuid()).optional(),
  travelRequestIds: z.array(z.string().uuid()).optional(),
});

export const markExportFailedSchema = z.object({
  failureReason: z.string().min(2, "Failure reason is required"),
});

export type CreatePayrollExportInput = z.infer<
  typeof createPayrollExportSchema
>;

export type MarkExportFailedInput = z.infer<typeof markExportFailedSchema>;