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

router.post(
  "/",
  authorizeRoles("EMPLOYEE"),
  createShuttleBookingController
);

router.get(
  "/my",
  authorizeRoles("EMPLOYEE"),
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
  authorizeRoles(
    "EMPLOYEE",
    "SUPER_ADMIN",
    "TRANSPORT_ADMIN"
  ),
  cancelShuttleBookingController
);

router.get(
  "/:id",
  authorizeRoles(
    "EMPLOYEE",
    "SUPER_ADMIN",
    "TRANSPORT_ADMIN"
  ),
  getShuttleBookingByIdController
);

// SUB-ROUTES FOR COMMUTE SUBSCRIPTIONS
router.post(
  "/subscriptions",
  authorizeRoles("EMPLOYEE"),
  createShuttleSubscriptionController
);

router.get(
  "/subscriptions/my",
  authorizeRoles("EMPLOYEE"),
  getMyShuttleSubscriptionsController
);

router.patch(
  "/subscriptions/:id/deactivate",
  authorizeRoles("EMPLOYEE", "SUPER_ADMIN", "TRANSPORT_ADMIN"),
  deactivateShuttleSubscriptionController
);

router.post(
  "/subscriptions/trigger-daily",
  authorizeRoles("SUPER_ADMIN", "TRANSPORT_ADMIN"),
  triggerDailyAutoBookingsController
);

export default router;