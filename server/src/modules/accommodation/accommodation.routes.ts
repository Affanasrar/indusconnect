import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { authorizeRoles } from "../../middleware/role.middleware";
import {
  cancelReservationController,
  checkInReservationController,
  checkOutReservationController,
  createExternalHotelReservationController,
  createInternalFirstReservationController,
  createRoomController,
  getAllReservationsController,
  getAllRoomsController,
  getAvailableRoomsController,
  getReservationByIdController,
  getRoomByIdController,
  updateRoomController,
} from "./accommodation.controller";

const router = Router();

router.use(authMiddleware);
router.use(authorizeRoles("SUPER_ADMIN", "ACCOMMODATION_ADMIN"));

router.post("/rooms", createRoomController);
router.get("/rooms", getAllRoomsController);
router.get("/rooms/available", getAvailableRoomsController);
router.get("/rooms/:id", getRoomByIdController);
router.patch("/rooms/:id", updateRoomController);

router.post("/reservations/internal-first", createInternalFirstReservationController);
router.post("/reservations/external-hotel", createExternalHotelReservationController);
router.get("/reservations", getAllReservationsController);
router.get("/reservations/:id", getReservationByIdController);
router.patch("/reservations/:id/check-in", checkInReservationController);
router.patch("/reservations/:id/check-out", checkOutReservationController);
router.patch("/reservations/:id/cancel", cancelReservationController);

export default router;