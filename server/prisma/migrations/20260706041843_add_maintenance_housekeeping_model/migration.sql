-- CreateEnum
CREATE TYPE "MaintenanceTaskType" AS ENUM ('ROUTINE_SERVICE', 'REPAIR', 'BREAKDOWN', 'INSPECTION', 'FITNESS_RENEWAL', 'OTHER');

-- CreateEnum
CREATE TYPE "MaintenanceTaskStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MaintenancePriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "HousekeepingTaskType" AS ENUM ('ROOM_CLEANING', 'LINEN_CHANGE', 'SANITIZATION', 'INSPECTION', 'MAINTENANCE_REQUIRED', 'OTHER');

-- CreateEnum
CREATE TYPE "HousekeepingTaskStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "HousekeepingPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditEntity" ADD VALUE 'MAINTENANCE_TASK';
ALTER TYPE "AuditEntity" ADD VALUE 'HOUSEKEEPING_TASK';

-- CreateTable
CREATE TABLE "VehicleMaintenanceTask" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "driverId" TEXT,
    "transportTripId" TEXT,
    "telemetryLogId" TEXT,
    "reportedById" TEXT,
    "assignedToId" TEXT,
    "taskType" "MaintenanceTaskType" NOT NULL,
    "priority" "MaintenancePriority" NOT NULL DEFAULT 'NORMAL',
    "status" "MaintenanceTaskStatus" NOT NULL DEFAULT 'OPEN',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "resolutionNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VehicleMaintenanceTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HousekeepingTask" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "reservationId" TEXT,
    "createdById" TEXT,
    "assignedToId" TEXT,
    "taskType" "HousekeepingTaskType" NOT NULL DEFAULT 'ROOM_CLEANING',
    "priority" "HousekeepingPriority" NOT NULL DEFAULT 'NORMAL',
    "status" "HousekeepingTaskStatus" NOT NULL DEFAULT 'PENDING',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dueDate" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "completionNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HousekeepingTask_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VehicleMaintenanceTask_telemetryLogId_key" ON "VehicleMaintenanceTask"("telemetryLogId");

-- CreateIndex
CREATE INDEX "VehicleMaintenanceTask_vehicleId_idx" ON "VehicleMaintenanceTask"("vehicleId");

-- CreateIndex
CREATE INDEX "VehicleMaintenanceTask_driverId_idx" ON "VehicleMaintenanceTask"("driverId");

-- CreateIndex
CREATE INDEX "VehicleMaintenanceTask_transportTripId_idx" ON "VehicleMaintenanceTask"("transportTripId");

-- CreateIndex
CREATE INDEX "VehicleMaintenanceTask_reportedById_idx" ON "VehicleMaintenanceTask"("reportedById");

-- CreateIndex
CREATE INDEX "VehicleMaintenanceTask_assignedToId_idx" ON "VehicleMaintenanceTask"("assignedToId");

-- CreateIndex
CREATE INDEX "VehicleMaintenanceTask_status_idx" ON "VehicleMaintenanceTask"("status");

-- CreateIndex
CREATE INDEX "VehicleMaintenanceTask_priority_idx" ON "VehicleMaintenanceTask"("priority");

-- CreateIndex
CREATE INDEX "HousekeepingTask_roomId_idx" ON "HousekeepingTask"("roomId");

-- CreateIndex
CREATE INDEX "HousekeepingTask_reservationId_idx" ON "HousekeepingTask"("reservationId");

-- CreateIndex
CREATE INDEX "HousekeepingTask_createdById_idx" ON "HousekeepingTask"("createdById");

-- CreateIndex
CREATE INDEX "HousekeepingTask_assignedToId_idx" ON "HousekeepingTask"("assignedToId");

-- CreateIndex
CREATE INDEX "HousekeepingTask_status_idx" ON "HousekeepingTask"("status");

-- CreateIndex
CREATE INDEX "HousekeepingTask_priority_idx" ON "HousekeepingTask"("priority");

-- AddForeignKey
ALTER TABLE "VehicleMaintenanceTask" ADD CONSTRAINT "VehicleMaintenanceTask_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleMaintenanceTask" ADD CONSTRAINT "VehicleMaintenanceTask_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleMaintenanceTask" ADD CONSTRAINT "VehicleMaintenanceTask_transportTripId_fkey" FOREIGN KEY ("transportTripId") REFERENCES "TransportTrip"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleMaintenanceTask" ADD CONSTRAINT "VehicleMaintenanceTask_telemetryLogId_fkey" FOREIGN KEY ("telemetryLogId") REFERENCES "VehicleTelemetryLog"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleMaintenanceTask" ADD CONSTRAINT "VehicleMaintenanceTask_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleMaintenanceTask" ADD CONSTRAINT "VehicleMaintenanceTask_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HousekeepingTask" ADD CONSTRAINT "HousekeepingTask_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HousekeepingTask" ADD CONSTRAINT "HousekeepingTask_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "RoomReservation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HousekeepingTask" ADD CONSTRAINT "HousekeepingTask_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HousekeepingTask" ADD CONSTRAINT "HousekeepingTask_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
