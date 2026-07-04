import {
  ExpenseAnomalyStatus,
  ExpenseClaimStatus,
  PayrollSyncStatus,
  TravelRequestStatus,
} from "@prisma/client";
import prisma from "../../config/prisma";
import {
  CancelExpenseClaimInput,
  CreateExpenseClaimInput,
  FinanceDecisionInput,
  FlagExpenseClaimInput,
} from "./expense.validation";

interface AuthUser {
  userId: string;
  email: string;
  role: string;
}

const expenseInclude = {
  employee: {
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      role: {
        select: {
          name: true,
        },
      },
    },
  },
  travelRequest: true,
  reviewedBy: {
    select: {
      id: true,
      fullName: true,
      email: true,
      role: {
        select: {
          name: true,
        },
      },
    },
  },
};

function detectExpenseAnomaly(
  data: CreateExpenseClaimInput,
  receiptUrl?: string
) {
  const reasons: string[] = [];

  if (!data.travelRequestId) {
    reasons.push("No approved travel request linked with this claim");
  }

  if (!receiptUrl) {
    reasons.push("Receipt file is missing");
  }

  if (Number(data.amount) > 5000) {
    reasons.push("Claim amount is higher than normal review threshold");
  }

  return reasons;
}

export async function createExpenseClaim(
  employeeId: string,
  data: CreateExpenseClaimInput,
  receiptUrl?: string
) {
  const employee = await prisma.user.findUnique({
    where: {
      id: employeeId,
    },
  });

  if (!employee) {
    throw new Error("Employee not found");
  }

  if (data.travelRequestId) {
    const travelRequest = await prisma.travelRequest.findUnique({
      where: {
        id: data.travelRequestId,
      },
    });

    if (!travelRequest) {
      throw new Error("Travel request not found");
    }

    if (travelRequest.employeeId !== employeeId) {
      throw new Error("You can only claim expenses for your own travel request");
    }

    if (travelRequest.status !== TravelRequestStatus.APPROVED) {
      throw new Error("Expense can only be submitted against approved travel request");
    }
  }

  const anomalyReasons = detectExpenseAnomaly(data, receiptUrl);
  const hasAnomaly = anomalyReasons.length > 0;

  return prisma.expenseClaim.create({
    data: {
      employeeId,
      travelRequestId: data.travelRequestId,
      category: data.category,
      claimDate: new Date(data.claimDate),
      vendorName: data.vendorName,
      amount: Number(data.amount),
      currency: data.currency ?? "PKR",
      description: data.description,
      receiptUrl,

      // Simulated OCR output for FYP-II MVP
      ocrVendorName: data.vendorName,
      ocrDate: data.claimDate,
      ocrAmount: Number(data.amount),

      anomalyStatus: hasAnomaly
        ? ExpenseAnomalyStatus.ANOMALY_REVIEW_REQUIRED
        : ExpenseAnomalyStatus.NORMAL,

      anomalyReason: hasAnomaly ? anomalyReasons.join("; ") : undefined,
    },
    include: expenseInclude,
  });
}

export async function getMyExpenseClaims(employeeId: string) {
  return prisma.expenseClaim.findMany({
    where: {
      employeeId,
    },
    include: expenseInclude,
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getAllExpenseClaims() {
  return prisma.expenseClaim.findMany({
    include: expenseInclude,
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getPendingExpenseClaims() {
  return prisma.expenseClaim.findMany({
    where: {
      status: ExpenseClaimStatus.PENDING,
    },
    include: expenseInclude,
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getFlaggedExpenseClaims() {
  return prisma.expenseClaim.findMany({
    where: {
      OR: [
        {
          status: ExpenseClaimStatus.FLAGGED,
        },
        {
          anomalyStatus: ExpenseAnomalyStatus.ANOMALY_REVIEW_REQUIRED,
        },
      ],
    },
    include: expenseInclude,
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getExpenseClaimById(id: string) {
  const claim = await prisma.expenseClaim.findUnique({
    where: {
      id,
    },
    include: expenseInclude,
  });

  if (!claim) {
    throw new Error("Expense claim not found");
  }

  return claim;
}

export async function approveExpenseClaim(
  id: string,
  financeOfficerId: string,
  data: FinanceDecisionInput
) {
  const claim = await getExpenseClaimById(id);

  if (
    claim.status === ExpenseClaimStatus.REJECTED ||
    claim.status === ExpenseClaimStatus.CANCELLED
  ) {
    throw new Error("Rejected or cancelled claim cannot be approved");
  }

  return prisma.expenseClaim.update({
    where: {
      id,
    },
    data: {
      status: ExpenseClaimStatus.APPROVED,
      reviewedById: financeOfficerId,
      financeRemarks: data.financeRemarks,
      payrollSyncStatus: PayrollSyncStatus.READY_FOR_EXPORT,
    },
    include: expenseInclude,
  });
}

export async function rejectExpenseClaim(
  id: string,
  financeOfficerId: string,
  data: FinanceDecisionInput
) {
  const claim = await getExpenseClaimById(id);

  if (claim.status === ExpenseClaimStatus.APPROVED) {
    throw new Error("Approved claim cannot be rejected");
  }

  return prisma.expenseClaim.update({
    where: {
      id,
    },
    data: {
      status: ExpenseClaimStatus.REJECTED,
      reviewedById: financeOfficerId,
      financeRemarks: data.financeRemarks,
      payrollSyncStatus: PayrollSyncStatus.NOT_READY,
    },
    include: expenseInclude,
  });
}

export async function flagExpenseClaim(
  id: string,
  financeOfficerId: string,
  data: FlagExpenseClaimInput
) {
  await getExpenseClaimById(id);

  return prisma.expenseClaim.update({
    where: {
      id,
    },
    data: {
      status: ExpenseClaimStatus.FLAGGED,
      anomalyStatus: ExpenseAnomalyStatus.ANOMALY_REVIEW_REQUIRED,
      anomalyReason: data.anomalyReason,
      reviewedById: financeOfficerId,
      financeRemarks: data.financeRemarks,
    },
    include: expenseInclude,
  });
}

export async function markExpenseClaimAsExported(id: string) {
  const claim = await getExpenseClaimById(id);

  if (claim.status !== ExpenseClaimStatus.APPROVED) {
    throw new Error("Only approved claims can be exported");
  }

  return prisma.expenseClaim.update({
    where: {
      id,
    },
    data: {
      payrollSyncStatus: PayrollSyncStatus.EXPORTED,
      exportedAt: new Date(),
    },
    include: expenseInclude,
  });
}

export async function cancelExpenseClaim(
  id: string,
  currentUser: AuthUser,
  data: CancelExpenseClaimInput
) {
  const claim = await getExpenseClaimById(id);

  const isAdmin =
    currentUser.role === "SUPER_ADMIN" ||
    currentUser.role === "FINANCE_OFFICER";

  const isOwner = claim.employeeId === currentUser.userId;

  if (!isAdmin && !isOwner) {
    throw new Error("You can only cancel your own expense claim");
  }

  if (claim.status !== ExpenseClaimStatus.PENDING) {
    throw new Error("Only pending expense claims can be cancelled");
  }

  return prisma.expenseClaim.update({
    where: {
      id,
    },
    data: {
      status: ExpenseClaimStatus.CANCELLED,
      financeRemarks: data.remarks,
    },
    include: expenseInclude,
  });
}