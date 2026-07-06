import {
  ExpenseClaimStatus,
  PayrollExportFormat,
  PayrollExportStatus,
  PayrollExportType,
  PayrollSyncStatus,
  TravelRequestStatus,
  VendorBillStatus,
} from "@prisma/client";
import prisma from "../../config/prisma";
import { CreatePayrollExportInput } from "./erpExport.validation";

const exportInclude = {
  generatedBy: {
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
  expenseClaims: true,
  vendorBills: {
    include: {
      vendor: true,
      route: true,
    },
  },
  travelRequests: {
    include: {
      employee: true,
    },
  },
};

function escapeCsvValue(value: unknown) {
  if (value === null || value === undefined) return "";

  const stringValue = String(value).replace(/"/g, '""');

  if (
    stringValue.includes(",") ||
    stringValue.includes('"') ||
    stringValue.includes("\n")
  ) {
    return `"${stringValue}"`;
  }

  return stringValue;
}

function buildCsv(rows: Record<string, unknown>[]) {
  if (rows.length === 0) return "";

  const headers = Object.keys(rows[0]);

  const headerLine = headers.map(escapeCsvValue).join(",");

  const bodyLines = rows.map((row) =>
    headers.map((header) => escapeCsvValue(row[header])).join(",")
  );

  return [headerLine, ...bodyLines].join("\n");
}

async function generateExportNumber(prefix: string) {
  const today = new Date();
  const datePart = today.toISOString().slice(0, 10).replace(/-/g, "");
  const count = await prisma.payrollExport.count();

  return `${prefix}-${datePart}-${String(count + 1).padStart(4, "0")}`;
}

function getIdFilter(ids?: string[]) {
  if (!ids || ids.length === 0) {
    return {};
  }

  return {
    id: {
      in: ids,
    },
  };
}

export async function createExpenseClaimsExport(
  generatedById: string,
  data: CreatePayrollExportInput
) {
  const claims = await prisma.expenseClaim.findMany({
    where: {
      ...getIdFilter(data.expenseClaimIds),
      status: ExpenseClaimStatus.APPROVED,
      payrollSyncStatus: PayrollSyncStatus.READY_FOR_EXPORT,
    },
    include: {
      employee: true,
      travelRequest: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  if (claims.length === 0) {
    throw new Error("No approved expense claims are ready for export");
  }

  const rows = claims.map((claim) => ({
    recordType: "EXPENSE_CLAIM",
    recordId: claim.id,
    employeeId: claim.employeeId,
    employeeName: claim.employee.fullName,
    employeeEmail: claim.employee.email,
    category: claim.category,
    claimDate: claim.claimDate.toISOString(),
    vendorName: claim.vendorName ?? "",
    amount: claim.amount,
    currency: claim.currency,
    travelRequestId: claim.travelRequestId ?? "",
    financeRemarks: claim.financeRemarks ?? "",
  }));

  const totalAmount = claims.reduce((sum, claim) => sum + claim.amount, 0);

  const exportRecord = await prisma.payrollExport.create({
    data: {
      exportNumber: await generateExportNumber("EXP"),
      exportType: PayrollExportType.EXPENSE_CLAIMS,
      format: data.format ?? PayrollExportFormat.JSON,
      generatedById,
      totalRecords: claims.length,
      totalAmount,
      currency: "PKR",
      payload: {
        sourceSystem: "IndusConnect",
        targetSystem: "HRIS_PAYROLL",
        exportType: "EXPENSE_CLAIMS",
        generatedAt: new Date().toISOString(),
        records: rows,
      },
      csvContent: buildCsv(rows),
      notes: data.notes,
    },
    include: exportInclude,
  });

  await prisma.expenseClaim.updateMany({
    where: {
      id: {
        in: claims.map((claim) => claim.id),
      },
    },
    data: {
      payrollSyncStatus: PayrollSyncStatus.EXPORTED,
      exportedAt: new Date(),
      payrollExportId: exportRecord.id,
    },
  });

  return getPayrollExportById(exportRecord.id);
}

export async function createVendorBillsExport(
  generatedById: string,
  data: CreatePayrollExportInput
) {
  const bills = await prisma.vendorBill.findMany({
    where: {
      ...getIdFilter(data.vendorBillIds),
      status: VendorBillStatus.APPROVED,
      payrollSyncStatus: PayrollSyncStatus.READY_FOR_EXPORT,
    },
    include: {
      vendor: true,
      route: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  if (bills.length === 0) {
    throw new Error("No approved vendor bills are ready for export");
  }

  const rows = bills.map((bill) => ({
    recordType: "VENDOR_BILL",
    recordId: bill.id,
    vendorId: bill.vendorId,
    vendorName: bill.vendor.vendorName,
    billNumber: bill.billNumber,
    billDate: bill.billDate.toISOString(),
    routeId: bill.routeId ?? "",
    routeName: bill.route?.routeName ?? "",
    amount: bill.amount,
    currency: bill.currency,
    description: bill.description ?? "",
    financeRemarks: bill.financeRemarks ?? "",
  }));

  const totalAmount = bills.reduce((sum, bill) => sum + bill.amount, 0);

  const exportRecord = await prisma.payrollExport.create({
    data: {
      exportNumber: await generateExportNumber("VENDOR"),
      exportType: PayrollExportType.VENDOR_BILLS,
      format: data.format ?? PayrollExportFormat.JSON,
      generatedById,
      totalRecords: bills.length,
      totalAmount,
      currency: "PKR",
      payload: {
        sourceSystem: "IndusConnect",
        targetSystem: "ACCOUNTS_PAYABLE",
        exportType: "VENDOR_BILLS",
        generatedAt: new Date().toISOString(),
        records: rows,
      },
      csvContent: buildCsv(rows),
      notes: data.notes,
    },
    include: exportInclude,
  });

  await prisma.vendorBill.updateMany({
    where: {
      id: {
        in: bills.map((bill) => bill.id),
      },
    },
    data: {
      payrollSyncStatus: PayrollSyncStatus.EXPORTED,
      exportedAt: new Date(),
      payrollExportId: exportRecord.id,
    },
  });

  return getPayrollExportById(exportRecord.id);
}

export async function createTravelAllowancesExport(
  generatedById: string,
  data: CreatePayrollExportInput
) {
  const requests = await prisma.travelRequest.findMany({
    where: {
      ...getIdFilter(data.travelRequestIds),
      status: TravelRequestStatus.APPROVED,
      estimatedBudget: {
        not: null,
      },
      allowancePayrollSyncStatus: {
        not: PayrollSyncStatus.EXPORTED,
      },
    },
    include: {
      employee: true,
      approvedBy: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  if (requests.length === 0) {
    throw new Error("No approved travel allowances are ready for export");
  }

  const rows = requests.map((request) => ({
    recordType: "TRAVEL_ALLOWANCE",
    recordId: request.id,
    employeeId: request.employeeId,
    employeeName: request.employee.fullName,
    employeeEmail: request.employee.email,
    travelType: request.travelType,
    fromLocation: request.fromLocation,
    toLocation: request.toLocation,
    departureDate: request.departureDate.toISOString(),
    returnDate: request.returnDate?.toISOString() ?? "",
    estimatedBudget: request.estimatedBudget ?? 0,
    currency: "PKR",
    approvedBy: request.approvedBy?.fullName ?? "",
  }));

  const totalAmount = requests.reduce(
    (sum, request) => sum + (request.estimatedBudget ?? 0),
    0
  );

  const exportRecord = await prisma.payrollExport.create({
    data: {
      exportNumber: await generateExportNumber("ALLOW"),
      exportType: PayrollExportType.TRAVEL_ALLOWANCES,
      format: data.format ?? PayrollExportFormat.JSON,
      generatedById,
      totalRecords: requests.length,
      totalAmount,
      currency: "PKR",
      payload: {
        sourceSystem: "IndusConnect",
        targetSystem: "HRIS_PAYROLL",
        exportType: "TRAVEL_ALLOWANCES",
        generatedAt: new Date().toISOString(),
        records: rows,
      },
      csvContent: buildCsv(rows),
      notes: data.notes,
    },
    include: exportInclude,
  });

  await prisma.travelRequest.updateMany({
    where: {
      id: {
        in: requests.map((request) => request.id),
      },
    },
    data: {
      allowancePayrollSyncStatus: PayrollSyncStatus.EXPORTED,
      allowanceExportedAt: new Date(),
      allowancePayrollExportId: exportRecord.id,
    },
  });

  return getPayrollExportById(exportRecord.id);
}

export async function createCombinedPayrollExport(
  generatedById: string,
  data: CreatePayrollExportInput
) {
  const claims = await prisma.expenseClaim.findMany({
    where: {
      status: ExpenseClaimStatus.APPROVED,
      payrollSyncStatus: PayrollSyncStatus.READY_FOR_EXPORT,
    },
    include: {
      employee: true,
    },
  });

  const bills = await prisma.vendorBill.findMany({
    where: {
      status: VendorBillStatus.APPROVED,
      payrollSyncStatus: PayrollSyncStatus.READY_FOR_EXPORT,
    },
    include: {
      vendor: true,
      route: true,
    },
  });

  const requests = await prisma.travelRequest.findMany({
    where: {
      status: TravelRequestStatus.APPROVED,
      estimatedBudget: {
        not: null,
      },
      allowancePayrollSyncStatus: {
        not: PayrollSyncStatus.EXPORTED,
      },
    },
    include: {
      employee: true,
    },
  });

  const expenseRows = claims.map((claim) => ({
    recordType: "EXPENSE_CLAIM",
    recordId: claim.id,
    name: claim.employee.fullName,
    amount: claim.amount,
    currency: claim.currency,
  }));

  const vendorRows = bills.map((bill) => ({
    recordType: "VENDOR_BILL",
    recordId: bill.id,
    name: bill.vendor.vendorName,
    amount: bill.amount,
    currency: bill.currency,
  }));

  const allowanceRows = requests.map((request) => ({
    recordType: "TRAVEL_ALLOWANCE",
    recordId: request.id,
    name: request.employee.fullName,
    amount: request.estimatedBudget ?? 0,
    currency: "PKR",
  }));

  const rows = [...expenseRows, ...vendorRows, ...allowanceRows];

  if (rows.length === 0) {
    throw new Error("No payroll records are ready for combined export");
  }

  const totalAmount = rows.reduce(
    (sum, row) => sum + Number(row.amount ?? 0),
    0
  );

  const exportRecord = await prisma.payrollExport.create({
    data: {
      exportNumber: await generateExportNumber("COMBINED"),
      exportType: PayrollExportType.COMBINED,
      format: data.format ?? PayrollExportFormat.JSON,
      generatedById,
      totalRecords: rows.length,
      totalAmount,
      currency: "PKR",
      payload: {
        sourceSystem: "IndusConnect",
        targetSystem: "HRIS_ERP",
        exportType: "COMBINED",
        generatedAt: new Date().toISOString(),
        records: rows,
      },
      csvContent: buildCsv(rows),
      notes: data.notes,
    },
    include: exportInclude,
  });

  await prisma.expenseClaim.updateMany({
    where: {
      id: {
        in: claims.map((claim) => claim.id),
      },
    },
    data: {
      payrollSyncStatus: PayrollSyncStatus.EXPORTED,
      exportedAt: new Date(),
      payrollExportId: exportRecord.id,
    },
  });

  await prisma.vendorBill.updateMany({
    where: {
      id: {
        in: bills.map((bill) => bill.id),
      },
    },
    data: {
      payrollSyncStatus: PayrollSyncStatus.EXPORTED,
      exportedAt: new Date(),
      payrollExportId: exportRecord.id,
    },
  });

  await prisma.travelRequest.updateMany({
    where: {
      id: {
        in: requests.map((request) => request.id),
      },
    },
    data: {
      allowancePayrollSyncStatus: PayrollSyncStatus.EXPORTED,
      allowanceExportedAt: new Date(),
      allowancePayrollExportId: exportRecord.id,
    },
  });

  return getPayrollExportById(exportRecord.id);
}

export async function getAllPayrollExports() {
  return prisma.payrollExport.findMany({
    include: exportInclude,
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getPayrollExportById(id: string) {
  const exportRecord = await prisma.payrollExport.findUnique({
    where: {
      id,
    },
    include: exportInclude,
  });

  if (!exportRecord) {
    throw new Error("Payroll export not found");
  }

  return exportRecord;
}

export async function markPayrollExportAsDownloaded(id: string) {
  await getPayrollExportById(id);

  return prisma.payrollExport.update({
    where: {
      id,
    },
    data: {
      status: PayrollExportStatus.DOWNLOADED,
    },
    include: exportInclude,
  });
}

export async function markPayrollExportAsSynced(id: string) {
  await getPayrollExportById(id);

  return prisma.payrollExport.update({
    where: {
      id,
    },
    data: {
      status: PayrollExportStatus.SYNCED,
      syncedAt: new Date(),
    },
    include: exportInclude,
  });
}

export async function markPayrollExportAsFailed(
  id: string,
  failureReason: string
) {
  await getPayrollExportById(id);

  return prisma.payrollExport.update({
    where: {
      id,
    },
    data: {
      status: PayrollExportStatus.FAILED,
      failureReason,
    },
    include: exportInclude,
  });
}