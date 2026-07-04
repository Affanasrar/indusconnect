import { Request, Response } from "express";
import {
  cancelTravelRequestSchema,
  createTravelRequestSchema,
  decisionTravelRequestSchema,
  updateTravelRequestSchema,
} from "./travelRequest.validation";
import {
  approveTravelRequest,
  cancelTravelRequest,
  createTravelRequest,
  getAllTravelRequests,
  getMyTravelRequests,
  getPendingTravelRequests,
  getTravelRequestById,
  rejectTravelRequest,
  updateTravelRequest,
} from "./travelRequest.service";

export async function createTravelRequestController(
  req: Request,
  res: Response
) {
  try {
    const currentUser = (req as any).user;
    const validatedData = createTravelRequestSchema.parse(req.body);

    const request = await createTravelRequest(
      currentUser.userId,
      validatedData
    );

    return res.status(201).json({
      success: true,
      message: "Travel request created successfully",
      data: request,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to create travel request",
    });
  }
}

export async function getMyTravelRequestsController(
  req: Request,
  res: Response
) {
  try {
    const currentUser = (req as any).user;

    const requests = await getMyTravelRequests(currentUser.userId);

    return res.status(200).json({
      success: true,
      message: "My travel requests fetched successfully",
      data: requests,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch my travel requests",
    });
  }
}

export async function getAllTravelRequestsController(
  _req: Request,
  res: Response
) {
  try {
    const requests = await getAllTravelRequests();

    return res.status(200).json({
      success: true,
      message: "Travel requests fetched successfully",
      data: requests,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch travel requests",
    });
  }
}

export async function getPendingTravelRequestsController(
  _req: Request,
  res: Response
) {
  try {
    const requests = await getPendingTravelRequests();

    return res.status(200).json({
      success: true,
      message: "Pending travel requests fetched successfully",
      data: requests,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch pending travel requests",
    });
  }
}

export async function getTravelRequestByIdController(
  req: Request,
  res: Response
) {
  try {
    const request = await getTravelRequestById(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Travel request fetched successfully",
      data: request,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Travel request not found",
    });
  }
}

export async function updateTravelRequestController(
  req: Request,
  res: Response
) {
  try {
    const currentUser = (req as any).user;
    const validatedData = updateTravelRequestSchema.parse(req.body);

    const request = await updateTravelRequest(
      req.params.id,
      currentUser,
      validatedData
    );

    return res.status(200).json({
      success: true,
      message: "Travel request updated successfully",
      data: request,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to update travel request",
    });
  }
}

export async function approveTravelRequestController(
  req: Request,
  res: Response
) {
  try {
    const currentUser = (req as any).user;
    const validatedData = decisionTravelRequestSchema.parse(req.body);

    const request = await approveTravelRequest(
      req.params.id,
      currentUser.userId,
      validatedData
    );

    return res.status(200).json({
      success: true,
      message: "Travel request approved successfully",
      data: request,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to approve travel request",
    });
  }
}

export async function rejectTravelRequestController(
  req: Request,
  res: Response
) {
  try {
    const currentUser = (req as any).user;
    const validatedData = decisionTravelRequestSchema.parse(req.body);

    const request = await rejectTravelRequest(
      req.params.id,
      currentUser.userId,
      validatedData
    );

    return res.status(200).json({
      success: true,
      message: "Travel request rejected successfully",
      data: request,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to reject travel request",
    });
  }
}

export async function cancelTravelRequestController(
  req: Request,
  res: Response
) {
  try {
    const currentUser = (req as any).user;
    const validatedData = cancelTravelRequestSchema.parse(req.body);

    const request = await cancelTravelRequest(
      req.params.id,
      currentUser,
      validatedData
    );

    return res.status(200).json({
      success: true,
      message: "Travel request cancelled successfully",
      data: request,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to cancel travel request",
    });
  }
}