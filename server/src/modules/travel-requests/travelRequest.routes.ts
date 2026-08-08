import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { authorizeRoles } from "../../middleware/role.middleware";
import {
  approveTravelRequestController,
  cancelTravelRequestController,
  createTravelRequestController,
  getAllTravelRequestsController,
  getMyTravelRequestsController,
  getPendingTravelRequestsController,
  getTravelRequestByIdController,
  rejectTravelRequestController,
} from "./travelRequest.controller";

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
  createTravelRequestController
);

router.get(
  "/my",
  authorizeRoles(...allStaffRoles),
  getMyTravelRequestsController
);

router.get(
  "/pending",
  authorizeRoles("MANAGER", "SUPER_ADMIN"),
  getPendingTravelRequestsController
);

router.get(
  "/",
  authorizeRoles("MANAGER", "SUPER_ADMIN"),
  getAllTravelRequestsController
);

router.patch(
  "/:id/approve",
  authorizeRoles("MANAGER", "SUPER_ADMIN"),
  approveTravelRequestController
);

router.patch(
  "/:id/reject",
  authorizeRoles("MANAGER", "SUPER_ADMIN"),
  rejectTravelRequestController
);

router.patch(
  "/:id/cancel",
  authorizeRoles(...allStaffRoles),
  cancelTravelRequestController
);

router.get(
  "/:id",
  authorizeRoles(...allStaffRoles),
  getTravelRequestByIdController
);

export default router;