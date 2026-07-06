import { Request, Response } from "express";
import {
  assignVendorToRouteSchema,
  assignVendorToVehicleSchema,
  createVendorBillSchema,
  createVendorSchema,
  updateVendorBillStatusSchema,
  updateVendorSchema,
} from "./vendor.validation";
import {
  approveVendorBill,
  assignVendorToRoute,
  assignVendorToVehicle,
  createVendor,
  createVendorBill,
  deactivateVendor,
  getActiveVendors,
  getAllVendorBills,
  getAllVendors,
  getPendingVendorBills,
  getVendorBillById,
  getVendorById,
  markVendorBillAsPaid,
  rejectVendorBill,
  updateVendor,
} from "./vendor.service";

export async function createVendorController(req: Request, res: Response) {
  try {
    const validatedData = createVendorSchema.parse(req.body);
    const vendor = await createVendor(validatedData);

    return res.status(201).json({
      success: true,
      message: "Vendor created successfully",
      data: vendor,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to create vendor",
    });
  }
}

export async function getAllVendorsController(_req: Request, res: Response) {
  try {
    const vendors = await getAllVendors();

    return res.status(200).json({
      success: true,
      message: "Vendors fetched successfully",
      data: vendors,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to fetch vendors",
    });
  }
}

export async function getActiveVendorsController(_req: Request, res: Response) {
  try {
    const vendors = await getActiveVendors();

    return res.status(200).json({
      success: true,
      message: "Active vendors fetched successfully",
      data: vendors,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to fetch active vendors",
    });
  }
}

export async function getVendorByIdController(req: Request, res: Response) {
  try {
    const vendor = await getVendorById(String(req.params.id));

    return res.status(200).json({
      success: true,
      message: "Vendor fetched successfully",
      data: vendor,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error instanceof Error ? error.message : "Vendor not found",
    });
  }
}

export async function updateVendorController(req: Request, res: Response) {
  try {
    const validatedData = updateVendorSchema.parse(req.body);
    const vendor = await updateVendor(String(req.params.id), validatedData);

    return res.status(200).json({
      success: true,
      message: "Vendor updated successfully",
      data: vendor,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to update vendor",
    });
  }
}

export async function deactivateVendorController(req: Request, res: Response) {
  try {
    const vendor = await deactivateVendor(String(req.params.id));

    return res.status(200).json({
      success: true,
      message: "Vendor deactivated successfully",
      data: vendor,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to deactivate vendor",
    });
  }
}

export async function assignVendorToVehicleController(
  req: Request,
  res: Response
) {
  try {
    const validatedData = assignVendorToVehicleSchema.parse(req.body);

    const vehicle = await assignVendorToVehicle(
      String(req.params.vehicleId),
      validatedData
    );

    return res.status(200).json({
      success: true,
      message: "Vendor assigned to vehicle successfully",
      data: vehicle,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to assign vendor to vehicle",
    });
  }
}

export async function assignVendorToRouteController(
  req: Request,
  res: Response
) {
  try {
    const validatedData = assignVendorToRouteSchema.parse(req.body);

    const route = await assignVendorToRoute(String(req.params.routeId), validatedData);

    return res.status(200).json({
      success: true,
      message: "Vendor assigned to route successfully",
      data: route,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to assign vendor to route",
    });
  }
}

export async function createVendorBillController(req: Request, res: Response) {
  try {
    const validatedData = createVendorBillSchema.parse(req.body);
    const bill = await createVendorBill(validatedData);

    return res.status(201).json({
      success: true,
      message: "Vendor bill created successfully",
      data: bill,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to create vendor bill",
    });
  }
}

export async function getAllVendorBillsController(
  _req: Request,
  res: Response
) {
  try {
    const bills = await getAllVendorBills();

    return res.status(200).json({
      success: true,
      message: "Vendor bills fetched successfully",
      data: bills,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to fetch vendor bills",
    });
  }
}

export async function getPendingVendorBillsController(
  _req: Request,
  res: Response
) {
  try {
    const bills = await getPendingVendorBills();

    return res.status(200).json({
      success: true,
      message: "Pending vendor bills fetched successfully",
      data: bills,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch pending vendor bills",
    });
  }
}

export async function getVendorBillByIdController(
  req: Request,
  res: Response
) {
  try {
    const bill = await getVendorBillById(String(req.params.id));

    return res.status(200).json({
      success: true,
      message: "Vendor bill fetched successfully",
      data: bill,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error instanceof Error ? error.message : "Vendor bill not found",
    });
  }
}

export async function approveVendorBillController(req: Request, res: Response) {
  try {
    const validatedData = updateVendorBillStatusSchema.parse({
      ...req.body,
      status: "APPROVED",
    });

    const bill = await approveVendorBill(String(req.params.id), validatedData);

    return res.status(200).json({
      success: true,
      message: "Vendor bill approved successfully",
      data: bill,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to approve vendor bill",
    });
  }
}

export async function rejectVendorBillController(req: Request, res: Response) {
  try {
    const validatedData = updateVendorBillStatusSchema.parse({
      ...req.body,
      status: "REJECTED",
    });

    const bill = await rejectVendorBill(String(req.params.id), validatedData);

    return res.status(200).json({
      success: true,
      message: "Vendor bill rejected successfully",
      data: bill,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to reject vendor bill",
    });
  }
}

export async function payVendorBillController(req: Request, res: Response) {
  try {
    const bill = await markVendorBillAsPaid(String(req.params.id));

    return res.status(200).json({
      success: true,
      message: "Vendor bill marked as paid successfully",
      data: bill,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to mark vendor bill as paid",
    });
  }
}