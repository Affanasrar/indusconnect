import { Request, Response } from "express";
import {
  proxyShuttleBookingSchema,
  proxyTravelRequestSchema,
} from "./proxyBooking.validation";
import {
  createProxyShuttleBooking,
  createProxyTravelRequest,
  getAllProxyRecords,
  getMyCreatedProxyRecords,
} from "./proxyBooking.service";

export async function createProxyTravelRequestController(
  req: Request,
  res: Response
) {
  try {
    const currentUser = (req as any).user;
    const validatedData = proxyTravelRequestSchema.parse(req.body);

    const request = await createProxyTravelRequest(
      currentUser.userId,
      validatedData
    );

    return res.status(201).json({
      success: true,
      message: "Proxy travel request created successfully",
      data: request,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to create proxy travel request",
    });
  }
}

export async function createProxyShuttleBookingController(
  req: Request,
  res: Response
) {
  try {
    const currentUser = (req as any).user;
    const validatedData = proxyShuttleBookingSchema.parse(req.body);

    const booking = await createProxyShuttleBooking(
      currentUser.userId,
      validatedData
    );

    return res.status(201).json({
      success: true,
      message: "Proxy shuttle booking created successfully",
      data: booking,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to create proxy shuttle booking",
    });
  }
}

export async function getMyCreatedProxyRecordsController(
  req: Request,
  res: Response
) {
  try {
    const currentUser = (req as any).user;

    const records = await getMyCreatedProxyRecords(currentUser.userId);

    return res.status(200).json({
      success: true,
      message: "My created proxy records fetched successfully",
      data: records,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch my created proxy records",
    });
  }
}

export async function getAllProxyRecordsController(
  _req: Request,
  res: Response
) {
  try {
    const records = await getAllProxyRecords();

    return res.status(200).json({
      success: true,
      message: "Proxy records fetched successfully",
      data: records,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch proxy records",
    });
  }
}