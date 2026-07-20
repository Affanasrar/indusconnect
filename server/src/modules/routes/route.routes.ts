import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { authorizeRoles } from "../../middleware/role.middleware";
import {
  addSmartStopController,
  cancelRouteController,
  createRouteController,
  deleteSmartStopController,
  getAllRoutesController,
  getRouteByIdController,
  updateRouteController,
  updateSmartStopController,
} from "./route.controller";

const router = Router();

router.use(authMiddleware);

/*
 * Specific nested routes should come before generic "/:id" routes.
 */

// Smart-stop routes
router.post(
  "/:routeId/stops",
  authorizeRoles("SUPER_ADMIN", "TRANSPORT_ADMIN"),
  addSmartStopController
);
router.patch(
  "/stops/:stopId",
  authorizeRoles("SUPER_ADMIN", "TRANSPORT_ADMIN"),
  updateSmartStopController
);
router.delete(
  "/stops/:stopId",
  authorizeRoles("SUPER_ADMIN", "TRANSPORT_ADMIN"),
  deleteSmartStopController
);

// Specific route action
router.patch(
  "/:id/cancel",
  authorizeRoles("SUPER_ADMIN", "TRANSPORT_ADMIN"),
  cancelRouteController
);

// Main route collection
router.get(
  "/",
  authorizeRoles("EMPLOYEE", "DRIVER", "SUPER_ADMIN", "TRANSPORT_ADMIN"),
  getAllRoutesController
);
router.post(
  "/",
  authorizeRoles("SUPER_ADMIN", "TRANSPORT_ADMIN"),
  createRouteController
);

// Generic route ID endpoints
router.get(
  "/:id",
  authorizeRoles("EMPLOYEE", "DRIVER", "SUPER_ADMIN", "TRANSPORT_ADMIN"),
  getRouteByIdController
);
router.patch(
  "/:id",
  authorizeRoles("SUPER_ADMIN", "TRANSPORT_ADMIN"),
  updateRouteController
);

export default router;