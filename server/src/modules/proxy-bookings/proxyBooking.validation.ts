import {
  ShiftType,
  TravelType,
  TravelUrgency,
} from "@prisma/client";
import { z } from "zod";

export const proxyTravelRequestSchema = z.object({
  employeeId: z.string().uuid("Valid employeeId is required"),

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
  proxyReason: z.string().min(3, "Proxy reason is required"),
});

export const proxyShuttleBookingSchema = z.object({
  employeeId: z.string().uuid("Valid employeeId is required"),

  bookingDate: z.string().min(1, "Booking date is required"),
  shiftType: z.nativeEnum(ShiftType),
  pickupArea: z.string().min(2, "Pickup area is required"),
  pickupAddress: z.string().optional(),

  remarks: z.string().optional(),
  proxyReason: z.string().min(3, "Proxy reason is required"),
});

export type ProxyTravelRequestInput = z.infer<
  typeof proxyTravelRequestSchema
>;

export type ProxyShuttleBookingInput = z.infer<
  typeof proxyShuttleBookingSchema
>;