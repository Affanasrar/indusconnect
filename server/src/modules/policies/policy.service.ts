import {
  PolicyDecisionStatus,
  PolicyRuleStatus,
  PolicyRuleType,
  TravelUrgency,
} from "@prisma/client";
import prisma from "../../config/prisma";
import {
  CreatePolicyRuleInput,
  UpdatePolicyRuleInput,
} from "./policy.validation";

const policyInclude = {
  decisionLogs: {
    orderBy: {
      createdAt: "desc" as const,
    },
    take: 10,
  },
};

export async function createPolicyRule(data: CreatePolicyRuleInput) {
  const existingRule = await prisma.policyRule.findUnique({
    where: {
      ruleCode: data.ruleCode,
    },
  });

  if (existingRule) {
    throw new Error("Policy rule with this code already exists");
  }

  return prisma.policyRule.create({
    data,
    include: policyInclude,
  });
}

export async function getAllPolicyRules() {
  return prisma.policyRule.findMany({
    include: policyInclude,
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getActivePolicyRules() {
  return prisma.policyRule.findMany({
    where: {
      status: PolicyRuleStatus.ACTIVE,
    },
    include: policyInclude,
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getPolicyRuleById(id: string) {
  const rule = await prisma.policyRule.findUnique({
    where: {
      id,
    },
    include: policyInclude,
  });

  if (!rule) {
    throw new Error("Policy rule not found");
  }

  return rule;
}

export async function updatePolicyRule(
  id: string,
  data: UpdatePolicyRuleInput
) {
  await getPolicyRuleById(id);

  if (data.ruleCode) {
    const existingRule = await prisma.policyRule.findUnique({
      where: {
        ruleCode: data.ruleCode,
      },
    });

    if (existingRule && existingRule.id !== id) {
      throw new Error("Policy rule with this code already exists");
    }
  }

  return prisma.policyRule.update({
    where: {
      id,
    },
    data,
    include: policyInclude,
  });
}

export async function deactivatePolicyRule(id: string) {
  await getPolicyRuleById(id);

  return prisma.policyRule.update({
    where: {
      id,
    },
    data: {
      status: PolicyRuleStatus.INACTIVE,
    },
    include: policyInclude,
  });
}

async function findMatchingRules(params: {
  ruleType: PolicyRuleType;
  department?: string | null;
  hrGrade?: string | null;
}) {
  return prisma.policyRule.findMany({
    where: {
      ruleType: params.ruleType,
      status: PolicyRuleStatus.ACTIVE,
      OR: [
        {
          department: null,
          hrGrade: null,
        },
        {
          department: params.department ?? undefined,
        },
        {
          hrGrade: params.hrGrade as any,
        },
      ],
    },
    orderBy: {
      createdAt: "asc",
    },
  });
}

async function createDecisionLog(params: {
  policyRuleId?: string;
  userId?: string;
  entityType: string;
  entityId: string;
  decision: PolicyDecisionStatus;
  message: string;
}) {
  return prisma.policyDecisionLog.create({
    data: {
      policyRuleId: params.policyRuleId,
      userId: params.userId,
      entityType: params.entityType,
      entityId: params.entityId,
      decision: params.decision,
      message: params.message,
    },
  });
}

export async function evaluateTravelRequestPolicy(id: string) {
  const request = await prisma.travelRequest.findUnique({
    where: {
      id,
    },
    include: {
      employee: true,
    },
  });

  if (!request) {
    throw new Error("Travel request not found");
  }

  const rules = await findMatchingRules({
    ruleType: PolicyRuleType.TRAVEL_APPROVAL,
    department: request.employee.department,
    hrGrade: request.employee.hrGrade,
  });

  let decision: PolicyDecisionStatus = PolicyDecisionStatus.PASSED;
  const messages: string[] = [];
  const approvalRequirements = {
    manager: false,
    finance: false,
    transport: false,
    accommodation: false,
  };

  for (const rule of rules) {
    if (rule.requiresManagerApproval) {
      approvalRequirements.manager = true;
    }

    if (rule.requiresFinanceApproval) {
      approvalRequirements.finance = true;
    }

    if (rule.requiresTransportApproval || request.transportRequired) {
      approvalRequirements.transport = true;
    }

    if (
      rule.requiresAccommodationApproval ||
      request.accommodationRequired
    ) {
      approvalRequirements.accommodation = true;
    }

    if (
      rule.maxAmount &&
      request.estimatedBudget &&
      request.estimatedBudget > rule.maxAmount
    ) {
      decision = PolicyDecisionStatus.REVIEW_REQUIRED;
      messages.push(
        `Estimated budget exceeds policy limit of ${rule.maxAmount}.`
      );
    }

    if (
      request.urgency === TravelUrgency.EMERGENCY &&
      rule.allowEmergencyOverride
    ) {
      messages.push("Emergency override is allowed by policy.");
    }
  }

  if (rules.length === 0) {
    decision = PolicyDecisionStatus.WARNING;
    messages.push("No active travel approval policy matched this request.");
  }

  if (messages.length === 0) {
    messages.push("Travel request passed active policy evaluation.");
  }

  const log = await createDecisionLog({
    policyRuleId: rules[0]?.id,
    userId: request.employeeId,
    entityType: "TravelRequest",
    entityId: request.id,
    decision,
    message: messages.join(" "),
  });

  return {
    request,
    matchedRules: rules,
    approvalRequirements,
    decision,
    messages,
    decisionLog: log,
  };
}

export async function evaluateExpenseClaimPolicy(id: string) {
  const claim = await prisma.expenseClaim.findUnique({
    where: {
      id,
    },
    include: {
      employee: true,
      travelRequest: true,
    },
  });

  if (!claim) {
    throw new Error("Expense claim not found");
  }

  const rules = await findMatchingRules({
    ruleType: PolicyRuleType.EXPENSE_LIMIT,
    department: claim.employee.department,
    hrGrade: claim.employee.hrGrade,
  });

  let decision: PolicyDecisionStatus = PolicyDecisionStatus.PASSED;
  const messages: string[] = [];

  for (const rule of rules) {
    if (rule.maxAmount && claim.amount > rule.maxAmount) {
      decision = PolicyDecisionStatus.REVIEW_REQUIRED;
      messages.push(
        `Expense amount exceeds policy limit of ${claim.currency} ${rule.maxAmount}.`
      );
    }

    if (rule.requiresFinanceApproval) {
      messages.push("Finance approval is required for this expense claim.");
    }
  }

  if (!claim.travelRequestId) {
    decision = PolicyDecisionStatus.REVIEW_REQUIRED;
    messages.push("Expense claim is not linked with an approved travel request.");
  }

  if (rules.length === 0) {
    decision = PolicyDecisionStatus.WARNING;
    messages.push("No active expense policy matched this claim.");
  }

  if (messages.length === 0) {
    messages.push("Expense claim passed active policy evaluation.");
  }

  const log = await createDecisionLog({
    policyRuleId: rules[0]?.id,
    userId: claim.employeeId,
    entityType: "ExpenseClaim",
    entityId: claim.id,
    decision,
    message: messages.join(" "),
  });

  return {
    claim,
    matchedRules: rules,
    decision,
    messages,
    decisionLog: log,
  };
}

export async function evaluateShuttleBookingPolicy(id: string) {
  const booking = await prisma.shuttleBooking.findUnique({
    where: {
      id,
    },
    include: {
      employee: true,
    },
  });

  if (!booking) {
    throw new Error("Shuttle booking not found");
  }

  const rules = await findMatchingRules({
    ruleType: PolicyRuleType.TRANSPORT_CUTOFF,
    department: booking.employee.department,
    hrGrade: booking.employee.hrGrade,
  });

  let decision: PolicyDecisionStatus = PolicyDecisionStatus.PASSED;
  const messages: string[] = [];

  const now = new Date();
  const bookingDate = new Date(booking.bookingDate);
  const hoursBeforeBooking =
    (bookingDate.getTime() - now.getTime()) / (1000 * 60 * 60);

  for (const rule of rules) {
    if (
      rule.cutoffHoursBeforeShift !== null &&
      rule.cutoffHoursBeforeShift !== undefined &&
      hoursBeforeBooking < rule.cutoffHoursBeforeShift
    ) {
      decision = PolicyDecisionStatus.REVIEW_REQUIRED;
      messages.push(
        `Booking was created inside the ${rule.cutoffHoursBeforeShift}-hour transport cut-off window.`
      );
    }
  }

  if (rules.length === 0) {
    decision = PolicyDecisionStatus.WARNING;
    messages.push("No active transport cut-off policy matched this booking.");
  }

  if (messages.length === 0) {
    messages.push("Shuttle booking passed active transport policy evaluation.");
  }

  const log = await createDecisionLog({
    policyRuleId: rules[0]?.id,
    userId: booking.employeeId,
    entityType: "ShuttleBooking",
    entityId: booking.id,
    decision,
    message: messages.join(" "),
  });

  return {
    booking,
    matchedRules: rules,
    decision,
    messages,
    decisionLog: log,
  };
}

export async function evaluateAccommodationPolicy(travelRequestId: string) {
  const request = await prisma.travelRequest.findUnique({
    where: {
      id: travelRequestId,
    },
    include: {
      employee: true,
      roomReservation: true,
    },
  });

  if (!request) {
    throw new Error("Travel request not found");
  }

  const rules = await findMatchingRules({
    ruleType: PolicyRuleType.ACCOMMODATION_FALLBACK,
    department: request.employee.department,
    hrGrade: request.employee.hrGrade,
  });

  let decision: PolicyDecisionStatus = PolicyDecisionStatus.PASSED;
  const messages: string[] = [];

  for (const rule of rules) {
    if (rule.internalFirstRequired && request.accommodationRequired) {
      messages.push(
        "Internal-First accommodation policy applies. Guest house availability must be checked before external hotel fallback."
      );
    }
  }

  if (!request.accommodationRequired) {
    decision = PolicyDecisionStatus.WARNING;
    messages.push("This travel request does not require accommodation.");
  }

  if (rules.length === 0) {
    decision = PolicyDecisionStatus.WARNING;
    messages.push("No active accommodation policy matched this request.");
  }

  if (messages.length === 0) {
    messages.push("Accommodation request passed active policy evaluation.");
  }

  const log = await createDecisionLog({
    policyRuleId: rules[0]?.id,
    userId: request.employeeId,
    entityType: "TravelRequest",
    entityId: request.id,
    decision,
    message: messages.join(" "),
  });

  return {
    request,
    matchedRules: rules,
    decision,
    messages,
    decisionLog: log,
  };
}

export async function getPolicyDecisionLogs() {
  return prisma.policyDecisionLog.findMany({
    include: {
      policyRule: true,
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          department: true,
          hrGrade: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 200,
  });
}