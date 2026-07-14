import {
  AccommodationType,
  ReservationStatus,
  RoomStatus,
  TravelRequestStatus,
} from "@prisma/client";
import prisma from "../../config/prisma";
import {
  CreateReservationInput,
  CreateRoomInput,
  UpdateReservationInput,
  UpdateReservationStatusInput,
  UpdateRoomInput,
} from "./accommodation.validation";
import { createHousekeepingTaskAfterCheckout } from "../maintenance/maintenance.service";

const roomInclude = {
  reservations: {
    include: {
      employee: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
        },
      },
      travelRequest: true,
    },
    orderBy: {
      createdAt: "desc" as const,
    },
  },
};

const reservationInclude = {
  employee: {
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
    },
  },
  travelRequest: true,
  room: true,
};

export async function createRoom(data: CreateRoomInput) {
  const existingRoom = await prisma.room.findUnique({
    where: { roomNumber: data.roomNumber },
  });

  if (existingRoom) {
    throw new Error("Room with this number already exists");
  }

  return prisma.room.create({
    data: {
      roomNumber: data.roomNumber,
      roomType: data.roomType,
      capacity: data.capacity,
      facilityName: data.facilityName,
      city: data.city,
      dailyRate: data.dailyRate,
      location: data.location || "",
      notes: data.notes,
    },
  });
}

export async function getAllRooms() {
  return prisma.room.findMany({
    include: roomInclude,
    orderBy: { createdAt: "desc" },
  });
}

export async function getAvailableRooms() {
  return prisma.room.findMany({
    where: { status: RoomStatus.AVAILABLE },
    orderBy: { createdAt: "desc" },
  });
}

export async function getRoomById(id: string) {
  const room = await prisma.room.findUnique({
    where: { id },
    include: roomInclude,
  });
  if (!room) throw new Error("Room not found");
  return room;
}

export async function updateRoom(id: string, data: UpdateRoomInput) {
  await getRoomById(id);

  if (data.roomNumber) {
    const existingRoom = await prisma.room.findUnique({
      where: { roomNumber: data.roomNumber },
    });
    if (existingRoom && existingRoom.id !== id) {
      throw new Error("Room with this number already exists");
    }
  }

  return prisma.room.update({
    where: { id },
    data: {
      roomNumber: data.roomNumber,
      roomType: data.roomType,
      capacity: data.capacity,
      facilityName: data.facilityName,
      city: data.city,
      dailyRate: data.dailyRate,
      location: data.location === null ? undefined : data.location,
      status: data.status,
      notes: data.notes,
    },
  });
}

export async function deactivateRoom(id: string) {
  await getRoomById(id);
  return prisma.room.update({
    where: { id },
    data: { status: RoomStatus.INACTIVE },
    include: roomInclude,
  });
}

async function validateApprovedTravelRequest(travelRequestId: string) {
  const travelRequest = await prisma.travelRequest.findUnique({
    where: { id: travelRequestId },
    include: {
      employee: true,
      roomReservation: true,
    },
  });

  if (!travelRequest) throw new Error("Travel request not found");
  if (travelRequest.status !== TravelRequestStatus.APPROVED) {
    throw new Error("Only approved travel requests can be assigned accommodation");
  }
  if (!travelRequest.accommodationRequired) {
    throw new Error("This travel request does not require accommodation");
  }
  if (travelRequest.roomReservation) {
    throw new Error("Accommodation is already assigned for this travel request");
  }

  return travelRequest;
}

