import { Request, Response } from "express";
import {
  createPolicyRuleSchema,
  updatePolicyRuleSchema,
} from "./policy.validation";
import {
  createPolicyRule,
  deactivatePolicyRule,
  evaluateAccommodationPolicy,
  evaluateExpenseClaimPolicy,
  evaluateShuttleBookingPolicy,
  evaluateTravelRequestPolicy,
  getActivePolicyRules,
  getAllPolicyRules,
  getPolicyDecisionLogs,
  getPolicyRuleById,
  updatePolicyRule,
} from "./policy.service";

export async function createPolicyRuleController(req: Request, res: Response) {
  try {
    const validatedData = createPolicyRuleSchema.parse(req.body);
    const rule = await createPolicyRule(validatedData);

    return res.status(201).json({
      success: true,
      message: "Policy rule created successfully",
      data: rule,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to create policy rule",
    });
  }
}

export async function getAllPolicyRulesController(_req: Request, res: Response) {
  try {
    const rules = await getAllPolicyRules();

    return res.status(200).json({
      success: true,
      message: "Policy rules fetched successfully",
      data: rules,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to fetch policy rules",
    });
  }
}

export async function getActivePolicyRulesController(
  _req: Request,
  res: Response
) {
  try {
    const rules = await getActivePolicyRules();

    return res.status(200).json({
      success: true,
      message: "Active policy rules fetched successfully",
      data: rules,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch active policy rules",
    });
  }
}

export async function getPolicyRuleByIdController(
  req: Request,
  res: Response
) {
  try {
    const rule = await getPolicyRuleById(String(req.params.id));

    return res.status(200).json({
      success: true,
      message: "Policy rule fetched successfully",
      data: rule,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error instanceof Error ? error.message : "Policy rule not found",
    });
  }
}

export async function updatePolicyRuleController(req: Request, res: Response) {
  try {
    const validatedData = updatePolicyRuleSchema.parse(req.body);
    const rule = await updatePolicyRule(String(req.params.id), validatedData);

    return res.status(200).json({
      success: true,
      message: "Policy rule updated successfully",
      data: rule,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to update policy rule",
    });
  }
}

export async function deactivatePolicyRuleController(
  req: Request,
  res: Response
) {
  try {
    const rule = await deactivatePolicyRule(String(req.params.id));

    return res.status(200).json({
      success: true,
      message: "Policy rule deactivated successfully",
      data: rule,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to deactivate policy rule",
    });
  }
}

export async function evaluateTravelRequestPolicyController(
  req: Request,
  res: Response
) {
  try {
    const result = await evaluateTravelRequestPolicy(String(req.params.id));

    return res.status(200).json({
      success: true,
      message: "Travel request policy evaluated successfully",
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to evaluate travel request policy",
    });
  }
}

export async function evaluateExpenseClaimPolicyController(
  req: Request,
  res: Response
) {
  try {
    const result = await evaluateExpenseClaimPolicy(String(req.params.id));

    return res.status(200).json({
      success: true,
      message: "Expense claim policy evaluated successfully",
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to evaluate expense claim policy",
    });
  }
}

export async function evaluateShuttleBookingPolicyController(
  req: Request,
  res: Response
) {
  try {
    const result = await evaluateShuttleBookingPolicy(String(req.params.id));

    return res.status(200).json({
      success: true,
      message: "Shuttle booking policy evaluated successfully",
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to evaluate shuttle booking policy",
    });
  }
}

export async function evaluateAccommodationPolicyController(
  req: Request,
  res: Response
) {
  try {
    const result = await evaluateAccommodationPolicy(String(req.params.travelRequestId));

    return res.status(200).json({
      success: true,
      message: "Accommodation policy evaluated successfully",
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to evaluate accommodation policy",
    });
  }
}

export async function getPolicyDecisionLogsController(
  _req: Request,
  res: Response
) {
  try {
    const logs = await getPolicyDecisionLogs();

    return res.status(200).json({
      success: true,
      message: "Policy decision logs fetched successfully",
      data: logs,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch policy decision logs",
    });
  }
}