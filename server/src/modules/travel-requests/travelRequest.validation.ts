import {
  TravelRequestStatus,
  TravelType,
  TravelUrgency,
} from "@prisma/client";
import { z } from "zod";

export const createTravelRequestSchema = z.object({
  travelType: z.nativeEnum(TravelType),
  urgency: z.nativeEnum(TravelUrgency).optional(),

  purpose: z.string().min(5, "Purpose must be at least 5 characters"),
  fromLocation: z.string().min(2, "From location is required"),
  toLocation: z.string().min(2, "To location is required"),

  departureDate: z.string().min(1, "Departure date is required"),
  returnDate: z.string().optional(),

  accommodationRequired: z.boolean().optional(),
  transportRequired: z.boolean().optional(),
  estimatedBudget: z.number().nonnegative().optional(),

  employeeRemarks: z.string().optional(),
});

export const updateTravelRequestSchema = z.object({
  travelType: z.nativeEnum(TravelType).optional(),
  urgency: z.nativeEnum(TravelUrgency).optional(),

  purpose: z.string().min(5, "Purpose must be at least 5 characters").optional(),
  fromLocation: z.string().min(2, "From location is required").optional(),
  toLocation: z.string().min(2, "To location is required").optional(),

  departureDate: z.string().optional(),
  returnDate: z.string().optional(),

  accommodationRequired: z.boolean().optional(),
  transportRequired: z.boolean().optional(),
  estimatedBudget: z.number().nonnegative().optional(),

  employeeRemarks: z.string().optional(),
});

export const decisionTravelRequestSchema = z.object({
  decisionRemarks: z.string().optional(),
});

export const cancelTravelRequestSchema = z.object({
  employeeRemarks: z.string().optional(),
});

export type CreateTravelRequestInput = z.infer<
  typeof createTravelRequestSchema
>;

export type UpdateTravelRequestInput = z.infer<
  typeof updateTravelRequestSchema
>;

export type DecisionTravelRequestInput = z.infer<
  typeof decisionTravelRequestSchema
>;

export type CancelTravelRequestInput = z.infer<
  typeof cancelTravelRequestSchema
>;