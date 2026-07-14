import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { authorizeRoles } from "../../middleware/role.middleware";
import {
  cancelReservationController,
  checkInReservationController,
  checkOutReservationController,
  createReservationController,
  createRoomController,
  deactivateRoomController,
  getAllReservationsController,
  getAllRoomsController,
  getApprovedAccommodationRequestsController,
  getAvailableRoomsController,
  getReservationByIdController,
  getRoomByIdController,
  updateReservationController,
  updateRoomController,
} from "./accommodation.controller";

const router = Router();

router.use(authMiddleware);
router.use(authorizeRoles("SUPER_ADMIN", "ACCOMMODATION_ADMIN"));

// Room Routes
router.post("/rooms", createRoomController);
router.get("/rooms", getAllRoomsController);
router.get("/rooms/available", getAvailableRoomsController);
router.get("/rooms/:id", getRoomByIdController);
router.patch("/rooms/:id", updateRoomController);
router.patch("/rooms/:id/deactivate", deactivateRoomController);

// Travel Requests assigned for accommodation
router.get("/approved-travel-requests", getApprovedAccommodationRequestsController);

// Reservation Routes
router.post("/reservations", createReservationController);
router.patch("/reservations/:id", updateReservationController);
router.get("/reservations", getAllReservationsController);
router.get("/reservations/:id", getReservationByIdController);
router.patch("/reservations/:id/check-in", checkInReservationController);
router.patch("/reservations/:id/check-out", checkOutReservationController);
router.patch("/reservations/:id/cancel", cancelReservationController);

export default router;