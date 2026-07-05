import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { authorizeRoles } from "../../middleware/role.middleware";
import {
  createBulkNotificationController,
  createNotificationController,
  getAllNotificationsController,
  getMyNotificationSummaryController,
  getMyNotificationsController,
  getMyUnreadNotificationsController,
  getNotificationByIdController,
  markAllMyNotificationsAsReadController,
  markNotificationAsReadController,
} from "./notification.controller";

const router = Router();

router.use(authMiddleware);

router.get("/my", getMyNotificationsController);
router.get("/my/unread", getMyUnreadNotificationsController);
router.get("/my/summary", getMyNotificationSummaryController);
router.patch("/my/read-all", markAllMyNotificationsAsReadController);

router.patch("/:id/read", markNotificationAsReadController);

router.post(
  "/",
  authorizeRoles(
    "SUPER_ADMIN",
    "TRANSPORT_ADMIN",
    "ACCOMMODATION_ADMIN",
    "FINANCE_OFFICER",
    "MANAGER"
  ),
  createNotificationController
);

router.post(
  "/bulk",
  authorizeRoles(
    "SUPER_ADMIN",
    "TRANSPORT_ADMIN",
    "ACCOMMODATION_ADMIN",
    "FINANCE_OFFICER",
    "MANAGER"
  ),
  createBulkNotificationController
);

router.get(
  "/",
  authorizeRoles("SUPER_ADMIN", "MANAGER"),
  getAllNotificationsController
);

router.get(
  "/:id",
  authorizeRoles("SUPER_ADMIN", "MANAGER"),
  getNotificationByIdController
);

export default router;