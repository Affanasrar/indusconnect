import { ShiftType, ShuttleBookingStatus } from "@prisma/client";
import { z } from "zod";

export const createShuttleBookingSchema = z.object({
  bookingDate: z.string().min(1, "Booking date is required"),
  shiftType: z.nativeEnum(ShiftType),
  pickupArea: z.string().min(2, "Pickup area is required"),
  pickupAddress: z.string().optional(),
  remarks: z.string().optional(),
});

export const assignShuttleBookingSchema = z.object({
  routeId: z.string().uuid("Valid routeId is required"),
  pickupStopId: z.string().uuid("Valid pickupStopId is required").optional(),
  seatNumber: z.string().optional(),
  status: z.nativeEnum(ShuttleBookingStatus).optional(),
  remarks: z.string().optional(),
});

export const cancelShuttleBookingSchema = z.object({
  remarks: z.string().optional(),
});

export type CreateShuttleBookingInput = z.infer<
  typeof createShuttleBookingSchema
>;

export type AssignShuttleBookingInput = z.infer<
  typeof assignShuttleBookingSchema
>;

export type CancelShuttleBookingInput = z.infer<
  typeof cancelShuttleBookingSchema
>;

export const createShuttleSubscriptionSchema = z.object({
  routeId: z.string().uuid("Valid Route ID is required"),
  pickupStopId: z.string().uuid("Valid Pickup Stop ID is required"),
  shiftType: z.nativeEnum(ShiftType),
  activeDays: z.array(z.number().int().min(1).max(7)),
  isProxyBooking: z.boolean().optional(),
  proxyCreatedById: z.string().uuid().optional(),
  proxyReason: z.string().optional(),
});

export type CreateShuttleSubscriptionInput = z.infer<
  typeof createShuttleSubscriptionSchema
>;