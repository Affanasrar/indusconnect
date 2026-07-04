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
  updateTravelRequestController,
} from "./travelRequest.controller";

const router = Router();

router.use(authMiddleware);

router.post(
  "/",
  authorizeRoles("EMPLOYEE", "MANAGER", "SUPER_ADMIN"),
  createTravelRequestController
);

router.get("/my", getMyTravelRequestsController);

router.get(
  "/",
  authorizeRoles(
    "SUPER_ADMIN",
    "MANAGER",
    "TRANSPORT_ADMIN",
    "ACCOMMODATION_ADMIN",
    "FINANCE_OFFICER"
  ),
  getAllTravelRequestsController
);

router.get(
  "/pending",
  authorizeRoles("SUPER_ADMIN", "MANAGER"),
  getPendingTravelRequestsController
);

router.get(
  "/:id",
  authorizeRoles(
    "SUPER_ADMIN",
    "MANAGER",
    "TRANSPORT_ADMIN",
    "ACCOMMODATION_ADMIN",
    "FINANCE_OFFICER"
  ),
  getTravelRequestByIdController
);

router.patch(
  "/:id",
  authorizeRoles("EMPLOYEE", "MANAGER", "SUPER_ADMIN"),
  updateTravelRequestController
);

router.patch(
  "/:id/approve",
  authorizeRoles("SUPER_ADMIN", "MANAGER"),
  approveTravelRequestController
);

router.patch(
  "/:id/reject",
  authorizeRoles("SUPER_ADMIN", "MANAGER"),
  rejectTravelRequestController
);

router.patch("/:id/cancel", cancelTravelRequestController);

export default router;