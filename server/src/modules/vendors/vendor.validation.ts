import {
  VendorBillStatus,
  VendorContractType,
  VendorStatus,
} from "@prisma/client";
import { z } from "zod";

export const createVendorSchema = z.object({
  vendorName: z.string().min(2, "Vendor name is required"),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Valid email is required").optional(),
  address: z.string().optional(),
  contractType: z.nativeEnum(VendorContractType).optional(),
  status: z.nativeEnum(VendorStatus).optional(),
  contractStartDate: z.string().optional(),
  contractEndDate: z.string().optional(),
  notes: z.string().optional(),
});

export const updateVendorSchema = z.object({
  vendorName: z.string().min(2, "Vendor name is required").optional(),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Valid email is required").optional(),
  address: z.string().optional(),
  contractType: z.nativeEnum(VendorContractType).optional(),
  status: z.nativeEnum(VendorStatus).optional(),
  contractStartDate: z.string().optional(),
  contractEndDate: z.string().optional(),
  notes: z.string().optional(),
});

export const assignVendorToVehicleSchema = z.object({
  vendorId: z.string().uuid("Valid vendorId is required"),
});

export const assignVendorToRouteSchema = z.object({
  vendorId: z.string().uuid("Valid vendorId is required"),
});

export const createVendorBillSchema = z.object({
  vendorId: z.string().uuid("Valid vendorId is required"),
  routeId: z.string().uuid("Valid routeId is required").optional(),
  billNumber: z.string().min(2, "Bill number is required"),
  billDate: z.string().min(1, "Bill date is required"),
  amount: z.number().positive("Amount must be greater than 0"),
  currency: z.string().optional(),
  description: z.string().optional(),
});

export const updateVendorBillStatusSchema = z.object({
  status: z.nativeEnum(VendorBillStatus),
  financeRemarks: z.string().optional(),
});

export type CreateVendorInput = z.infer<typeof createVendorSchema>;
export type UpdateVendorInput = z.infer<typeof updateVendorSchema>;
export type AssignVendorToVehicleInput = z.infer<
  typeof assignVendorToVehicleSchema
>;
export type AssignVendorToRouteInput = z.infer<
  typeof assignVendorToRouteSchema
>;
export type CreateVendorBillInput = z.infer<typeof createVendorBillSchema>;
export type UpdateVendorBillStatusInput = z.infer<
  typeof updateVendorBillStatusSchema
>;