import { Request, Response } from "express";
import {
  cancelExpenseClaimSchema,
  createExpenseClaimSchema,
  financeDecisionSchema,
  flagExpenseClaimSchema,
} from "./expense.validation";
import {
  approveExpenseClaim,
  cancelExpenseClaim,
  createExpenseClaim,
  flagExpenseClaim,
  getAllExpenseClaims,
  getExpenseClaimById,
  getFlaggedExpenseClaims,
  getMyExpenseClaims,
  getPendingExpenseClaims,
  markExpenseClaimAsExported,
  rejectExpenseClaim,
} from "./expense.service";

export async function createExpenseClaimController(
  req: Request,
  res: Response
) {
  try {
    const currentUser = (req as any).user;
    const validatedData = createExpenseClaimSchema.parse(req.body);

    const receiptUrl = req.file
      ? `/uploads/receipts/${req.file.filename}`
      : undefined;

    const claim = await createExpenseClaim(
      currentUser.userId,
      validatedData,
      receiptUrl
    );

    return res.status(201).json({
      success: true,
      message: "Expense claim created successfully",
      data: claim,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to create expense claim",
    });
  }
}

export async function getMyExpenseClaimsController(
  req: Request,
  res: Response
) {
  try {
    const currentUser = (req as any).user;

    const claims = await getMyExpenseClaims(currentUser.userId);

    return res.status(200).json({
      success: true,
      message: "My expense claims fetched successfully",
      data: claims,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch my expense claims",
    });
  }
}

export async function getAllExpenseClaimsController(
  _req: Request,
  res: Response
) {
  try {
    const claims = await getAllExpenseClaims();

    return res.status(200).json({
      success: true,
      message: "Expense claims fetched successfully",
      data: claims,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch expense claims",
    });
  }
}

export async function getPendingExpenseClaimsController(
  _req: Request,
  res: Response
) {
  try {
    const claims = await getPendingExpenseClaims();

    return res.status(200).json({
      success: true,
      message: "Pending expense claims fetched successfully",
      data: claims,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch pending expense claims",
    });
  }
}

export async function getFlaggedExpenseClaimsController(
  _req: Request,
  res: Response
) {
  try {
    const claims = await getFlaggedExpenseClaims();

    return res.status(200).json({
      success: true,
      message: "Flagged expense claims fetched successfully",
      data: claims,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch flagged expense claims",
    });
  }
}

export async function getExpenseClaimByIdController(
  req: Request,
  res: Response
) {
  try {
    const claim = await getExpenseClaimById(String(req.params.id));

    return res.status(200).json({
      success: true,
      message: "Expense claim fetched successfully",
      data: claim,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Expense claim not found",
    });
  }
}

export async function approveExpenseClaimController(
  req: Request,
  res: Response
) {
  try {
    const currentUser = (req as any).user;
    const validatedData = financeDecisionSchema.parse(req.body);

    const claim = await approveExpenseClaim(
      String(req.params.id),
      currentUser.userId,
      validatedData
    );

    return res.status(200).json({
      success: true,
      message: "Expense claim approved successfully",
      data: claim,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to approve expense claim",
    });
  }
}

export async function rejectExpenseClaimController(
  req: Request,
  res: Response
) {
  try {
    const currentUser = (req as any).user;
    const validatedData = financeDecisionSchema.parse(req.body);

    const claim = await rejectExpenseClaim(
      String(req.params.id),
      currentUser.userId,
      validatedData
    );

    return res.status(200).json({
      success: true,
      message: "Expense claim rejected successfully",
      data: claim,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to reject expense claim",
    });
  }
}

export async function flagExpenseClaimController(req: Request, res: Response) {
  try {
    const currentUser = (req as any).user;
    const validatedData = flagExpenseClaimSchema.parse(req.body);

    const claim = await flagExpenseClaim(
      String(req.params.id),
      currentUser.userId,
      validatedData
    );

    return res.status(200).json({
      success: true,
      message: "Expense claim flagged successfully",
      data: claim,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to flag expense claim",
    });
  }
}

export async function exportExpenseClaimController(
  req: Request,
  res: Response
) {
  try {
    const claim = await markExpenseClaimAsExported(String(req.params.id));

    return res.status(200).json({
      success: true,
      message: "Expense claim marked as exported successfully",
      data: claim,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to export expense claim",
    });
  }
}

export async function cancelExpenseClaimController(
  req: Request,
  res: Response
) {
  try {
    const currentUser = (req as any).user;
    const validatedData = cancelExpenseClaimSchema.parse(req.body);

    const claim = await cancelExpenseClaim(
      String(req.params.id),
      currentUser,
      validatedData
    );

    return res.status(200).json({
      success: true,
      message: "Expense claim cancelled successfully",
      data: claim,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to cancel expense claim",
    });
  }
}