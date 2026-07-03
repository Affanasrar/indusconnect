import { Request, Response } from "express";
import {
  createDriverSchema,
  updateDriverSchema,
} from "./driver.validation";
import {
  createDriver,
  deactivateDriver,
  getAllDrivers,
  getDriverById,
  updateDriver,
} from "./driver.service";

export async function getAllDriversController(_req: Request, res: Response) {
  try {
    const drivers = await getAllDrivers();

    return res.status(200).json({
      success: true,
      message: "Drivers fetched successfully",
      data: drivers,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to fetch drivers",
    });
  }
}

export async function getDriverByIdController(req: Request, res: Response) {
  try {
    const driver = await getDriverById(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Driver fetched successfully",
      data: driver,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error instanceof Error ? error.message : "Driver not found",
    });
  }
}

export async function createDriverController(req: Request, res: Response) {
  try {
    const validatedData = createDriverSchema.parse(req.body);

    const driver = await createDriver(validatedData);

    return res.status(201).json({
      success: true,
      message: "Driver created successfully",
      data: driver,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to create driver",
    });
  }
}

export async function updateDriverController(req: Request, res: Response) {
  try {
    const validatedData = updateDriverSchema.parse(req.body);

    const driver = await updateDriver(req.params.id, validatedData);

    return res.status(200).json({
      success: true,
      message: "Driver updated successfully",
      data: driver,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to update driver",
    });
  }
}

export async function deactivateDriverController(req: Request, res: Response) {
  try {
    const driver = await deactivateDriver(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Driver deactivated successfully",
      data: driver,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to deactivate driver",
    });
  }
}