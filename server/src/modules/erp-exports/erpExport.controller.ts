import { Request, Response } from "express";
import {
  createPayrollExportSchema,
  markExportFailedSchema,
} from "./erpExport.validation";
import {
  createCombinedPayrollExport,
  createExpenseClaimsExport,
  createTravelAllowancesExport,
  createVendorBillsExport,
  getAllPayrollExports,
  getPayrollExportById,
  markPayrollExportAsDownloaded,
  markPayrollExportAsFailed,
  markPayrollExportAsSynced,
} from "./erpExport.service";

export async function createExpenseClaimsExportController(
  req: Request,
  res: Response
) {
  try {
    const currentUser = (req as any).user;
    const validatedData = createPayrollExportSchema.parse(req.body);

    const exportRecord = await createExpenseClaimsExport(
      currentUser.userId,
      validatedData
    );

    return res.status(201).json({
      success: true,
      message: "Expense claims export generated successfully",
      data: exportRecord,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to generate expense claims export",
    });
  }
}

export async function createVendorBillsExportController(
  req: Request,
  res: Response
) {
  try {
    const currentUser = (req as any).user;
    const validatedData = createPayrollExportSchema.parse(req.body);

    const exportRecord = await createVendorBillsExport(
      currentUser.userId,
      validatedData
    );

    return res.status(201).json({
      success: true,
      message: "Vendor bills export generated successfully",
      data: exportRecord,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to generate vendor bills export",
    });
  }
}

export async function createTravelAllowancesExportController(
  req: Request,
  res: Response
) {
  try {
    const currentUser = (req as any).user;
    const validatedData = createPayrollExportSchema.parse(req.body);

    const exportRecord = await createTravelAllowancesExport(
      currentUser.userId,
      validatedData
    );

    return res.status(201).json({
      success: true,
      message: "Travel allowances export generated successfully",
      data: exportRecord,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to generate travel allowances export",
    });
  }
}

export async function createCombinedPayrollExportController(
  req: Request,
  res: Response
) {
  try {
    const currentUser = (req as any).user;
    const validatedData = createPayrollExportSchema.parse(req.body);

    const exportRecord = await createCombinedPayrollExport(
      currentUser.userId,
      validatedData
    );

    return res.status(201).json({
      success: true,
      message: "Combined payroll export generated successfully",
      data: exportRecord,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to generate combined payroll export",
    });
  }
}

export async function getAllPayrollExportsController(
  _req: Request,
  res: Response
) {
  try {
    const exports = await getAllPayrollExports();

    return res.status(200).json({
      success: true,
      message: "Payroll exports fetched successfully",
      data: exports,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch payroll exports",
    });
  }
}

export async function getPayrollExportByIdController(
  req: Request,
  res: Response
) {
  try {
    const exportRecord = await getPayrollExportById(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Payroll export fetched successfully",
      data: exportRecord,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Payroll export not found",
    });
  }
}

export async function downloadPayrollExportCsvController(
  req: Request,
  res: Response
) {
  try {
    const exportRecord = await getPayrollExportById(req.params.id);

    await markPayrollExportAsDownloaded(req.params.id);

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${exportRecord.exportNumber}.csv"`
    );

    return res.status(200).send(exportRecord.csvContent ?? "");
  } catch (error) {
    return res.status(404).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to download payroll export CSV",
    });
  }
}

export async function markPayrollExportAsSyncedController(
  req: Request,
  res: Response
) {
  try {
    const exportRecord = await markPayrollExportAsSynced(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Payroll export marked as synced successfully",
      data: exportRecord,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to mark payroll export as synced",
    });
  }
}

export async function markPayrollExportAsFailedController(
  req: Request,
  res: Response
) {
  try {
    const validatedData = markExportFailedSchema.parse(req.body);

    const exportRecord = await markPayrollExportAsFailed(
      req.params.id,
      validatedData.failureReason
    );

    return res.status(200).json({
      success: true,
      message: "Payroll export marked as failed successfully",
      data: exportRecord,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to mark payroll export as failed",
    });
  }
}