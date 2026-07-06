/*
  Warnings:

  - A unique constraint covering the columns `[employeeCode]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "HRGrade" AS ENUM ('SUPPORT_STAFF', 'STAFF', 'OFFICER', 'MANAGER', 'SENIOR_MANAGER', 'EXECUTIVE', 'DOCTOR', 'CONSULTANT');

-- CreateEnum
CREATE TYPE "PolicyRuleType" AS ENUM ('TRAVEL_APPROVAL', 'EXPENSE_LIMIT', 'ACCOMMODATION_FALLBACK', 'TRANSPORT_CUTOFF');

-- CreateEnum
CREATE TYPE "PolicyRuleStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "PolicyDecisionStatus" AS ENUM ('PASSED', 'WARNING', 'REVIEW_REQUIRED', 'BLOCKED');

-- AlterEnum
ALTER TYPE "AuditEntity" ADD VALUE 'POLICY_RULE';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "department" TEXT,
ADD COLUMN     "employeeCode" TEXT,
ADD COLUMN     "hrGrade" "HRGrade" NOT NULL DEFAULT 'STAFF';

-- CreateTable
CREATE TABLE "PolicyRule" (
    "id" TEXT NOT NULL,
    "ruleName" TEXT NOT NULL,
    "ruleCode" TEXT NOT NULL,
    "ruleType" "PolicyRuleType" NOT NULL,
    "status" "PolicyRuleStatus" NOT NULL DEFAULT 'ACTIVE',
    "department" TEXT,
    "hrGrade" "HRGrade",
    "maxAmount" DOUBLE PRECISION,
    "requiresManagerApproval" BOOLEAN NOT NULL DEFAULT false,
    "requiresFinanceApproval" BOOLEAN NOT NULL DEFAULT false,
    "requiresTransportApproval" BOOLEAN NOT NULL DEFAULT false,
    "requiresAccommodationApproval" BOOLEAN NOT NULL DEFAULT false,
    "allowEmergencyOverride" BOOLEAN NOT NULL DEFAULT false,
    "cutoffHoursBeforeShift" INTEGER,
    "internalFirstRequired" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PolicyRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PolicyDecisionLog" (
    "id" TEXT NOT NULL,
    "policyRuleId" TEXT,
    "userId" TEXT,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "decision" "PolicyDecisionStatus" NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PolicyDecisionLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PolicyRule_ruleCode_key" ON "PolicyRule"("ruleCode");

-- CreateIndex
CREATE INDEX "PolicyRule_ruleType_idx" ON "PolicyRule"("ruleType");

-- CreateIndex
CREATE INDEX "PolicyRule_status_idx" ON "PolicyRule"("status");

-- CreateIndex
CREATE INDEX "PolicyRule_hrGrade_idx" ON "PolicyRule"("hrGrade");

-- CreateIndex
CREATE INDEX "PolicyRule_department_idx" ON "PolicyRule"("department");

-- CreateIndex
CREATE INDEX "PolicyDecisionLog_policyRuleId_idx" ON "PolicyDecisionLog"("policyRuleId");

-- CreateIndex
CREATE INDEX "PolicyDecisionLog_userId_idx" ON "PolicyDecisionLog"("userId");

-- CreateIndex
CREATE INDEX "PolicyDecisionLog_entityType_idx" ON "PolicyDecisionLog"("entityType");

-- CreateIndex
CREATE INDEX "PolicyDecisionLog_entityId_idx" ON "PolicyDecisionLog"("entityId");

-- CreateIndex
CREATE INDEX "PolicyDecisionLog_decision_idx" ON "PolicyDecisionLog"("decision");

-- CreateIndex
CREATE UNIQUE INDEX "User_employeeCode_key" ON "User"("employeeCode");

-- AddForeignKey
ALTER TABLE "PolicyDecisionLog" ADD CONSTRAINT "PolicyDecisionLog_policyRuleId_fkey" FOREIGN KEY ("policyRuleId") REFERENCES "PolicyRule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PolicyDecisionLog" ADD CONSTRAINT "PolicyDecisionLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
