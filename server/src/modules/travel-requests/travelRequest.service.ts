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
      role: {
        select: {
          name: true,
        },
      },
    },
  },
};

function formatTravelRequest<T extends { accommodationRequired: boolean; travelMode?: string | null }>(req: T) {
  return {
    ...req,
    requiresAccommodation: req.accommodationRequired,
    travelMode: req.travelMode || "COMPANY_VEHICLE",
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

  return formatTravelRequest(created);
}

export async function getMyTravelRequests(employeeId: string) {
  const requests = await prisma.travelRequest.findMany({
    where: {
      employeeId,
    },
    include: travelRequestInclude,
    orderBy: {
      createdAt: "desc",
    },
  });

  return requests.map(formatTravelRequest);
}

export async function getAllTravelRequests() {
  const requests = await prisma.travelRequest.findMany({
    include: travelRequestInclude,
    orderBy: {
      createdAt: "desc",
    },
  });

  return requests.map(formatTravelRequest);
}

export async function getPendingTravelRequests() {
  const requests = await prisma.travelRequest.findMany({
    where: {
      status: TravelRequestStatus.PENDING,
    },
    include: travelRequestInclude,
    orderBy: {
      createdAt: "desc",
    },
  });

  return requests.map(formatTravelRequest);
}

export async function getTravelRequestById(id: string) {
  const request = await prisma.travelRequest.findUnique({
    where: {
      id,
    },
    include: travelRequestInclude,
  });

  if (!request) {
    throw new Error("Travel request not found");
  }

  return formatTravelRequest(request);
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

  const updatedRequest = await prisma.travelRequest.update({
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
  });

  await createNotification(managerId, {
    recipientId: updatedRequest.employeeId,
    type: NotificationType.TRAVEL_REQUEST,
    priority: NotificationPriority.HIGH,
    title: "Travel Request Approved",
    message: `Your travel request from ${updatedRequest.fromLocation} to ${updatedRequest.toLocation} has been approved.`,
    entityType: "TravelRequest",
    entityId: updatedRequest.id,
  });

  return formatTravelRequest(updatedRequest);
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

  const rejected = await prisma.travelRequest.update({
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
  });

  return formatTravelRequest(rejected);
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