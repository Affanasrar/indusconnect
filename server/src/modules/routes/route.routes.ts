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
router.use(authorizeRoles("SUPER_ADMIN", "TRANSPORT_ADMIN"));

/*
 * Specific nested routes should come before generic "/:id" routes.
 */

// Smart-stop routes
router.post("/:routeId/stops", addSmartStopController);
router.patch("/stops/:stopId", updateSmartStopController);
router.delete("/stops/:stopId", deleteSmartStopController);

// Specific route action
router.patch("/:id/cancel", cancelRouteController);

// Main route collection
router.get("/", getAllRoutesController);
router.post("/", createRouteController);

// Generic route ID endpoints
router.get("/:id", getRouteByIdController);
router.patch("/:id", updateRouteController);

export default router;