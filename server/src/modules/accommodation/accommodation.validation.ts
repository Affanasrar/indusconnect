import { z } from "zod";
import { ReservationStatus, RoomStatus, RoomType } from "@prisma/client";

export const createRoomSchema = z.object({
  roomNumber: z.string().min(1, "Room number is required"),
  roomType: z.nativeEnum(RoomType),
  capacity: z.number().int().positive(),
  facilityName: z.string().min(1, "Facility name is required"),
  city: z.string().min(1, "City is required"),
  location: z.string().optional().nullable(),
  dailyRate: z.number().nonnegative(),
  notes: z.string().optional().nullable(),
});

// Explicitly defined to avoid Zod .partial() errors
export const updateRoomSchema = z.object({
  roomNumber: z.string().min(1, "Room number is required").optional(),
  roomType: z.nativeEnum(RoomType).optional(),
  capacity: z.number().int().positive().optional(),
  facilityName: z.string().min(1, "Facility name is required").optional(),
  city: z.string().min(1, "City is required").optional(),
  location: z.string().optional().nullable(),
  dailyRate: z.number().nonnegative().optional(),
  notes: z.string().optional().nullable(),
  status: z.nativeEnum(RoomStatus).optional(),
});

export const createReservationSchema = z.object({
  travelRequestId: z.string().uuid("Invalid travel request ID"),
  accommodationSource: z.enum(["INTERNAL", "EXTERNAL"]),
  roomId: z.string().uuid("Invalid room ID").optional().nullable(),
  checkInDate: z.string(),
  checkOutDate: z.string(),
  externalProviderName: z.string().optional().nullable(),
  externalAddress: z.string().optional().nullable(),
  externalDailyRate: z.number().nonnegative().optional().nullable(),
  notes: z.string().optional().nullable(),
}).refine(
  (data) => {
    if (data.accommodationSource === "INTERNAL" && !data.roomId) return false;
    if (data.accommodationSource === "EXTERNAL" && !data.externalProviderName) return false;
    return true;
  },
  { message: "Missing required fields based on selected accommodation source" }
);

// Explicitly defined to avoid Zod .partial() errors on refined schemas
export const updateReservationSchema = z.object({
  travelRequestId: z.string().uuid("Invalid travel request ID").optional(),
  accommodationSource: z.enum(["INTERNAL", "EXTERNAL"]).optional(),
  roomId: z.string().uuid("Invalid room ID").optional().nullable(),
  checkInDate: z.string().optional(),
  checkOutDate: z.string().optional(),
  externalProviderName: z.string().optional().nullable(),
  externalAddress: z.string().optional().nullable(),
  externalDailyRate: z.number().nonnegative().optional().nullable(),
  notes: z.string().optional().nullable(),
  status: z.nativeEnum(ReservationStatus).optional(),
});

export const updateReservationStatusSchema = z.object({
  status: z.nativeEnum(ReservationStatus),
  remarks: z.string().optional().nullable(),
});

export type CreateRoomInput = z.infer<typeof createRoomSchema>;
export type UpdateRoomInput = z.infer<typeof updateRoomSchema>;
export type CreateReservationInput = z.infer<typeof createReservationSchema>;
export type UpdateReservationInput = z.infer<typeof updateReservationSchema>;
export type UpdateReservationStatusInput = z.infer<typeof updateReservationStatusSchema>;