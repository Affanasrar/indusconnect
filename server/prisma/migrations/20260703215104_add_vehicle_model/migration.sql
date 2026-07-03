-- CreateEnum
CREATE TYPE "VehicleType" AS ENUM ('BUS', 'VAN', 'CAR', 'COASTER', 'HIACE');

-- CreateEnum
CREATE TYPE "VehicleStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "OwnershipType" AS ENUM ('OWNED', 'VENDOR');

-- CreateEnum
CREATE TYPE "FitnessStatus" AS ENUM ('VALID', 'EXPIRED', 'PENDING');

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL,
    "vehicleNumber" TEXT NOT NULL,
    "vehicleType" "VehicleType" NOT NULL,
    "capacity" INTEGER NOT NULL,
    "ownershipType" "OwnershipType" NOT NULL DEFAULT 'OWNED',
    "vendorName" TEXT,
    "status" "VehicleStatus" NOT NULL DEFAULT 'ACTIVE',
    "fitnessStatus" "FitnessStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_vehicleNumber_key" ON "Vehicle"("vehicleNumber");
