-- CreateEnum
CREATE TYPE "PayrollExportType" AS ENUM ('EXPENSE_CLAIMS', 'VENDOR_BILLS', 'TRAVEL_ALLOWANCES', 'COMBINED');

-- CreateEnum
CREATE TYPE "PayrollExportFormat" AS ENUM ('JSON', 'CSV');

-- CreateEnum
CREATE TYPE "PayrollExportStatus" AS ENUM ('GENERATED', 'DOWNLOADED', 'SYNCED', 'FAILED');

-- AlterEnum
ALTER TYPE "AuditEntity" ADD VALUE 'ERP_EXPORT';

-- AlterTable
ALTER TABLE "ExpenseClaim" ADD COLUMN     "payrollExportId" TEXT;

-- AlterTable
ALTER TABLE "TravelRequest" ADD COLUMN     "allowanceExportedAt" TIMESTAMP(3),
ADD COLUMN     "allowancePayrollExportId" TEXT,
ADD COLUMN     "allowancePayrollSyncStatus" "PayrollSyncStatus" NOT NULL DEFAULT 'NOT_READY';

-- AlterTable
ALTER TABLE "VendorBill" ADD COLUMN     "exportedAt" TIMESTAMP(3),
ADD COLUMN     "payrollExportId" TEXT,
ADD COLUMN     "payrollSyncStatus" "PayrollSyncStatus" NOT NULL DEFAULT 'NOT_READY';

-- CreateTable
CREATE TABLE "PayrollExport" (
    "id" TEXT NOT NULL,
    "exportNumber" TEXT NOT NULL,
    "exportType" "PayrollExportType" NOT NULL,
    "format" "PayrollExportFormat" NOT NULL DEFAULT 'JSON',
    "status" "PayrollExportStatus" NOT NULL DEFAULT 'GENERATED',
    "generatedById" TEXT,
    "totalRecords" INTEGER NOT NULL DEFAULT 0,
    "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'PKR',
    "payload" JSONB NOT NULL,
    "csvContent" TEXT,
    "syncedAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayrollExport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PayrollExport_exportNumber_key" ON "PayrollExport"("exportNumber");

-- CreateIndex
CREATE INDEX "PayrollExport_exportType_idx" ON "PayrollExport"("exportType");

-- CreateIndex
CREATE INDEX "PayrollExport_status_idx" ON "PayrollExport"("status");

-- CreateIndex
CREATE INDEX "PayrollExport_generatedById_idx" ON "PayrollExport"("generatedById");

-- CreateIndex
CREATE INDEX "PayrollExport_createdAt_idx" ON "PayrollExport"("createdAt");

-- CreateIndex
CREATE INDEX "ExpenseClaim_payrollExportId_idx" ON "ExpenseClaim"("payrollExportId");

-- CreateIndex
CREATE INDEX "TravelRequest_allowancePayrollExportId_idx" ON "TravelRequest"("allowancePayrollExportId");

-- CreateIndex
CREATE INDEX "TravelRequest_allowancePayrollSyncStatus_idx" ON "TravelRequest"("allowancePayrollSyncStatus");

-- CreateIndex
CREATE INDEX "VendorBill_payrollExportId_idx" ON "VendorBill"("payrollExportId");

-- CreateIndex
CREATE INDEX "VendorBill_payrollSyncStatus_idx" ON "VendorBill"("payrollSyncStatus");

-- AddForeignKey
ALTER TABLE "TravelRequest" ADD CONSTRAINT "TravelRequest_allowancePayrollExportId_fkey" FOREIGN KEY ("allowancePayrollExportId") REFERENCES "PayrollExport"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseClaim" ADD CONSTRAINT "ExpenseClaim_payrollExportId_fkey" FOREIGN KEY ("payrollExportId") REFERENCES "PayrollExport"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorBill" ADD CONSTRAINT "VendorBill_payrollExportId_fkey" FOREIGN KEY ("payrollExportId") REFERENCES "PayrollExport"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollExport" ADD CONSTRAINT "PayrollExport_generatedById_fkey" FOREIGN KEY ("generatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
