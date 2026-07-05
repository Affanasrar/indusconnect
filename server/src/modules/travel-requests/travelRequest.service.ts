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

  return prisma.travelRequest.create({
    data: {
      employeeId,
      travelType: data.travelType,
      urgency: data.urgency,
      purpose: data.purpose,
      fromLocation: data.fromLocation,
      toLocation: data.toLocation,
      departureDate: new Date(data.departureDate),
      returnDate: data.returnDate ? new Date(data.returnDate) : undefined,
      accommodationRequired: data.accommodationRequired,
      transportRequired: data.transportRequired,
      estimatedBudget: data.estimatedBudget,
      employeeRemarks: data.employeeRemarks,
    },
    include: travelRequestInclude,
  });
}

export async function getMyTravelRequests(employeeId: string) {
  return prisma.travelRequest.findMany({
    where: {
      employeeId,
    },
    include: travelRequestInclude,
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getAllTravelRequests() {
  return prisma.travelRequest.findMany({
    include: travelRequestInclude,
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getPendingTravelRequests() {
  return prisma.travelRequest.findMany({
    where: {
      status: TravelRequestStatus.PENDING,
    },
    include: travelRequestInclude,
    orderBy: {
      createdAt: "desc",
    },
  });
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

  return request;
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

  return prisma.travelRequest.update({
    where: {
      id,
    },
    data: {
      travelType: data.travelType,
      urgency: data.urgency,
      purpose: data.purpose,
      fromLocation: data.fromLocation,
      toLocation: data.toLocation,
      departureDate: data.departureDate
        ? new Date(data.departureDate)
        : undefined,
      returnDate: data.returnDate ? new Date(data.returnDate) : undefined,
      accommodationRequired: data.accommodationRequired,
      transportRequired: data.transportRequired,
      estimatedBudget: data.estimatedBudget,
      employeeRemarks: data.employeeRemarks,
    },
    include: travelRequestInclude,
  });
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

  const updatedRequest = await prisma.travelRequest.update({
  where: {
    id,
  },
  data: {
    status: TravelRequestStatus.APPROVED,
    approvedById: managerId,
    decisionRemarks: data.decisionRemarks,
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

return updatedRequest;

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

  return prisma.travelRequest.update({
    where: {
      id,
    },
    data: {
      status: TravelRequestStatus.REJECTED,
      approvedById: managerId,
      decisionRemarks: data.decisionRemarks,
      decidedAt: new Date(),
    },
    include: travelRequestInclude,
  });
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

  return prisma.travelRequest.update({
    where: {
      id,
    },
    data: {
      status: TravelRequestStatus.CANCELLED,
      employeeRemarks: data.employeeRemarks,
      decidedAt: new Date(),
    },
    include: travelRequestInclude,
  });
}