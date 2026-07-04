-- CreateEnum
CREATE TYPE "ExpenseCategory" AS ENUM ('TRAVEL', 'MEAL', 'ACCOMMODATION', 'FUEL', 'OTHER');

-- CreateEnum
CREATE TYPE "ExpenseClaimStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'FLAGGED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ExpenseAnomalyStatus" AS ENUM ('NORMAL', 'ANOMALY_REVIEW_REQUIRED');

-- CreateEnum
CREATE TYPE "PayrollSyncStatus" AS ENUM ('NOT_READY', 'READY_FOR_EXPORT', 'EXPORTED');

-- CreateTable
CREATE TABLE "ExpenseClaim" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "travelRequestId" TEXT,
    "category" "ExpenseCategory" NOT NULL,
    "claimDate" TIMESTAMP(3) NOT NULL,
    "vendorName" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'PKR',
    "description" TEXT,
    "receiptUrl" TEXT,
    "ocrVendorName" TEXT,
    "ocrDate" TEXT,
    "ocrAmount" DOUBLE PRECISION,
    "anomalyStatus" "ExpenseAnomalyStatus" NOT NULL DEFAULT 'NORMAL',
    "anomalyReason" TEXT,
    "status" "ExpenseClaimStatus" NOT NULL DEFAULT 'PENDING',
    "financeRemarks" TEXT,
    "reviewedById" TEXT,
    "payrollSyncStatus" "PayrollSyncStatus" NOT NULL DEFAULT 'NOT_READY',
    "exportedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExpenseClaim_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExpenseClaim_employeeId_idx" ON "ExpenseClaim"("employeeId");

-- CreateIndex
CREATE INDEX "ExpenseClaim_travelRequestId_idx" ON "ExpenseClaim"("travelRequestId");

-- CreateIndex
CREATE INDEX "ExpenseClaim_status_idx" ON "ExpenseClaim"("status");

-- CreateIndex
CREATE INDEX "ExpenseClaim_anomalyStatus_idx" ON "ExpenseClaim"("anomalyStatus");

-- AddForeignKey
ALTER TABLE "ExpenseClaim" ADD CONSTRAINT "ExpenseClaim_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseClaim" ADD CONSTRAINT "ExpenseClaim_travelRequestId_fkey" FOREIGN KEY ("travelRequestId") REFERENCES "TravelRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseClaim" ADD CONSTRAINT "ExpenseClaim_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
