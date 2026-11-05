import { 
  NotificationPriority,
  NotificationType,
  TravelRequestStatus } from "@prisma/client";
import { createNotification } from "../notifications/notification.service";
import prisma from "../../config/prisma";
import {
  CancelTravelRequestInput,
  CreateTravelRequestInput,
  DecisionTravelRequestInput,
  UpdateTravelRequestInput,
} from "./travelRequest.validation";


interface AuthUser {
  userId: string;
  email: string;
  role: string;
}

const travelRequestInclude = {
  employee: {
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      employeeCode: true,
      department: true,
      hrGrade: true,
      role: {
        select: {
          name: true,
        },
      },
    },
  },
  approvedBy: {
    select: {
      id: true,
      fullName: true,
      email: true,
      employeeCode: true,
      department: true,
      hrGrade: true,
      role: {
        select: {
          name: true,
        },
      },
    },
  },
};

async function getDepartmentManagersMap() {
  const managers = await prisma.user.findMany({
    where: {
      status: "ACTIVE",
      role: {
        name: "MANAGER",
      },
      department: {
        not: null,
      },
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      department: true,
    },
  });

  const map = new Map<string, { id: string; fullName: string; email: string; department: string | null }>();
  for (const mgr of managers) {
    if (mgr.department && !map.has(mgr.department.toLowerCase())) {
      map.set(mgr.department.toLowerCase(), mgr);
    }
  }
  return map;
}

function formatTravelRequest<
  T extends {
    accommodationRequired: boolean;
    travelMode?: string | null;
    employee?: { department?: string | null } | null;
  }
>(
  req: T,
  deptManagersMap?: Map<string, { id: string; fullName: string; email: string; department: string | null }>
) {
  const empDept = req.employee?.department;
  const departmentManager =
    empDept && deptManagersMap
      ? deptManagersMap.get(empDept.toLowerCase()) ?? null
      : null;

  return {
    ...req,
    requiresAccommodation: req.accommodationRequired,
    travelMode: req.travelMode || "COMPANY_VEHICLE",
    departmentManager,
  };
}

export async function createTravelRequest(
  employeeId: string,
  data: CreateTravelRequestInput
) {
  const employee = await prisma.user.findUnique({
    where: {
      id: employeeId,
    },
    include: {
      role: true,
    },
  });

  if (!employee) {
    throw new Error("Employee not found");
  }

  const isAccomRequired =
    typeof data.accommodationRequired === "boolean"
      ? data.accommodationRequired
      : typeof data.requiresAccommodation === "boolean"
      ? data.requiresAccommodation
      : false;

  const isTransportRequired =
    typeof data.transportRequired === "boolean"
      ? data.transportRequired
      : false;

  const travelMode = data.travelMode || "COMPANY_VEHICLE";

  const created = await prisma.travelRequest.create({
    data: {
      employeeId,
      travelType: data.travelType,
      travelMode,
      urgency: data.urgency,
      purpose: data.purpose,
      fromLocation: data.fromLocation,
      toLocation: data.toLocation,
      departureDate: new Date(data.departureDate),
      returnDate: data.returnDate ? new Date(data.returnDate) : undefined,
      accommodationRequired: isAccomRequired,
      transportRequired: isTransportRequired,
      estimatedBudget: data.estimatedBudget,
      employeeRemarks: data.employeeRemarks ?? data.notes,
    },
    include: travelRequestInclude,
  });

  if (employee.department) {
    const deptManagers = await prisma.user.findMany({
      where: {
        status: "ACTIVE",
        department: employee.department,
        role: {
          name: "MANAGER",
        },
      },
      select: { id: true },
    });

    for (const mgr of deptManagers) {
      if (mgr.id !== employeeId) {
        await createNotification(employeeId, {
          recipientId: mgr.id,
          type: NotificationType.TRAVEL_REQUEST,
          priority: NotificationPriority.HIGH,
          title: `New Travel Request (${employee.department})`,
          message: `${employee.fullName} (${employee.department}) submitted a travel request from ${created.fromLocation} to ${created.toLocation}.`,
          entityType: "TravelRequest",
          entityId: created.id,
        });
      }
    }
  }

  const deptManagersMap = await getDepartmentManagersMap();
  return formatTravelRequest(created, deptManagersMap);
}

