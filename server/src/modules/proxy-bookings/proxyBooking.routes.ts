import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { authorizeRoles } from "../../middleware/role.middleware";
import {
  createProxyShuttleBookingController,
  createProxyTravelRequestController,
  getAllProxyRecordsController,
  getMyCreatedProxyRecordsController,
} from "./proxyBooking.controller";

const router = Router();

router.use(authMiddleware);

router.post(
  "/travel-requests",
  authorizeRoles("SUPER_ADMIN", "MANAGER"),
  createProxyTravelRequestController
);

router.post(
  "/shuttle-bookings",
  authorizeRoles("SUPER_ADMIN", "MANAGER", "TRANSPORT_ADMIN"),
  createProxyShuttleBookingController
);

router.get(
  "/my-created",
  authorizeRoles("SUPER_ADMIN", "MANAGER", "TRANSPORT_ADMIN"),
  getMyCreatedProxyRecordsController
);

router.get(
  "/all",
  authorizeRoles("SUPER_ADMIN", "MANAGER"),
  getAllProxyRecordsController
);

export default router;