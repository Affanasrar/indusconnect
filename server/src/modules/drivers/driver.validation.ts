import { DriverStatus } from "@prisma/client";
import { z } from "zod";

export const createDriverSchema = z.object({
  userId: z.string().uuid("Valid userId is required"),
  licenseNumber: z.string().min(3, "License number is required"),
  cnic: z.string().optional(),
  address: z.string().optional(),
  vehicleId: z.string().uuid("Valid vehicleId is required").optional(),
});

export const updateDriverSchema = z.object({
  licenseNumber: z.string().min(3, "License number is required").optional(),
  cnic: z.string().optional(),
  address: z.string().optional(),
  status: z.nativeEnum(DriverStatus).optional(),
  vehicleId: z.string().uuid("Valid vehicleId is required").nullable().optional(),
});

export type CreateDriverInput = z.infer<typeof createDriverSchema>;
export type UpdateDriverInput = z.infer<typeof updateDriverSchema>;