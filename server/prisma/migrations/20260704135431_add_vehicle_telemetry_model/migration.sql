-- CreateEnum
CREATE TYPE "TelemetryStatus" AS ENUM ('MOVING', 'STOPPED', 'DELAYED', 'BREAKDOWN', 'SOS', 'OFFLINE');

-- CreateEnum
CREATE TYPE "TelemetrySource" AS ENUM ('MOBILE_GPS', 'MOCK_GPS');

-- CreateTable
CREATE TABLE "VehicleTelemetryLog" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "vehicleId" TEXT,
    "routeId" TEXT,
    "transportTripId" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "speed" DOUBLE PRECISION,
    "heading" DOUBLE PRECISION,
    "status" "TelemetryStatus" NOT NULL DEFAULT 'MOVING',
    "source" "TelemetrySource" NOT NULL DEFAULT 'MOBILE_GPS',
    "batteryLevel" INTEGER,
    "accuracy" DOUBLE PRECISION,
    "remarks" TEXT,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VehicleTelemetryLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VehicleTelemetryLog_driverId_idx" ON "VehicleTelemetryLog"("driverId");

-- CreateIndex
CREATE INDEX "VehicleTelemetryLog_vehicleId_idx" ON "VehicleTelemetryLog"("vehicleId");

-- CreateIndex
CREATE INDEX "VehicleTelemetryLog_routeId_idx" ON "VehicleTelemetryLog"("routeId");

-- CreateIndex
CREATE INDEX "VehicleTelemetryLog_transportTripId_idx" ON "VehicleTelemetryLog"("transportTripId");

-- CreateIndex
CREATE INDEX "VehicleTelemetryLog_status_idx" ON "VehicleTelemetryLog"("status");

-- CreateIndex
CREATE INDEX "VehicleTelemetryLog_recordedAt_idx" ON "VehicleTelemetryLog"("recordedAt");

-- AddForeignKey
ALTER TABLE "VehicleTelemetryLog" ADD CONSTRAINT "VehicleTelemetryLog_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleTelemetryLog" ADD CONSTRAINT "VehicleTelemetryLog_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleTelemetryLog" ADD CONSTRAINT "VehicleTelemetryLog_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "TransportRoute"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleTelemetryLog" ADD CONSTRAINT "VehicleTelemetryLog_transportTripId_fkey" FOREIGN KEY ("transportTripId") REFERENCES "TransportTrip"("id") ON DELETE SET NULL ON UPDATE CASCADE;
