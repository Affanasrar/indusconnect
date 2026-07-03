import { DriverStatus, RoleName } from "@prisma/client";
import prisma from "../../config/prisma";
import {
  CreateDriverInput,
  UpdateDriverInput,
} from "./driver.validation";

const driverInclude = {
  user: {
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      status: true,
      role: {
        select: {
          name: true,
        },
      },
    },
  },
  vehicle: true,
};

export async function getAllDrivers() {
  return prisma.driver.findMany({
    include: driverInclude,
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getDriverById(id: string) {
  const driver = await prisma.driver.findUnique({
    where: { id },
    include: driverInclude,
  });

  if (!driver) {
    throw new Error("Driver not found");
  }

  return driver;
}

export async function createDriver(data: CreateDriverInput) {
  const user = await prisma.user.findUnique({
    where: {
      id: data.userId,
    },
    include: {
      role: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  if (user.role.name !== RoleName.DRIVER) {
    throw new Error("Selected user must have DRIVER role");
  }

  const existingDriverProfile = await prisma.driver.findUnique({
    where: {
      userId: data.userId,
    },
  });

  if (existingDriverProfile) {
    throw new Error("Driver profile already exists for this user");
  }

  const existingLicense = await prisma.driver.findUnique({
    where: {
      licenseNumber: data.licenseNumber,
    },
  });

  if (existingLicense) {
    throw new Error("Driver with this license number already exists");
  }

  if (data.vehicleId) {
    const vehicle = await prisma.vehicle.findUnique({
      where: {
        id: data.vehicleId,
      },
    });

    if (!vehicle) {
      throw new Error("Vehicle not found");
    }
  }

  return prisma.driver.create({
    data: {
      userId: data.userId,
      licenseNumber: data.licenseNumber,
      cnic: data.cnic,
      address: data.address,
      vehicleId: data.vehicleId,
      status: data.vehicleId ? DriverStatus.ASSIGNED : DriverStatus.AVAILABLE,
    },
    include: driverInclude,
  });
}

export async function updateDriver(id: string, data: UpdateDriverInput) {
  await getDriverById(id);

  if (data.licenseNumber) {
    const existingLicense = await prisma.driver.findUnique({
      where: {
        licenseNumber: data.licenseNumber,
      },
    });

    if (existingLicense && existingLicense.id !== id) {
      throw new Error("Driver with this license number already exists");
    }
  }

  if (data.vehicleId) {
    const vehicle = await prisma.vehicle.findUnique({
      where: {
        id: data.vehicleId,
      },
    });

    if (!vehicle) {
      throw new Error("Vehicle not found");
    }
  }

  return prisma.driver.update({
    where: { id },
    data: {
      licenseNumber: data.licenseNumber,
      cnic: data.cnic,
      address: data.address,
      status:
        data.status ??
        (data.vehicleId ? DriverStatus.ASSIGNED : undefined),
      vehicleId: data.vehicleId,
    },
    include: driverInclude,
  });
}

export async function deactivateDriver(id: string) {
  await getDriverById(id);

  return prisma.driver.update({
    where: { id },
    data: {
      status: DriverStatus.INACTIVE,
      vehicleId: null,
    },
    include: driverInclude,
  });
}