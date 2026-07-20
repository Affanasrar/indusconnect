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

// =========================================================================
// SHUTTLE SUBSCRIPTION CONTROLLERS
// =========================================================================

import { createShuttleSubscriptionSchema } from "./shuttleBooking.validation";
import {
  createShuttleSubscription,
  getMyShuttleSubscriptions,
  deactivateShuttleSubscription,
  generateDailyBookingsFromSubscriptions,
} from "./shuttleBooking.service";

export async function createShuttleSubscriptionController(
  req: Request,
  res: Response
) {
  try {
    const validatedData = createShuttleSubscriptionSchema.parse(req.body);
    const currentUser = (req as any).user;

    const subscription = await createShuttleSubscription(
      currentUser.userId,
      validatedData
    );

    return res.status(201).json({
      success: true,
      message: "Standing Shuttle Subscription registered successfully",
      data: subscription,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to create standing shuttle subscription",
    });
  }
}

export async function getMyShuttleSubscriptionsController(
  req: Request,
  res: Response
) {
  try {
    const currentUser = (req as any).user;

    const subscriptions = await getMyShuttleSubscriptions(currentUser.userId);

    return res.status(200).json({
      success: true,
      message: "My active standing subscriptions fetched successfully",
      data: subscriptions,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch my standing subscriptions",
    });
  }
}

export async function deactivateShuttleSubscriptionController(
  req: Request,
  res: Response
) {
  try {
    const currentUser = (req as any).user;

    const subscription = await deactivateShuttleSubscription(
      String(req.params.id),
      currentUser
    );

    return res.status(200).json({
      success: true,
      message: "Standing Shuttle Subscription dropped successfully",
      data: subscription,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to drop standing subscription",
    });
  }
}

// Admin developer triggers to run generator manually for testing/cron simulation
export async function triggerDailyAutoBookingsController(
  _req: Request,
  res: Response
) {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const count = await generateDailyBookingsFromSubscriptions(tomorrow);

    return res.status(200).json({
      success: true,
      message: `Triggered nightly auto-booking generation for tomorrow. Created ${count} bookings.`,
      data: { created: count },
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to trigger auto-bookings generation",
    });
  }
}