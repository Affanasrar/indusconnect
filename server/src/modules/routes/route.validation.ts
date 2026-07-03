import { RouteStatus, ShiftType } from "@prisma/client";
import { z } from "zod";

export const smartStopSchema = z.object({
  stopName: z.string().min(2, "Stop name is required"),
  stopOrder: z.number().int().positive("Stop order must be greater than 0"),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  estimatedTime: z.string().optional(),
});

export const createRouteSchema = z.object({
  routeName: z.string().min(2, "Route name is required"),
  routeCode: z.string().min(2, "Route code is required"),
  shiftType: z.nativeEnum(ShiftType),
  routeDate: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  startLocation: z.string().optional(),
  endLocation: z.string().optional(),
  vehicleId: z.string().uuid("Valid vehicleId is required").optional(),
  driverId: z.string().uuid("Valid driverId is required").optional(),
  status: z.nativeEnum(RouteStatus).optional(),
  notes: z.string().optional(),
  smartStops: z.array(smartStopSchema).optional(),
});

export const updateRouteSchema = z.object({
  routeName: z.string().min(2, "Route name is required").optional(),
  routeCode: z.string().min(2, "Route code is required").optional(),
  shiftType: z.nativeEnum(ShiftType).optional(),
  routeDate: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  startLocation: z.string().optional(),
  endLocation: z.string().optional(),
  vehicleId: z.string().uuid("Valid vehicleId is required").nullable().optional(),
  driverId: z.string().uuid("Valid driverId is required").nullable().optional(),
  status: z.nativeEnum(RouteStatus).optional(),
  notes: z.string().optional(),
});

export const addSmartStopSchema = smartStopSchema;

export const updateSmartStopSchema = z.object({
  stopName: z.string().min(2, "Stop name is required").optional(),
  stopOrder: z.number().int().positive("Stop order must be greater than 0").optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  estimatedTime: z.string().optional(),
});

export type CreateRouteInput = z.infer<typeof createRouteSchema>;
export type UpdateRouteInput = z.infer<typeof updateRouteSchema>;
export type AddSmartStopInput = z.infer<typeof addSmartStopSchema>;
export type UpdateSmartStopInput = z.infer<typeof updateSmartStopSchema>;