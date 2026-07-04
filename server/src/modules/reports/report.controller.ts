import { Request, Response } from "express";
import {
  getAccommodationSummary,
  getDashboardSummary,
  getExpenseSummary,
  getMyDashboardSummary,
  getPendingApprovalsSummary,
  getTransportSummary,
  getTravelSummary,
} from "./report.service";

export async function getDashboardSummaryController(
  _req: Request,
  res: Response
) {
  try {
    const summary = await getDashboardSummary();

    return res.status(200).json({
      success: true,
      message: "Dashboard summary fetched successfully",
      data: summary,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch dashboard summary",
    });
  }
}

export async function getPendingApprovalsSummaryController(
  _req: Request,
  res: Response
) {
  try {
    const summary = await getPendingApprovalsSummary();

    return res.status(200).json({
      success: true,
      message: "Pending approvals summary fetched successfully",
      data: summary,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch pending approvals summary",
    });
  }
}

export async function getTransportSummaryController(
  _req: Request,
  res: Response
) {
  try {
    const summary = await getTransportSummary();

    return res.status(200).json({
      success: true,
      message: "Transport summary fetched successfully",
      data: summary,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch transport summary",
    });
  }
}

export async function getTravelSummaryController(
  _req: Request,
  res: Response
) {
  try {
    const summary = await getTravelSummary();

    return res.status(200).json({
      success: true,
      message: "Travel summary fetched successfully",
      data: summary,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to fetch travel summary",
    });
  }
}

export async function getAccommodationSummaryController(
  _req: Request,
  res: Response
) {
  try {
    const summary = await getAccommodationSummary();

    return res.status(200).json({
      success: true,
      message: "Accommodation summary fetched successfully",
      data: summary,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch accommodation summary",
    });
  }
}

export async function getExpenseSummaryController(
  _req: Request,
  res: Response
) {
  try {
    const summary = await getExpenseSummary();

    return res.status(200).json({
      success: true,
      message: "Expense summary fetched successfully",
      data: summary,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch expense summary",
    });
  }
}

export async function getMyDashboardSummaryController(
  req: Request,
  res: Response
) {
  try {
    const currentUser = (req as any).user;

    const summary = await getMyDashboardSummary(currentUser.userId);

    return res.status(200).json({
      success: true,
      message: "My dashboard summary fetched successfully",
      data: summary,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch my dashboard summary",
    });
  }
}