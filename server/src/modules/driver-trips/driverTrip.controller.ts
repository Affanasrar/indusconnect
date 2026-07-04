import { Request, Response } from "express";
import {
  reportIssueSchema,
  safetyChecklistSchema,
} from "./driverTrip.validation";
import {
  endTrip,
  getMyAssignedRoutes,
  getMyRouteManifest,
  markPassengerBoarded,
  markPassengerNoShow,
  reportTripIssue,
  startTrip,
  submitSafetyChecklist,
} from "./driverTrip.service";

export async function getMyAssignedRoutesController(req: Request, res: Response) {
  try {
    const currentUser = (req as any).user;

    const routes = await getMyAssignedRoutes(currentUser.userId);

    return res.status(200).json({
      success: true,
      message: "Assigned routes fetched successfully",
      data: routes,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to fetch assigned routes",
    });
  }
}

export async function getMyRouteManifestController(req: Request, res: Response) {
  try {
    const currentUser = (req as any).user;

    const manifest = await getMyRouteManifest(
      currentUser.userId,
      req.params.routeId
    );

    return res.status(200).json({
      success: true,
      message: "Driver manifest fetched successfully",
      data: manifest,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to fetch driver manifest",
    });
  }
}

export async function submitSafetyChecklistController(
  req: Request,
  res: Response
) {
  try {
    const currentUser = (req as any).user;
    const validatedData = safetyChecklistSchema.parse(req.body);

    const trip = await submitSafetyChecklist(
      currentUser.userId,
      req.params.routeId,
      validatedData
    );

    return res.status(200).json({
      success: true,
      message: "Safety checklist submitted successfully",
      data: trip,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to submit safety checklist",
    });
  }
}

export async function startTripController(req: Request, res: Response) {
  try {
    const currentUser = (req as any).user;

    const trip = await startTrip(currentUser.userId, req.params.routeId);

    return res.status(200).json({
      success: true,
      message: "Trip started successfully",
      data: trip,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to start trip",
    });
  }
}

export async function markPassengerBoardedController(
  req: Request,
  res: Response
) {
  try {
    const currentUser = (req as any).user;

    const booking = await markPassengerBoarded(
      currentUser.userId,
      req.params.routeId,
      req.params.bookingId
    );

    return res.status(200).json({
      success: true,
      message: "Passenger marked as boarded successfully",
      data: booking,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to mark passenger boarded",
    });
  }
}

export async function markPassengerNoShowController(
  req: Request,
  res: Response
) {
  try {
    const currentUser = (req as any).user;

    const booking = await markPassengerNoShow(
      currentUser.userId,
      req.params.routeId,
      req.params.bookingId
    );

    return res.status(200).json({
      success: true,
      message: "Passenger marked as no-show successfully",
      data: booking,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to mark passenger no-show",
    });
  }
}

export async function reportTripIssueController(req: Request, res: Response) {
  try {
    const currentUser = (req as any).user;
    const validatedData = reportIssueSchema.parse(req.body);

    const trip = await reportTripIssue(
      currentUser.userId,
      req.params.routeId,
      validatedData
    );

    return res.status(200).json({
      success: true,
      message: "Trip issue reported successfully",
      data: trip,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to report trip issue",
    });
  }
}

export async function endTripController(req: Request, res: Response) {
  try {
    const currentUser = (req as any).user;

    const trip = await endTrip(currentUser.userId, req.params.routeId);

    return res.status(200).json({
      success: true,
      message: "Trip ended successfully",
      data: trip,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to end trip",
    });
  }
}