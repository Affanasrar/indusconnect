import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { authorizeRoles } from "../../middleware/role.middleware";
import {
  cancelHousekeepingTaskController,
  cancelVehicleMaintenanceTaskController,
  completeHousekeepingTaskController,
  createHousekeepingTaskAfterCheckoutController,
  createHousekeepingTaskController,
  createVehicleMaintenanceTaskController,
  getAllHousekeepingTasksController,
  getAllVehicleMaintenanceTasksController,
  getHousekeepingTaskByIdController,
  getOpenVehicleMaintenanceTasksController,
  getPendingHousekeepingTasksController,
  getVehicleMaintenanceTaskByIdController,
  resolveVehicleMaintenanceTaskController,
  startHousekeepingTaskController,
  startVehicleMaintenanceTaskController,
  updateHousekeepingTaskController,
  updateVehicleMaintenanceTaskController,
} from "./maintenance.controller";

const router = Router();

router.use(authMiddleware);

router.post(
  "/vehicle-tasks",
  authorizeRoles("SUPER_ADMIN", "TRANSPORT_ADMIN", "DRIVER"),
  createVehicleMaintenanceTaskController
);

router.get(
  "/vehicle-tasks",
  authorizeRoles("SUPER_ADMIN", "TRANSPORT_ADMIN"),
  getAllVehicleMaintenanceTasksController
);

router.get(
  "/vehicle-tasks/open",
  authorizeRoles("SUPER_ADMIN", "TRANSPORT_ADMIN"),
  getOpenVehicleMaintenanceTasksController
);

router.get(
  "/vehicle-tasks/:id",
  authorizeRoles("SUPER_ADMIN", "TRANSPORT_ADMIN"),
  getVehicleMaintenanceTaskByIdController
);

router.patch(
  "/vehicle-tasks/:id",
  authorizeRoles("SUPER_ADMIN", "TRANSPORT_ADMIN"),
  updateVehicleMaintenanceTaskController
);

router.patch(
  "/vehicle-tasks/:id/start",
  authorizeRoles("SUPER_ADMIN", "TRANSPORT_ADMIN"),
  startVehicleMaintenanceTaskController
);

router.patch(
  "/vehicle-tasks/:id/resolve",
  authorizeRoles("SUPER_ADMIN", "TRANSPORT_ADMIN"),
  resolveVehicleMaintenanceTaskController
);

router.patch(
  "/vehicle-tasks/:id/cancel",
  authorizeRoles("SUPER_ADMIN", "TRANSPORT_ADMIN"),
  cancelVehicleMaintenanceTaskController
);

router.post(
  "/housekeeping-tasks",
  authorizeRoles("SUPER_ADMIN", "ACCOMMODATION_ADMIN"),
  createHousekeepingTaskController
);

router.post(
  "/housekeeping-tasks/from-checkout/:reservationId",
  authorizeRoles("SUPER_ADMIN", "ACCOMMODATION_ADMIN"),
  createHousekeepingTaskAfterCheckoutController
);

router.get(
  "/housekeeping-tasks",
  authorizeRoles("SUPER_ADMIN", "ACCOMMODATION_ADMIN"),
  getAllHousekeepingTasksController
);

router.get(
  "/housekeeping-tasks/pending",
  authorizeRoles("SUPER_ADMIN", "ACCOMMODATION_ADMIN"),
  getPendingHousekeepingTasksController
);

router.get(
  "/housekeeping-tasks/:id",
  authorizeRoles("SUPER_ADMIN", "ACCOMMODATION_ADMIN"),
  getHousekeepingTaskByIdController
);

router.patch(
  "/housekeeping-tasks/:id",
  authorizeRoles("SUPER_ADMIN", "ACCOMMODATION_ADMIN"),
  updateHousekeepingTaskController
);

router.patch(
  "/housekeeping-tasks/:id/start",
  authorizeRoles("SUPER_ADMIN", "ACCOMMODATION_ADMIN"),
  startHousekeepingTaskController
);

router.patch(
  "/housekeeping-tasks/:id/complete",
  authorizeRoles("SUPER_ADMIN", "ACCOMMODATION_ADMIN"),
  completeHousekeepingTaskController
);

router.patch(
  "/housekeeping-tasks/:id/cancel",
  authorizeRoles("SUPER_ADMIN", "ACCOMMODATION_ADMIN"),
  cancelHousekeepingTaskController
);

export default router;