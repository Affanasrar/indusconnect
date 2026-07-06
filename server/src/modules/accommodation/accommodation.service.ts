import {
  AccommodationType,
  ReservationStatus,
  RoomStatus,
  TravelRequestStatus,
} from "@prisma/client";
import prisma from "../../config/prisma";
import {
  CreateExternalReservationInput,
  CreateInternalReservationInput,
  CreateRoomInput,
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
    where: {
      roomNumber: data.roomNumber,
    },
  });

  if (existingRoom) {
    throw new Error("Room with this number already exists");
  }

  return prisma.room.create({
    data,
  });
}

export async function getAllRooms() {
  return prisma.room.findMany({
    include: roomInclude,
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getAvailableRooms() {
  return prisma.room.findMany({
    where: {
      status: RoomStatus.AVAILABLE,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getRoomById(id: string) {
  const room = await prisma.room.findUnique({
    where: { id },
    include: roomInclude,
  });

  if (!room) {
    throw new Error("Room not found");
  }

  return room;
}

export async function updateRoom(id: string, data: UpdateRoomInput) {
  await getRoomById(id);

  if (data.roomNumber) {
    const existingRoom = await prisma.room.findUnique({
      where: {
        roomNumber: data.roomNumber,
      },
    });

    if (existingRoom && existingRoom.id !== id) {
      throw new Error("Room with this number already exists");
    }
  }

  return prisma.room.update({
    where: { id },
    data,
  });
}

async function validateApprovedTravelRequest(travelRequestId: string) {
  const travelRequest = await prisma.travelRequest.findUnique({
    where: {
      id: travelRequestId,
    },
    include: {
      employee: true,
      roomReservation: true,
    },
  });

  if (!travelRequest) {
    throw new Error("Travel request not found");
  }

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

async function findAvailableInternalRoom(checkInDate: Date, checkOutDate: Date) {
  const rooms = await prisma.room.findMany({
    where: {
      status: RoomStatus.AVAILABLE,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  for (const room of rooms) {
    const overlappingReservation = await prisma.roomReservation.findFirst({
      where: {
        roomId: room.id,
        status: {
          in: [ReservationStatus.CONFIRMED, ReservationStatus.CHECKED_IN],
        },
        checkInDate: {
          lt: checkOutDate,
        },
        checkOutDate: {
          gt: checkInDate,
        },
      },
    });

    if (!overlappingReservation) {
      return room;
    }
  }

  return null;
}

export async function createInternalFirstReservation(
  data: CreateInternalReservationInput
) {
  const travelRequest = await validateApprovedTravelRequest(data.travelRequestId);

  const checkInDate = new Date(data.checkInDate);
  const checkOutDate = new Date(data.checkOutDate);

  if (checkOutDate <= checkInDate) {
    throw new Error("Check-out date must be after check-in date");
  }

  const availableRoom = await findAvailableInternalRoom(
    checkInDate,
    checkOutDate
  );

  if (!availableRoom) {
    throw new Error(
      "No internal guest house room is available. Use external hotel fallback."
    );
  }

  return prisma.roomReservation.create({
    data: {
      travelRequestId: travelRequest.id,
      employeeId: travelRequest.employeeId,
      accommodationType: AccommodationType.INTERNAL_GUEST_HOUSE,
      roomId: availableRoom.id,
      checkInDate,
      checkOutDate,
      remarks: data.remarks,
    },
    include: reservationInclude,
  });
}

export async function createExternalHotelReservation(
  data: CreateExternalReservationInput
) {
  const travelRequest = await validateApprovedTravelRequest(data.travelRequestId);

  const checkInDate = new Date(data.checkInDate);
  const checkOutDate = new Date(data.checkOutDate);

  if (checkOutDate <= checkInDate) {
    throw new Error("Check-out date must be after check-in date");
  }

  const availableRoom = await findAvailableInternalRoom(
    checkInDate,
    checkOutDate
  );

  if (availableRoom) {
    throw new Error(
      "Internal room is available. External hotel fallback is not allowed."
    );
  }

  return prisma.roomReservation.create({
    data: {
      travelRequestId: travelRequest.id,
      employeeId: travelRequest.employeeId,
      accommodationType: AccommodationType.EXTERNAL_HOTEL,
      hotelName: data.hotelName,
      hotelAddress: data.hotelAddress,
      checkInDate,
      checkOutDate,
      remarks: data.remarks,
    },
    include: reservationInclude,
  });
}

export async function getAllReservations() {
  return prisma.roomReservation.findMany({
    include: reservationInclude,
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getReservationById(id: string) {
  const reservation = await prisma.roomReservation.findUnique({
    where: { id },
    include: reservationInclude,
  });

  if (!reservation) {
    throw new Error("Reservation not found");
  }

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