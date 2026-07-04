import {
  OwnershipType,
  VendorBillStatus,
  VendorStatus,
} from "@prisma/client";
import prisma from "../../config/prisma";
import {
  AssignVendorToRouteInput,
  AssignVendorToVehicleInput,
  CreateVendorBillInput,
  CreateVendorInput,
  UpdateVendorBillStatusInput,
  UpdateVendorInput,
} from "./vendor.validation";

const vendorInclude = {
  vehicles: true,
  routes: true,
  bills: {
    orderBy: {
      createdAt: "desc" as const,
    },
  },
};

const vendorBillInclude = {
  vendor: true,
  route: true,
};

export async function createVendor(data: CreateVendorInput) {
  const existingVendor = await prisma.vendor.findUnique({
    where: {
      vendorName: data.vendorName,
    },
  });

  if (existingVendor) {
    throw new Error("Vendor with this name already exists");
  }

  return prisma.vendor.create({
    data: {
      vendorName: data.vendorName,
      contactPerson: data.contactPerson,
      phone: data.phone,
      email: data.email,
      address: data.address,
      contractType: data.contractType,
      status: data.status,
      contractStartDate: data.contractStartDate
        ? new Date(data.contractStartDate)
        : undefined,
      contractEndDate: data.contractEndDate
        ? new Date(data.contractEndDate)
        : undefined,
      notes: data.notes,
    },
    include: vendorInclude,
  });
}

export async function getAllVendors() {
  return prisma.vendor.findMany({
    include: vendorInclude,
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getActiveVendors() {
  return prisma.vendor.findMany({
    where: {
      status: VendorStatus.ACTIVE,
    },
    include: vendorInclude,
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getVendorById(id: string) {
  const vendor = await prisma.vendor.findUnique({
    where: {
      id,
    },
    include: vendorInclude,
  });

  if (!vendor) {
    throw new Error("Vendor not found");
  }

  return vendor;
}

export async function updateVendor(id: string, data: UpdateVendorInput) {
  await getVendorById(id);

  if (data.vendorName) {
    const existingVendor = await prisma.vendor.findUnique({
      where: {
        vendorName: data.vendorName,
      },
    });

    if (existingVendor && existingVendor.id !== id) {
      throw new Error("Vendor with this name already exists");
    }
  }

  return prisma.vendor.update({
    where: {
      id,
    },
    data: {
      vendorName: data.vendorName,
      contactPerson: data.contactPerson,
      phone: data.phone,
      email: data.email,
      address: data.address,
      contractType: data.contractType,
      status: data.status,
      contractStartDate: data.contractStartDate
        ? new Date(data.contractStartDate)
        : undefined,
      contractEndDate: data.contractEndDate
        ? new Date(data.contractEndDate)
        : undefined,
      notes: data.notes,
    },
    include: vendorInclude,
  });
}

export async function deactivateVendor(id: string) {
  await getVendorById(id);

  return prisma.vendor.update({
    where: {
      id,
    },
    data: {
      status: VendorStatus.INACTIVE,
    },
    include: vendorInclude,
  });
}

export async function assignVendorToVehicle(
  vehicleId: string,
  data: AssignVendorToVehicleInput
) {
  const vendor = await getVendorById(data.vendorId);

  if (vendor.status !== VendorStatus.ACTIVE) {
    throw new Error("Only active vendors can be assigned to vehicles");
  }

  const vehicle = await prisma.vehicle.findUnique({
    where: {
      id: vehicleId,
    },
  });

  if (!vehicle) {
    throw new Error("Vehicle not found");
  }

  return prisma.vehicle.update({
    where: {
      id: vehicleId,
    },
    data: {
      vendorId: data.vendorId,
      ownershipType: OwnershipType.VENDOR,
      vendorName: vendor.vendorName,
    },
  });
}

export async function assignVendorToRoute(
  routeId: string,
  data: AssignVendorToRouteInput
) {
  const vendor = await getVendorById(data.vendorId);

  if (vendor.status !== VendorStatus.ACTIVE) {
    throw new Error("Only active vendors can be assigned to routes");
  }

  const route = await prisma.transportRoute.findUnique({
    where: {
      id: routeId,
    },
  });

  if (!route) {
    throw new Error("Route not found");
  }

  return prisma.transportRoute.update({
    where: {
      id: routeId,
    },
    data: {
      vendorId: data.vendorId,
      notes: route.notes
        ? `${route.notes} | Assigned to vendor: ${vendor.vendorName}`
        : `Assigned to vendor: ${vendor.vendorName}`,
    },
    include: {
      vehicle: true,
      driver: {
        include: {
          user: true,
        },
      },
      vendor: true,
      smartStops: true,
    },
  });
}

export async function createVendorBill(data: CreateVendorBillInput) {
  await getVendorById(data.vendorId);

  const existingBill = await prisma.vendorBill.findUnique({
    where: {
      billNumber: data.billNumber,
    },
  });

  if (existingBill) {
    throw new Error("Vendor bill with this bill number already exists");
  }

  if (data.routeId) {
    const route = await prisma.transportRoute.findUnique({
      where: {
        id: data.routeId,
      },
    });

    if (!route) {
      throw new Error("Route not found");
    }

    if (route.vendorId !== data.vendorId) {
      throw new Error("Selected route is not assigned to this vendor");
    }
  }

  return prisma.vendorBill.create({
    data: {
      vendorId: data.vendorId,
      routeId: data.routeId,
      billNumber: data.billNumber,
      billDate: new Date(data.billDate),
      amount: data.amount,
      currency: data.currency ?? "PKR",
      description: data.description,
    },
    include: vendorBillInclude,
  });
}

export async function getAllVendorBills() {
  return prisma.vendorBill.findMany({
    include: vendorBillInclude,
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getPendingVendorBills() {
  return prisma.vendorBill.findMany({
    where: {
      status: VendorBillStatus.PENDING,
    },
    include: vendorBillInclude,
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getVendorBillById(id: string) {
  const bill = await prisma.vendorBill.findUnique({
    where: {
      id,
    },
    include: vendorBillInclude,
  });

  if (!bill) {
    throw new Error("Vendor bill not found");
  }

  return bill;
}

export async function approveVendorBill(
  id: string,
  data: UpdateVendorBillStatusInput
) {
  await getVendorBillById(id);

  return prisma.vendorBill.update({
    where: {
      id,
    },
    data: {
      status: VendorBillStatus.APPROVED,
      financeRemarks: data.financeRemarks,
      approvedAt: new Date(),
    },
    include: vendorBillInclude,
  });
}

export async function rejectVendorBill(
  id: string,
  data: UpdateVendorBillStatusInput
) {
  await getVendorBillById(id);

  return prisma.vendorBill.update({
    where: {
      id,
    },
    data: {
      status: VendorBillStatus.REJECTED,
      financeRemarks: data.financeRemarks,
    },
    include: vendorBillInclude,
  });
}

export async function markVendorBillAsPaid(id: string) {
  const bill = await getVendorBillById(id);

  if (bill.status !== VendorBillStatus.APPROVED) {
    throw new Error("Only approved vendor bills can be marked as paid");
  }

  return prisma.vendorBill.update({
    where: {
      id,
    },
    data: {
      status: VendorBillStatus.PAID,
      paidAt: new Date(),
    },
    include: vendorBillInclude,
  });
}