export async function getMyTravelRequests(employeeId: string) {
  const [requests, deptManagersMap] = await Promise.all([
    prisma.travelRequest.findMany({
      where: {
        employeeId,
      },
      include: travelRequestInclude,
      orderBy: {
        createdAt: "desc",
      },
    }),
    getDepartmentManagersMap(),
  ]);

  return requests.map((r) => formatTravelRequest(r, deptManagersMap));
}

export async function getAllTravelRequests(currentUser?: AuthUser) {
  let whereClause: any = {};

  if (currentUser?.role === "MANAGER") {
    const manager = await prisma.user.findUnique({
      where: { id: currentUser.userId },
      select: { department: true },
    });

    whereClause = {
      employee: {
        department: manager?.department ?? "__UNASSIGNED_DEPT__",
      },
    };
  }

  const [requests, deptManagersMap] = await Promise.all([
    prisma.travelRequest.findMany({
      where: whereClause,
      include: travelRequestInclude,
      orderBy: {
        createdAt: "desc",
      },
    }),
    getDepartmentManagersMap(),
  ]);

  return requests.map((r) => formatTravelRequest(r, deptManagersMap));
}

export async function getPendingTravelRequests(currentUser?: AuthUser) {
  const whereClause: any = {
    status: TravelRequestStatus.PENDING,
  };

  if (currentUser?.role === "MANAGER") {
    const manager = await prisma.user.findUnique({
      where: { id: currentUser.userId },
      select: { department: true },
    });

    whereClause.employee = {
      department: manager?.department ?? "__UNASSIGNED_DEPT__",
    };
  }

  const [requests, deptManagersMap] = await Promise.all([
    prisma.travelRequest.findMany({
      where: whereClause,
      include: travelRequestInclude,
      orderBy: {
        createdAt: "desc",
      },
    }),
    getDepartmentManagersMap(),
  ]);

  return requests.map((r) => formatTravelRequest(r, deptManagersMap));
}

export async function getTravelRequestById(id: string) {
  const [request, deptManagersMap] = await Promise.all([
    prisma.travelRequest.findUnique({
      where: {
        id,
      },
      include: travelRequestInclude,
    }),
    getDepartmentManagersMap(),
  ]);

  if (!request) {
    throw new Error("Travel request not found");
  }

  return formatTravelRequest(request, deptManagersMap);
}

export async function updateTravelRequest(
  id: string,
  currentUser: AuthUser,
  data: UpdateTravelRequestInput
) {
  const request = await getTravelRequestById(id);

  if (request.employeeId !== currentUser.userId) {
    throw new Error("You can only update your own travel request");
  }

  if (request.status !== TravelRequestStatus.PENDING) {
    throw new Error("Only pending travel requests can be updated");
  }

  const isAccomRequired =
    typeof data.accommodationRequired === "boolean"
      ? data.accommodationRequired
      : typeof data.requiresAccommodation === "boolean"
      ? data.requiresAccommodation
      : undefined;

  const isTransportRequired =
    typeof data.transportRequired === "boolean"
      ? data.transportRequired
      : undefined;

  const updated = await prisma.travelRequest.update({
    where: {
      id,
    },
    data: {
      travelType: data.travelType,
      travelMode: data.travelMode,
      urgency: data.urgency,
      purpose: data.purpose,
      fromLocation: data.fromLocation,
      toLocation: data.toLocation,
      departureDate: data.departureDate
        ? new Date(data.departureDate)
        : undefined,
      returnDate: data.returnDate ? new Date(data.returnDate) : undefined,
      accommodationRequired: isAccomRequired,
      transportRequired: isTransportRequired,
      estimatedBudget: data.estimatedBudget,
      employeeRemarks: data.employeeRemarks ?? data.notes,
    },
    include: travelRequestInclude,
  });

  return formatTravelRequest(updated);
}

