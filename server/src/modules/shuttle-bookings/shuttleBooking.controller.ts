import { Request, Response } from "express";
import {
  assignShuttleBookingSchema,
  cancelShuttleBookingSchema,
  createShuttleBookingSchema,
} from "./shuttleBooking.validation";
import {
  assignShuttleBooking,
  cancelShuttleBooking,
  createShuttleBooking,
  getAllShuttleBookings,
  getMyShuttleBookings,
  getShuttleBookingById,
} from "./shuttleBooking.service";

export async function createShuttleBookingController(
  req: Request,
  res: Response
) {
  try {
    const validatedData = createShuttleBookingSchema.parse(req.body);
    const currentUser = (req as any).user;

    const booking = await createShuttleBooking(
      currentUser.userId,
      validatedData
    );

    return res.status(201).json({
      success: true,
      message: "Shuttle booking created successfully",
      data: booking,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to create shuttle booking",
    });
  }
}

export async function getMyShuttleBookingsController(
  req: Request,
  res: Response
) {
  try {
    const currentUser = (req as any).user;

    const bookings = await getMyShuttleBookings(currentUser.userId);

    return res.status(200).json({
      success: true,
      message: "My shuttle bookings fetched successfully",
      data: bookings,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch my shuttle bookings",
    });
  }
}

export async function getAllShuttleBookingsController(
  _req: Request,
  res: Response
) {
  try {
    const bookings = await getAllShuttleBookings();

    return res.status(200).json({
      success: true,
      message: "Shuttle bookings fetched successfully",
      data: bookings,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch shuttle bookings",
    });
  }
}

export async function getShuttleBookingByIdController(
  req: Request,
  res: Response
) {
  try {
    const booking = await getShuttleBookingById(String(req.params.id));

    return res.status(200).json({
      success: true,
      message: "Shuttle booking fetched successfully",
      data: booking,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Shuttle booking not found",
    });
  }
}

export async function assignShuttleBookingController(
  req: Request,
  res: Response
) {
  try {
    const validatedData = assignShuttleBookingSchema.parse(req.body);

    const booking = await assignShuttleBooking(String(req.params.id), validatedData);

    return res.status(200).json({
      success: true,
      message: "Shuttle booking assigned successfully",
      data: booking,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to assign shuttle booking",
    });
  }
}

export async function cancelShuttleBookingController(
  req: Request,
  res: Response
) {
  try {
    const validatedData = cancelShuttleBookingSchema.parse(req.body);
    const currentUser = (req as any).user;

    const booking = await cancelShuttleBooking(
      String(req.params.id),
      currentUser,
      validatedData
    );

    return res.status(200).json({
      success: true,
      message: "Shuttle booking cancelled successfully",
      data: booking,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to cancel shuttle booking",
    });
  }
}