export async function getApprovedAccommodationRequests() {
  return prisma.travelRequest.findMany({
    where: {
      status: TravelRequestStatus.APPROVED,
      accommodationRequired: true,
      roomReservation: null, // Only requests that haven't been assigned a room yet
    },
    include: {
      employee: {
        select: { id: true, fullName: true, email: true, department: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function createReservation(data: CreateReservationInput) {
  const travelRequest = await validateApprovedTravelRequest(data.travelRequestId);

  const checkInDate = new Date(data.checkInDate);
  const checkOutDate = new Date(data.checkOutDate);

  if (checkOutDate <= checkInDate) {
    throw new Error("Check-out date must be after check-in date");
  }

  const reservationData: any = {
    travelRequestId: travelRequest.id,
    employeeId: travelRequest.employeeId,
    checkInDate,
    checkOutDate,
    remarks: data.notes,
  };

  if (data.accommodationSource === "INTERNAL") {
    // Validate overlapping reservations for the selected room
    const overlappingReservation = await prisma.roomReservation.findFirst({
      where: {
        roomId: data.roomId!,
        status: { in: [ReservationStatus.CONFIRMED, ReservationStatus.CHECKED_IN] },
        checkInDate: { lt: checkOutDate },
        checkOutDate: { gt: checkInDate },
      },
    });

    if (overlappingReservation) {
      throw new Error("The selected room is already booked for these dates");
    }

    reservationData.accommodationType = AccommodationType.INTERNAL_GUEST_HOUSE;
    reservationData.roomId = data.roomId;
  } else {
    reservationData.accommodationType = AccommodationType.EXTERNAL_HOTEL;
    reservationData.hotelName = data.externalProviderName;
    reservationData.hotelAddress = data.externalAddress;
  }

  return prisma.roomReservation.create({
    data: reservationData,
    include: reservationInclude,
  });
}

export async function updateReservation(id: string, data: UpdateReservationInput) {
  await getReservationById(id);

  const updateData: any = {};

  if (data.checkInDate) updateData.checkInDate = new Date(data.checkInDate);
  if (data.checkOutDate) updateData.checkOutDate = new Date(data.checkOutDate);
  if (data.notes !== undefined) updateData.remarks = data.notes;
  if (data.status) updateData.status = data.status;

  if (data.accommodationSource === "INTERNAL") {
    updateData.accommodationType = AccommodationType.INTERNAL_GUEST_HOUSE;
    updateData.roomId = data.roomId;
    updateData.hotelName = null;
    updateData.hotelAddress = null;
  } else if (data.accommodationSource === "EXTERNAL") {
    updateData.accommodationType = AccommodationType.EXTERNAL_HOTEL;
    updateData.roomId = null;
    updateData.hotelName = data.externalProviderName;
    updateData.hotelAddress = data.externalAddress;
  }

  return prisma.roomReservation.update({
    where: { id },
    data: updateData,
    include: reservationInclude,
  });
}

export async function getAllReservations() {
  return prisma.roomReservation.findMany({
    include: reservationInclude,
    orderBy: { createdAt: "desc" },
  });
}

export async function getReservationById(id: string) {
  const reservation = await prisma.roomReservation.findUnique({
    where: { id },
    include: reservationInclude,
  });

  if (!reservation) throw new Error("Reservation not found");
  return reservation;
}

export async function checkInReservation(id: string) {
  await getReservationById(id);

  return prisma.roomReservation.update({
    where: { id },
    data: {
      status: ReservationStatus.CHECKED_IN,
      checkedInAt: new Date(),
    },
    include: reservationInclude,
  });
}

export async function checkOutReservation(id: string) {
  const reservation = await getReservationById(id);

  const updatedReservation = await prisma.roomReservation.update({
    where: { id },
    data: {
      status: ReservationStatus.CHECKED_OUT,
      checkedOutAt: new Date(),
    },
    include: reservationInclude,
  });

  if (reservation.roomId) {
    await createHousekeepingTaskAfterCheckout(updatedReservation.id);
  }

  return updatedReservation;
}

export async function cancelReservation(
  id: string,
  data: UpdateReservationStatusInput
) {
  await getReservationById(id);

  return prisma.roomReservation.update({
    where: { id },
    data: {
      status: ReservationStatus.CANCELLED,
      remarks: data.remarks,
    },
    include: reservationInclude,
  });
}