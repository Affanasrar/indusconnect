import {
  FitnessStatus,
  OwnershipType,
  VehicleStatus,
  VehicleType,
} from "@prisma/client";
import { z } from "zod";

export const createVehicleSchema = z.object({
  vehicleNumber: z.string().min(2, "Vehicle number is required"),
  vehicleType: z.nativeEnum(VehicleType),
  capacity: z.number().int().positive("Capacity must be greater than 0"),
  ownershipType: z.nativeEnum(OwnershipType).optional(),
  vendorName: z.string().optional(),
  status: z.nativeEnum(VehicleStatus).optional(),
  fitnessStatus: z.nativeEnum(FitnessStatus).optional(),
  notes: z.string().optional(),
});

export const updateVehicleSchema = z.object({
  vehicleNumber: z.string().min(2, "Vehicle number is required").optional(),
  vehicleType: z.nativeEnum(VehicleType).optional(),
  capacity: z.number().int().positive("Capacity must be greater than 0").optional(),
  ownershipType: z.nativeEnum(OwnershipType).optional(),
  vendorName: z.string().optional(),
  status: z.nativeEnum(VehicleStatus).optional(),
  fitnessStatus: z.nativeEnum(FitnessStatus).optional(),
  notes: z.string().optional(),
});

export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;
export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>;