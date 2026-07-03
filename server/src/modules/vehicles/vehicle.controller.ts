import { Request, Response } from "express";
import {
  createVehicleSchema,
  updateVehicleSchema,
} from "./vehicle.validation";
import {
  createVehicle,
  deactivateVehicle,
  getAllVehicles,
  getVehicleById,
  updateVehicle,
} from "./vehicle.service";

export async function getAllVehiclesController(_req: Request, res: Response) {
  try {
    const vehicles = await getAllVehicles();

    return res.status(200).json({
      success: true,
      message: "Vehicles fetched successfully",
      data: vehicles,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to fetch vehicles",
    });
  }
}

export async function getVehicleByIdController(req: Request, res: Response) {
  try {
    const vehicle = await getVehicleById(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Vehicle fetched successfully",
      data: vehicle,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error instanceof Error ? error.message : "Vehicle not found",
    });
  }
}

export async function createVehicleController(req: Request, res: Response) {
  try {
    const validatedData = createVehicleSchema.parse(req.body);

    const vehicle = await createVehicle(validatedData);

    return res.status(201).json({
      success: true,
      message: "Vehicle created successfully",
      data: vehicle,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to create vehicle",
    });
  }
}

export async function updateVehicleController(req: Request, res: Response) {
  try {
    const validatedData = updateVehicleSchema.parse(req.body);

    const vehicle = await updateVehicle(req.params.id, validatedData);

    return res.status(200).json({
      success: true,
      message: "Vehicle updated successfully",
      data: vehicle,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to update vehicle",
    });
  }
}

export async function deactivateVehicleController(req: Request, res: Response) {
  try {
    const vehicle = await deactivateVehicle(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Vehicle deactivated successfully",
      data: vehicle,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to deactivate vehicle",
    });
  }
}