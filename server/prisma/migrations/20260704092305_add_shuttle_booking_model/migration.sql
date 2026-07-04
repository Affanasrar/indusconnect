-- CreateEnum
CREATE TYPE "ShuttleBookingStatus" AS ENUM ('PENDING', 'ASSIGNED', 'CANCELLED', 'COMPLETED', 'NO_SHOW');

-- CreateTable
CREATE TABLE "ShuttleBooking" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "routeId" TEXT,
    "pickupStopId" TEXT,
    "bookingDate" TIMESTAMP(3) NOT NULL,
    "shiftType" "ShiftType" NOT NULL,
    "pickupArea" TEXT NOT NULL,
    "pickupAddress" TEXT,
    "seatNumber" TEXT,
    "status" "ShuttleBookingStatus" NOT NULL DEFAULT 'PENDING',
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShuttleBooking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ShuttleBooking_employeeId_idx" ON "ShuttleBooking"("employeeId");

-- CreateIndex
CREATE INDEX "ShuttleBooking_routeId_idx" ON "ShuttleBooking"("routeId");

-- CreateIndex
CREATE INDEX "ShuttleBooking_pickupStopId_idx" ON "ShuttleBooking"("pickupStopId");

-- AddForeignKey
ALTER TABLE "ShuttleBooking" ADD CONSTRAINT "ShuttleBooking_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShuttleBooking" ADD CONSTRAINT "ShuttleBooking_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "TransportRoute"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShuttleBooking" ADD CONSTRAINT "ShuttleBooking_pickupStopId_fkey" FOREIGN KEY ("pickupStopId") REFERENCES "SmartStop"("id") ON DELETE SET NULL ON UPDATE CASCADE;
