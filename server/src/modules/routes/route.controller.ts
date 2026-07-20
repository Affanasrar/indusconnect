import { Request, Response } from "express";
import {
  addSmartStopSchema,
  createRouteSchema,
  updateRouteSchema,
  updateSmartStopSchema,
} from "./route.validation";
import {
  addSmartStop,
  cancelRoute,
  createRoute,
  deleteSmartStop,
  getAllRoutes,
  getRouteById,
  updateRoute,
  updateSmartStop,
  runVRPOptimization,
} from "./route.service";

export async function getAllRoutesController(_req: Request, res: Response) {
  try {
    const routes = await getAllRoutes();

    return res.status(200).json({
      success: true,
      message: "Routes fetched successfully",
      data: routes,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to fetch routes",
    });
  }
}

export async function getRouteByIdController(req: Request, res: Response) {
  try {
    const route = await getRouteById(String(req.params.id));

    return res.status(200).json({
      success: true,
      message: "Route fetched successfully",
      data: route,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error instanceof Error ? error.message : "Route not found",
    });
  }
}

export async function createRouteController(req: Request, res: Response) {
  try {
    const validatedData = createRouteSchema.parse(req.body);

    const route = await createRoute(validatedData);

    return res.status(201).json({
      success: true,
      message: "Route created successfully",
      data: route,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to create route",
    });
  }
}

export async function updateRouteController(req: Request, res: Response) {
  try {
    const validatedData = updateRouteSchema.parse(req.body);

    const route = await updateRoute(String(req.params.id), validatedData);

    return res.status(200).json({
      success: true,
      message: "Route updated successfully",
      data: route,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to update route",
    });
  }
}

export async function cancelRouteController(req: Request, res: Response) {
  try {
    const route = await cancelRoute(String(req.params.id));

    return res.status(200).json({
      success: true,
      message: "Route cancelled successfully",
      data: route,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to cancel route",
    });
  }
}

export async function addSmartStopController(req: Request, res: Response) {
  try {
    const validatedData = addSmartStopSchema.parse(req.body);

    const stop = await addSmartStop(String(req.params.routeId), validatedData);

    return res.status(201).json({
      success: true,
      message: "Smart stop added successfully",
      data: stop,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to add smart stop",
    });
  }
}

export async function updateSmartStopController(req: Request, res: Response) {
  try {
    const validatedData = updateSmartStopSchema.parse(req.body);

    const stop = await updateSmartStop(String(req.params.stopId), validatedData);

    return res.status(200).json({
      success: true,
      message: "Smart stop updated successfully",
      data: stop,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to update smart stop",
    });
  }
}

export async function deleteSmartStopController(req: Request, res: Response) {
  try {
    const stop = await deleteSmartStop(String(req.params.stopId));

    return res.status(200).json({
      success: true,
      message: "Smart stop deleted successfully",
      data: stop,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to delete smart stop",
    });
  }
}

export async function runVRPOptimizationController(req: Request, res: Response) {
  try {
    const { shiftType, date } = req.body;
    if (!shiftType || !date) {
      throw new Error("Both shiftType and date are required parameters.");
    }

    const result = await runVRPOptimization(String(shiftType), String(date));

    return res.status(200).json({
      success: true,
      message: result.message,
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to run VRP optimization",
    });
  }
}