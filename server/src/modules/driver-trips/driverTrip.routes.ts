import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { authorizeRoles } from "../../middleware/role.middleware";
import {
  endTripController,
  getMyAssignedRoutesController,
  getMyDriverTripsController,
  getMyRouteManifestController,
  markPassengerBoardedController,
  markPassengerNoShowController,
  reportTripIssueController,
  startTripController,
  submitSafetyChecklistController,
} from "./driverTrip.controller";

const router = Router();

router.use(authMiddleware);
router.use(authorizeRoles("DRIVER", "TRANSPORT_ADMIN"));

router.get(
  "/",
  getMyAssignedRoutesController
);

router.get(
  "/routes",
  getMyAssignedRoutesController
);

router.get(
  "/trips",
  getMyDriverTripsController
);

router.get(
  "/manifest/:routeId",
  getMyRouteManifestController
);

router.post(
  "/:routeId/checklist",
  submitSafetyChecklistController
);

router.post(
  "/:routeId/start",
  startTripController
);

router.patch(
  "/:routeId/passengers/:bookingId/board",
  markPassengerBoardedController
);

router.patch(
  "/:routeId/passengers/:bookingId/no-show",
  markPassengerNoShowController
);

router.post(
  "/:routeId/report-issue",
  reportTripIssueController
);

router.post(
  "/:routeId/end",
  endTripController
);

export default router;