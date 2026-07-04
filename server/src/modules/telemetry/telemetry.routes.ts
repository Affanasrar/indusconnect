import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { authorizeRoles } from "../../middleware/role.middleware";
import {
  createTelemetryController,
  getEmergencyTelemetryEventsController,
  getLatestVehicleLocationsController,
  getMyTelemetryLogsController,
  getTelemetryByDriverController,
  getTelemetryByRouteController,
} from "./telemetry.controller";

const router = Router();

router.use(authMiddleware);

router.post(
  "/update",
  authorizeRoles("DRIVER"),
  createTelemetryController
);

router.get(
  "/my",
  authorizeRoles("DRIVER"),
  getMyTelemetryLogsController
);

router.get(
  "/live",
  authorizeRoles("SUPER_ADMIN", "TRANSPORT_ADMIN", "SECURITY_OFFICER"),
  getLatestVehicleLocationsController
);

router.get(
  "/emergency",
  authorizeRoles("SUPER_ADMIN", "TRANSPORT_ADMIN", "SECURITY_OFFICER"),
  getEmergencyTelemetryEventsController
);

router.get(
  "/routes/:routeId",
  authorizeRoles("SUPER_ADMIN", "TRANSPORT_ADMIN", "SECURITY_OFFICER"),
  getTelemetryByRouteController
);

router.get(
  "/drivers/:driverId",
  authorizeRoles("SUPER_ADMIN", "TRANSPORT_ADMIN", "SECURITY_OFFICER"),
  getTelemetryByDriverController
);

export default router;