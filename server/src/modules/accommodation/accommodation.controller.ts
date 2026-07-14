import { Request, Response } from "express";
import {
  createReservationSchema,
  createRoomSchema,
  updateReservationSchema,
  updateReservationStatusSchema,
  updateRoomSchema,
} from "./accommodation.validation";
import {
  cancelReservation,
  checkInReservation,
  checkOutReservation,
  createReservation,
  createRoom,
  deactivateRoom,
  getAllReservations,
  getAllRooms,
  getApprovedAccommodationRequests,
  getAvailableRooms,
  getReservationById,
  getRoomById,
  updateReservation,
  updateRoom,
} from "./accommodation.service";

export async function createRoomController(req: Request, res: Response) {
  try {
    const validatedData = createRoomSchema.parse(req.body);
    const room = await createRoom(validatedData);

    return res.status(201).json({
      success: true,
      message: "Room created successfully",
      data: room,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to create room",
    });
  }
}

export async function getAllRoomsController(_req: Request, res: Response) {
  try {
    const rooms = await getAllRooms();

    return res.status(200).json({
      success: true,
      message: "Rooms fetched successfully",
      data: rooms,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to fetch rooms",
    });
  }
}

export async function getAvailableRoomsController(_req: Request, res: Response) {
  try {
    const rooms = await getAvailableRooms();

    return res.status(200).json({
      success: true,
      message: "Available rooms fetched successfully",
      data: rooms,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to fetch available rooms",
    });
  }
}

export async function getRoomByIdController(req: Request, res: Response) {
  try {
    const room = await getRoomById(String(req.params.id));

    return res.status(200).json({
      success: true,
      message: "Room fetched successfully",
      data: room,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error instanceof Error ? error.message : "Room not found",
    });
  }
}

export async function updateRoomController(req: Request, res: Response) {
  try {
    const validatedData = updateRoomSchema.parse(req.body);
    const room = await updateRoom(String(req.params.id), validatedData);

    return res.status(200).json({
      success: true,
      message: "Room updated successfully",
      data: room,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to update room",
    });
  }
}

export async function deactivateRoomController(req: Request, res: Response) {
  try {
    const room = await deactivateRoom(String(req.params.id));

    return res.status(200).json({
      success: true,
      message: "Room deactivated successfully",
      data: room,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to deactivate room",
    });
  }
}

export async function getApprovedAccommodationRequestsController(_req: Request, res: Response) {
  try {
    const requests = await getApprovedAccommodationRequests();

    return res.status(200).json({
      success: true,
      message: "Approved travel requests fetched successfully",
      data: requests,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to fetch travel requests",
    });
  }
}

export async function createReservationController(req: Request, res: Response) {
  try {
    const validatedData = createReservationSchema.parse(req.body);
    const reservation = await createReservation(validatedData);

    return res.status(201).json({
      success: true,
      message: "Reservation created successfully",
      data: reservation,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to create reservation",
    });
  }
}

export async function updateReservationController(req: Request, res: Response) {
  try {
    const validatedData = updateReservationSchema.parse(req.body);
    const reservation = await updateReservation(String(req.params.id), validatedData);

    return res.status(200).json({
      success: true,
      message: "Reservation updated successfully",
      data: reservation,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to update reservation",
    });
  }
}

export async function getAllReservationsController(_req: Request, res: Response) {
  try {
    const reservations = await getAllReservations();

    return res.status(200).json({
      success: true,
      message: "Reservations fetched successfully",
      data: reservations,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to fetch reservations",
    });
  }
}

export async function getReservationByIdController(req: Request, res: Response) {
  try {
    const reservation = await getReservationById(String(req.params.id));

    return res.status(200).json({
      success: true,
      message: "Reservation fetched successfully",
      data: reservation,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error instanceof Error ? error.message : "Reservation not found",
    });
  }
}

export async function checkInReservationController(req: Request, res: Response) {
  try {
    const reservation = await checkInReservation(String(req.params.id));

    return res.status(200).json({
      success: true,
      message: "Guest checked in successfully",
      data: reservation,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to check in guest",
    });
  }
}

export async function checkOutReservationController(req: Request, res: Response) {
  try {
    const reservation = await checkOutReservation(String(req.params.id));

    return res.status(200).json({
      success: true,
      message: "Guest checked out successfully",
      data: reservation,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to check out guest",
    });
  }
}

export async function cancelReservationController(req: Request, res: Response) {
  try {
    const validatedData = updateReservationStatusSchema.parse({
      ...req.body,
      status: "CANCELLED",
    });

    const reservation = await cancelReservation(String(req.params.id), validatedData);

    return res.status(200).json({
      success: true,
      message: "Reservation cancelled successfully",
      data: reservation,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to cancel reservation",
    });
  }
}