import { VehicleStatus } from "@prisma/client";
import prisma from "../../config/prisma";
import {
  CreateVehicleInput,
  UpdateVehicleInput,
} from "./vehicle.validation";

export async function getAllVehicles() {
  return prisma.vehicle.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getVehicleById(id: string) {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id },
  });

  if (!vehicle) {
    throw new Error("Vehicle not found");
  }

  return vehicle;
}

export async function createVehicle(data: CreateVehicleInput) {
  const existingVehicle = await prisma.vehicle.findUnique({
    where: {
      vehicleNumber: data.vehicleNumber,
    },
  });

  if (existingVehicle) {
    throw new Error("Vehicle with this number already exists");
  }

  return prisma.vehicle.create({
    data: {
      vehicleNumber: data.vehicleNumber,
      vehicleType: data.vehicleType,
      capacity: data.capacity,
      ownershipType: data.ownershipType,
      vendorName: data.vendorName,
      status: data.status,
      fitnessStatus: data.fitnessStatus,
      notes: data.notes,
    },
  });
}

export async function updateVehicle(id: string, data: UpdateVehicleInput) {
  await getVehicleById(id);

  if (data.vehicleNumber) {
    const existingVehicle = await prisma.vehicle.findUnique({
      where: {
        vehicleNumber: data.vehicleNumber,
      },
    });

    if (existingVehicle && existingVehicle.id !== id) {
      throw new Error("Vehicle with this number already exists");
    }
  }

  return prisma.vehicle.update({
    where: { id },
    data,
  });
}

export async function deactivateVehicle(id: string) {
  await getVehicleById(id);

  return prisma.vehicle.update({
    where: { id },
    data: {
      status: VehicleStatus.INACTIVE,
    },
  });
}