async function enforceDepartmentManagerAccess(
  actorId: string,
  employeeDepartment?: string | null
) {
  const actor = await prisma.user.findUnique({
    where: { id: actorId },
    include: { role: true },
  });

  if (!actor) {
    throw new Error("Approver account not found");
  }

  if (actor.role.name === "MANAGER") {
    if (!actor.department) {
      throw new Error(
        "Your manager profile does not have a department assigned. Please contact Super Admin."
      );
    }

    if (
      !employeeDepartment ||
      actor.department.toLowerCase() !== employeeDepartment.toLowerCase()
    ) {
      throw new Error(
        `Department mismatch: You manage the ${actor.department} department and can only approve or reject requests for ${actor.department} employees (this employee belongs to ${employeeDepartment || "Unassigned"}).`
      );
    }
  }
}

export async function approveTravelRequest(
  id: string,
  managerId: string,
  data: DecisionTravelRequestInput
) {
  const request = await getTravelRequestById(id);

  if (request.status !== TravelRequestStatus.PENDING) {
    throw new Error("Only pending travel requests can be approved");
  }

  if (request.employeeId === managerId) {
    throw new Error(
      "Managers cannot self-approve their own travel requests. Approval must be conducted by another manager or Super Admin."
    );
  }

  await enforceDepartmentManagerAccess(
    managerId,
    request.employee?.department
  );

  const [updatedRequest, deptManagersMap] = await Promise.all([
    prisma.travelRequest.update({
      where: {
        id,
      },
      data: {
        status: TravelRequestStatus.APPROVED,
        approvedById: managerId,
        decisionRemarks: data.decisionRemarks ?? (data as any).managerRemarks,
        decidedAt: new Date(),
      },
      include: travelRequestInclude,
    }),
    getDepartmentManagersMap(),
  ]);

  await createNotification(managerId, {
    recipientId: updatedRequest.employeeId,
    type: NotificationType.TRAVEL_REQUEST,
    priority: NotificationPriority.HIGH,
    title: "Travel Request Approved",
    message: `Your travel request from ${updatedRequest.fromLocation} to ${updatedRequest.toLocation} has been approved by ${updatedRequest.approvedBy?.fullName || "your Department Manager"}.`,
    entityType: "TravelRequest",
    entityId: updatedRequest.id,
  });

  return formatTravelRequest(updatedRequest, deptManagersMap);
}

export async function rejectTravelRequest(
  id: string,
  managerId: string,
  data: DecisionTravelRequestInput
) {
  const request = await getTravelRequestById(id);

  if (request.status !== TravelRequestStatus.PENDING) {
    throw new Error("Only pending travel requests can be rejected");
  }

  await enforceDepartmentManagerAccess(
    managerId,
    request.employee?.department
  );

  const [rejected, deptManagersMap] = await Promise.all([
    prisma.travelRequest.update({
      where: {
        id,
      },
      data: {
        status: TravelRequestStatus.REJECTED,
        approvedById: managerId,
        decisionRemarks: data.decisionRemarks ?? (data as any).managerRemarks,
        decidedAt: new Date(),
      },
      include: travelRequestInclude,
    }),
    getDepartmentManagersMap(),
  ]);

  return formatTravelRequest(rejected, deptManagersMap);
}

export async function cancelTravelRequest(
  id: string,
  currentUser: AuthUser,
  data: CancelTravelRequestInput
) {
  const request = await getTravelRequestById(id);

  const isAdmin =
    currentUser.role === "SUPER_ADMIN" || currentUser.role === "MANAGER";

  const isOwner = request.employeeId === currentUser.userId;

  if (!isAdmin && !isOwner) {
    throw new Error("You can only cancel your own travel request");
  }

  if (request.status !== TravelRequestStatus.PENDING) {
    throw new Error("Only pending travel requests can be cancelled");
  }

  const cancelled = await prisma.travelRequest.update({
    where: {
      id,
    },
    data: {
      status: TravelRequestStatus.CANCELLED,
      employeeRemarks: data.employeeRemarks ?? (data as any).remarks,
      decidedAt: new Date(),
    },
    include: travelRequestInclude,
  });

  return formatTravelRequest(cancelled);
}