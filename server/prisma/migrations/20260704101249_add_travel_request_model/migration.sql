-- CreateEnum
CREATE TYPE "TravelType" AS ENUM ('INTER_CAMPUS', 'WITHIN_CITY', 'INTER_CITY', 'INTERNATIONAL');

-- CreateEnum
CREATE TYPE "TravelRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TravelUrgency" AS ENUM ('NORMAL', 'URGENT', 'EMERGENCY');

-- CreateTable
CREATE TABLE "TravelRequest" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "travelType" "TravelType" NOT NULL,
    "urgency" "TravelUrgency" NOT NULL DEFAULT 'NORMAL',
    "purpose" TEXT NOT NULL,
    "fromLocation" TEXT NOT NULL,
    "toLocation" TEXT NOT NULL,
    "departureDate" TIMESTAMP(3) NOT NULL,
    "returnDate" TIMESTAMP(3),
    "accommodationRequired" BOOLEAN NOT NULL DEFAULT false,
    "transportRequired" BOOLEAN NOT NULL DEFAULT false,
    "estimatedBudget" DOUBLE PRECISION,
    "status" "TravelRequestStatus" NOT NULL DEFAULT 'PENDING',
    "approvedById" TEXT,
    "decisionRemarks" TEXT,
    "decidedAt" TIMESTAMP(3),
    "employeeRemarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TravelRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TravelRequest_employeeId_idx" ON "TravelRequest"("employeeId");

-- CreateIndex
CREATE INDEX "TravelRequest_approvedById_idx" ON "TravelRequest"("approvedById");

-- CreateIndex
CREATE INDEX "TravelRequest_status_idx" ON "TravelRequest"("status");

-- AddForeignKey
ALTER TABLE "TravelRequest" ADD CONSTRAINT "TravelRequest_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TravelRequest" ADD CONSTRAINT "TravelRequest_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
