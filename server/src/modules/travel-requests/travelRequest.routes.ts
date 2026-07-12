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

router.post(
  "/",
  authorizeRoles("EMPLOYEE"),
  createTravelRequestController
);

router.get(
  "/my",
  authorizeRoles("EMPLOYEE"),
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
  authorizeRoles("EMPLOYEE", "SUPER_ADMIN"),
  cancelTravelRequestController
);

router.get(
  "/:id",
  authorizeRoles(
    "EMPLOYEE",
    "MANAGER",
    "SUPER_ADMIN"
  ),
  getTravelRequestByIdController
);

export default router;