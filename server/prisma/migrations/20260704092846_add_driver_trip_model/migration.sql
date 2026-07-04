-- CreateEnum
CREATE TYPE "TripStatus" AS ENUM ('CHECKLIST_PENDING', 'READY', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TripIssueType" AS ENUM ('DELAY', 'BREAKDOWN', 'SOS', 'OTHER');

-- CreateTable
CREATE TABLE "TransportTrip" (
    "id" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "status" "TripStatus" NOT NULL DEFAULT 'CHECKLIST_PENDING',
    "fuelChecked" BOOLEAN NOT NULL DEFAULT false,
    "tiresChecked" BOOLEAN NOT NULL DEFAULT false,
    "brakesChecked" BOOLEAN NOT NULL DEFAULT false,
    "lightsChecked" BOOLEAN NOT NULL DEFAULT false,
    "checklistSubmittedAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "issueType" "TripIssueType",
    "issueDescription" TEXT,
    "issueLatitude" DOUBLE PRECISION,
    "issueLongitude" DOUBLE PRECISION,
    "issueReportedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TransportTrip_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TransportTrip_routeId_idx" ON "TransportTrip"("routeId");

-- CreateIndex
CREATE INDEX "TransportTrip_driverId_idx" ON "TransportTrip"("driverId");

-- AddForeignKey
ALTER TABLE "TransportTrip" ADD CONSTRAINT "TransportTrip_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "TransportRoute"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransportTrip" ADD CONSTRAINT "TransportTrip_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
