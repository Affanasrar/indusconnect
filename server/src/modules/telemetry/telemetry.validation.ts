import { TelemetrySource, TelemetryStatus } from "@prisma/client";
import { z } from "zod";

const numberFromInput = (message: string) =>
  z.preprocess((value) => Number(value), z.number({ message }));

export const createTelemetrySchema = z.object({
  routeId: z.string().uuid("Valid routeId is required").optional(),
  vehicleId: z.string().uuid("Valid vehicleId is required").optional(),
  transportTripId: z.string().uuid("Valid transportTripId is required").optional(),

  latitude: numberFromInput("Latitude is required").refine(
    (value) => value >= -90 && value <= 90,
    "Latitude must be between -90 and 90"
  ),

  longitude: numberFromInput("Longitude is required").refine(
    (value) => value >= -180 && value <= 180,
    "Longitude must be between -180 and 180"
  ),

  speed: numberFromInput("Speed must be a number").optional(),
  heading: numberFromInput("Heading must be a number").optional(),

  status: z.nativeEnum(TelemetryStatus).optional(),
  source: z.nativeEnum(TelemetrySource).optional(),

  batteryLevel: z
    .preprocess((value) => Number(value), z.number().int().min(0).max(100))
    .optional(),

  accuracy: numberFromInput("Accuracy must be a number").optional(),
  remarks: z.string().optional(),
});

export type CreateTelemetryInput = z.infer<typeof createTelemetrySchema>;