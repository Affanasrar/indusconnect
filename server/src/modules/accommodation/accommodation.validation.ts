import {
  AccommodationType,
  ReservationStatus,
  RoomStatus,
  RoomType,
} from "@prisma/client";
import { z } from "zod";

export const createRoomSchema = z.object({
  roomNumber: z.string().min(1, "Room number is required"),
  roomType: z.nativeEnum(RoomType),
  capacity: z.number().int().positive("Capacity must be greater than 0"),
  location: z.string().min(2, "Location is required"),
  floor: z.string().optional(),
  status: z.nativeEnum(RoomStatus).optional(),
  notes: z.string().optional(),
});

export const updateRoomSchema = z.object({
  roomNumber: z.string().min(1, "Room number is required").optional(),
  roomType: z.nativeEnum(RoomType).optional(),
  capacity: z.number().int().positive("Capacity must be greater than 0").optional(),
  location: z.string().min(2, "Location is required").optional(),
  floor: z.string().optional(),
  status: z.nativeEnum(RoomStatus).optional(),
  notes: z.string().optional(),
});

export const createInternalReservationSchema = z.object({
  travelRequestId: z.string().uuid("Valid travelRequestId is required"),
  checkInDate: z.string().min(1, "Check-in date is required"),
  checkOutDate: z.string().min(1, "Check-out date is required"),
  remarks: z.string().optional(),
});

export const createExternalReservationSchema = z.object({
  travelRequestId: z.string().uuid("Valid travelRequestId is required"),
  hotelName: z.string().min(2, "Hotel name is required"),
  hotelAddress: z.string().min(2, "Hotel address is required"),
  checkInDate: z.string().min(1, "Check-in date is required"),
  checkOutDate: z.string().min(1, "Check-out date is required"),
  remarks: z.string().optional(),
});

export const updateReservationStatusSchema = z.object({
  status: z.nativeEnum(ReservationStatus),
  remarks: z.string().optional(),
});

export type CreateRoomInput = z.infer<typeof createRoomSchema>;
export type UpdateRoomInput = z.infer<typeof updateRoomSchema>;
export type CreateInternalReservationInput = z.infer<
  typeof createInternalReservationSchema
>;
export type CreateExternalReservationInput = z.infer<
  typeof createExternalReservationSchema
>;
export type UpdateReservationStatusInput = z.infer<
  typeof updateReservationStatusSchema
>;