import { Request, Response } from "express";
import { createTelemetrySchema } from "./telemetry.validation";
import {
  createTelemetryLog,
  getEmergencyTelemetryEvents,
  getLatestVehicleLocations,
  getMyTelemetryLogs,
  getTelemetryByDriver,
  getTelemetryByRoute,
} from "./telemetry.service";

export async function createTelemetryController(req: Request, res: Response) {
  try {
    const currentUser = (req as any).user;
    const validatedData = createTelemetrySchema.parse(req.body);

    const telemetry = await createTelemetryLog(
      currentUser.userId,
      validatedData
    );

    return res.status(201).json({
      success: true,
      message: "Telemetry location updated successfully",
      data: telemetry,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to update telemetry location",
    });
  }
}

export async function getLatestVehicleLocationsController(
  _req: Request,
  res: Response
) {
  try {
    const locations = await getLatestVehicleLocations();

    return res.status(200).json({
      success: true,
      message: "Latest vehicle locations fetched successfully",
      data: locations,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch latest vehicle locations",
    });
  }
}

export async function getEmergencyTelemetryEventsController(
  _req: Request,
  res: Response
) {
  try {
    const events = await getEmergencyTelemetryEvents();

    return res.status(200).json({
      success: true,
      message: "Emergency telemetry events fetched successfully",
      data: events,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch emergency telemetry events",
    });
  }
}

export async function getTelemetryByRouteController(
  req: Request,
  res: Response
) {
  try {
    const currentUser = (req as any).user;
    const logs = await getTelemetryByRoute(String(req.params.routeId), currentUser);

    return res.status(200).json({
      success: true,
      message: "Route telemetry logs fetched successfully",
      data: logs,
    });
  } catch (error) {
    return res.status(403).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch route telemetry logs",
    });
  }
}

export async function getTelemetryByDriverController(
  req: Request,
  res: Response
) {
  try {
    const logs = await getTelemetryByDriver(String(req.params.driverId));

    return res.status(200).json({
      success: true,
      message: "Driver telemetry logs fetched successfully",
      data: logs,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch driver telemetry logs",
    });
  }
}

export async function getMyTelemetryLogsController(
  req: Request,
  res: Response
) {
  try {
    const currentUser = (req as any).user;

    const logs = await getMyTelemetryLogs(currentUser.userId);

    return res.status(200).json({
      success: true,
      message: "My telemetry logs fetched successfully",
      data: logs,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch my telemetry logs",
    });
  }
}