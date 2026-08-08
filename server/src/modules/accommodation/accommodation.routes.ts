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

const allStaffRoles = [
  "EMPLOYEE",
  "MANAGER",
  "TRANSPORT_ADMIN",
  "ACCOMMODATION_ADMIN",
  "FINANCE_OFFICER",
  "SECURITY_OFFICER",
  "SUPER_ADMIN",
];

// Room Routes
router.post("/rooms", authorizeRoles("SUPER_ADMIN", "ACCOMMODATION_ADMIN"), createRoomController);
router.get("/rooms", authorizeRoles(...allStaffRoles), getAllRoomsController);
router.get("/rooms/available", authorizeRoles(...allStaffRoles), getAvailableRoomsController);
router.get("/rooms/:id", authorizeRoles(...allStaffRoles), getRoomByIdController);
router.patch("/rooms/:id", authorizeRoles("SUPER_ADMIN", "ACCOMMODATION_ADMIN"), updateRoomController);
router.patch("/rooms/:id/deactivate", authorizeRoles("SUPER_ADMIN", "ACCOMMODATION_ADMIN"), deactivateRoomController);

// Travel Requests assigned for accommodation
router.get("/approved-travel-requests", authorizeRoles("SUPER_ADMIN", "ACCOMMODATION_ADMIN", "MANAGER"), getApprovedAccommodationRequestsController);

// Reservation Routes
router.post("/reservations", authorizeRoles("SUPER_ADMIN", "ACCOMMODATION_ADMIN"), createReservationController);
router.patch("/reservations/:id", authorizeRoles("SUPER_ADMIN", "ACCOMMODATION_ADMIN"), updateReservationController);
router.get("/reservations", authorizeRoles("SUPER_ADMIN", "ACCOMMODATION_ADMIN", "MANAGER"), getAllReservationsController);
router.get("/reservations/:id", authorizeRoles("SUPER_ADMIN", "ACCOMMODATION_ADMIN", "MANAGER"), getReservationByIdController);
router.patch("/reservations/:id/check-in", authorizeRoles("SUPER_ADMIN", "ACCOMMODATION_ADMIN"), checkInReservationController);
router.patch("/reservations/:id/check-out", authorizeRoles("SUPER_ADMIN", "ACCOMMODATION_ADMIN"), checkOutReservationController);
router.patch("/reservations/:id/cancel", authorizeRoles("SUPER_ADMIN", "ACCOMMODATION_ADMIN"), cancelReservationController);

export default router;