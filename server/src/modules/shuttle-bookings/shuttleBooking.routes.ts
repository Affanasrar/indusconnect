import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { authorizeRoles } from "../../middleware/role.middleware";
import {
  assignShuttleBookingController,
  cancelShuttleBookingController,
  createShuttleBookingController,
  getAllShuttleBookingsController,
  getMyShuttleBookingsController,
  getShuttleBookingByIdController,
  createShuttleSubscriptionController,
  getMyShuttleSubscriptionsController,
  deactivateShuttleSubscriptionController,
  triggerDailyAutoBookingsController,
} from "./shuttleBooking.controller";

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

router.post(
  "/",
  authorizeRoles(...allStaffRoles),
  createShuttleBookingController
);

router.get(
  "/my",
  authorizeRoles(...allStaffRoles),
  getMyShuttleBookingsController
);

router.get(
  "/",
  authorizeRoles("SUPER_ADMIN", "TRANSPORT_ADMIN"),
  getAllShuttleBookingsController
);

router.patch(
  "/:id/assign",
  authorizeRoles("SUPER_ADMIN", "TRANSPORT_ADMIN"),
  assignShuttleBookingController
);

router.patch(
  "/:id/cancel",
  authorizeRoles(...allStaffRoles),
  cancelShuttleBookingController
);

router.get(
  "/:id",
  authorizeRoles(...allStaffRoles),
  getShuttleBookingByIdController
);

// SUB-ROUTES FOR COMMUTE SUBSCRIPTIONS
router.post(
  "/subscriptions",
  authorizeRoles(...allStaffRoles),
  createShuttleSubscriptionController
);

router.get(
  "/subscriptions/my",
  authorizeRoles(...allStaffRoles),
  getMyShuttleSubscriptionsController
);

router.patch(
  "/subscriptions/:id/deactivate",
  authorizeRoles(...allStaffRoles),
  deactivateShuttleSubscriptionController
);

router.post(
  "/subscriptions/trigger-daily",
  authorizeRoles("SUPER_ADMIN", "TRANSPORT_ADMIN"),
  triggerDailyAutoBookingsController
);

export default router;